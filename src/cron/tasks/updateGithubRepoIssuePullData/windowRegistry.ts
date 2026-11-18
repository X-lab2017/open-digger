import { createHash } from 'crypto';
import { query } from '../../../db/clickhouse';
import { formatDate } from '../../../utils';
import { FileStateStore } from './stateStore';
import {
  SyncTaskConfig,
  SyncTimeRange,
  RepositoryCandidateState,
  WindowSyncMetadata,
} from './types';

type Logger = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

const scopeVersion = 2;

const asIsoDate = (value: unknown, field: string, index: number): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`GitHub sync timeRanges[${index}].${field} must be a non-empty date string.`);
  }
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error(`GitHub sync timeRanges[${index}].${field} is not a valid date: ${value}`);
  }
  return new Date(timestamp).toISOString();
};

/** Normalize to sorted, non-overlapping, left-closed/right-open UTC ranges. */
export const normalizeTimeRanges = (raw: unknown): SyncTimeRange[] => {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('GitHub sync timeRanges must be an array.');
  const ranges = raw.map((range: any, index) => {
    const start = asIsoDate(range?.start, 'start', index);
    const end = asIsoDate(range?.end, 'end', index);
    if (start >= end) {
      throw new Error(`GitHub sync timeRanges[${index}] must have start earlier than end.`);
    }
    return { start, end };
  }).sort((a, b) => a.start.localeCompare(b.start));

  const merged: SyncTimeRange[] = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (!previous || range.start > previous.end) {
      merged.push({ ...range });
    } else if (range.end > previous.end) {
      previous.end = range.end;
    }
  }
  return merged;
};

export const timeRangeScopeHash = (ranges: SyncTimeRange[]): string =>
  createHash('sha256')
    .update(JSON.stringify({ scopeVersion, ranges }))
    .digest('hex')
    .slice(0, 20);

export const buildWindowRepositoryQuery = (
  ranges: SyncTimeRange[],
  cursorRepoId: number,
  batchSize: number,
): string => {
  if (ranges.length === 0) throw new Error('Cannot build a candidate query without time ranges.');
  const rangeCondition = ranges.map(range =>
    `(events.created_at >= '${formatDate(range.start)}' AND events.created_at < '${formatDate(range.end)}')`,
  ).join('\n    OR ');
  const safeRepoId = Math.max(0, Math.floor(cursorRepoId));
  const safeBatchSize = Math.max(1, Math.floor(batchSize));

  return `
SELECT
  events.repo_id AS candidate_repo_id,
  argMax(events.repo_name, events.created_at) AS latest_repo_name,
  argMax(events.org_id, events.created_at) AS latest_org_id,
  argMax(events.org_login, events.created_at) AS latest_org_login
FROM events
WHERE events.platform = 'GitHub'
  AND events.repo_id > 0
  AND (
    ${rangeCondition}
  )
  AND (
    (events.platform, events.repo_id) IN (
      SELECT platform, entity_id FROM flatten_labels WHERE platform = 'GitHub' AND entity_type = 'Repo'
    )
    OR (events.platform, events.org_id) IN (
      SELECT platform, entity_id FROM flatten_labels WHERE platform = 'GitHub' AND entity_type = 'Org'
    )
  )
  AND events.repo_id > ${safeRepoId}
GROUP BY events.repo_id
ORDER BY candidate_repo_id
LIMIT ${safeBatchSize}`;
};

export class WindowRepositoryRegistry {
  constructor(
    private readonly store: FileStateStore,
    private readonly config: SyncTaskConfig,
    private readonly logger: Logger,
  ) {}

  async ensureScope(): Promise<void> {
    const scopeHash = timeRangeScopeHash(this.config.timeRanges);
    if (this.store.state.windowSync?.scopeHash === scopeHash) return;
    const now = new Date().toISOString();
    const metadata: WindowSyncMetadata = {
      scopeHash,
      timeRanges: this.config.timeRanges,
      cursorRepoId: 0,
      sourceExhausted: false,
      finished: false,
      discoveredCount: 0,
      completedCount: 0,
      skippedCount: 0,
      discoveredItemCount: 0,
      processedItemCount: 0,
      skippedItemCount: 0,
      startedAt: now,
      updatedAt: now,
    };
    await this.store.putWindowState(metadata, []);
    this.logger.info(`Initialized configured-window Issue/PR supplementation scope ${scopeHash}.`);
  }

  /** Finish a completed batch and load the next durable candidate batch. */
  async prepareBatch(): Promise<boolean> {
    let metadata = this.store.state.windowSync;
    if (!metadata || metadata.finished) return false;
    const current = Object.values(this.store.state.repositoryCandidates);
    if (current.some(candidate => !candidate.completed)) return true;

    if (current.length > 0) {
      const now = new Date().toISOString();
      metadata = {
        ...metadata,
        cursorRepoId: metadata.batchLastRepoId ?? metadata.cursorRepoId,
        completedCount: metadata.completedCount + current.length,
        skippedCount: metadata.skippedCount + current.filter(candidate => candidate.skipped).length,
        discoveredItemCount: (metadata.discoveredItemCount ?? 0) +
          current.reduce((sum, candidate) => sum + (candidate.discoveredItemCount ?? 0), 0),
        processedItemCount: (metadata.processedItemCount ?? 0) +
          current.reduce((sum, candidate) => sum + (candidate.processedItemCount ?? 0), 0),
        skippedItemCount: (metadata.skippedItemCount ?? 0) +
          current.reduce((sum, candidate) => sum + (candidate.skippedItemCount ?? 0), 0),
        updatedAt: now,
      };
      metadata.batchLastRepoId = undefined;
      if (metadata.sourceExhausted) {
        metadata.finished = true;
        metadata.completedAt = now;
      }
      await this.store.putWindowState(metadata, []);
      if (metadata.finished) {
        this.logger.info(
          `Configured-window supplementation finished: ${metadata.completedCount} repositories, ` +
          `${metadata.skippedCount} repositories skipped.`,
        );
        return false;
      }
    }

    const rows = await query<any>(buildWindowRepositoryQuery(
      metadata.timeRanges,
      metadata.cursorRepoId,
      this.config.candidateBatchSize,
    ));
    if (rows.length === 0) {
      const now = new Date().toISOString();
      const finished = { ...metadata, sourceExhausted: true, finished: true, updatedAt: now, completedAt: now };
      await this.store.putWindowState(finished, []);
      this.logger.info(`Configured-window supplementation finished: ${finished.completedCount} repositories.`);
      return false;
    }

    const now = new Date().toISOString();
    const candidates = rows.map(row => this.rowToCandidate(row, now));
    const last = candidates[candidates.length - 1];
    const nextMetadata: WindowSyncMetadata = {
      ...metadata,
      batchLastRepoId: last.repoId,
      sourceExhausted: rows.length < this.config.candidateBatchSize,
      discoveredCount: metadata.discoveredCount + candidates.length,
      updatedAt: now,
    };
    await this.store.putWindowState(nextMetadata, candidates);
    this.logger.info(
      `Loaded ${candidates.length} active labeled repositories from global events; ` +
      `${nextMetadata.discoveredCount} repositories discovered in total.`,
    );
    return true;
  }

  private rowToCandidate(row: any[], now: string): RepositoryCandidateState {
    const repoId = Number(row[0]);
    const repoName = String(row[1] ?? '');
    if (!Number.isSafeInteger(repoId) || repoId <= 0) {
      throw new Error(`Invalid repository candidate returned by ClickHouse: ${JSON.stringify(row)}`);
    }
    return {
      key: String(repoId),
      repoId,
      repoName,
      orgId: Number(row[2] ?? 0),
      orgLogin: String(row[3] ?? repoName.split('/')[0] ?? ''),
      listPage: 1,
      enumerationFinished: false,
      itemOffset: 0,
      discoveredItemCount: 0,
      processedItemCount: 0,
      skippedItemCount: 0,
      completed: false,
      nextDueAt: now,
      retryCount: 0,
      discoveredAt: now,
      updatedAt: now,
    };
  }
}
