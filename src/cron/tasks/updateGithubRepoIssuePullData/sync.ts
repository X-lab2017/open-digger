import { insertRecords } from '../../../db/clickhouse';
import { formatDate } from '../../../utils';
import { FileStateStore } from './stateStore';
import { ManagedCredential } from './tokenPool';
import {
  ItemProgress,
  ItemStage,
  IssueReference,
  RepositoryCandidateState,
  SyncTaskConfig,
  SyncTimeRange,
} from './types';

export interface InsertRecord {
  platform: string;
  type: string;
  action: string;
  actor_id: number;
  actor_login: string;
  repo_id: number;
  repo_name: string;
  org_id: number;
  org_login: string;
  created_at?: string;
  issue_id: number;
  issue_number: number;
  issue_title?: string;
  body?: string;
  'issue_labels.name'?: string[];
  'issue_labels.color'?: string[];
  'issue_labels.default'?: number[];
  'issue_labels.description'?: string[];
  issue_author_id?: number;
  issue_author_login?: string;
  issue_created_at?: string;
  issue_updated_at?: string;
  issue_closed_at?: string;
  issue_comment_id?: number;
  issue_comment_created_at?: string;
  issue_comment_updated_at?: string;
  issue_comment_author_id?: number;
  issue_comment_author_login?: string;
  pull_review_comment_id?: number;
  pull_review_comment_created_at?: string;
  pull_review_comment_updated_at?: string;
  pull_review_comment_author_id?: number;
  pull_review_comment_author_login?: string;
  pull_review_id?: number;
  pull_review_state?: string;
  pull_merged?: number;
  pull_additions?: number;
  pull_deletions?: number;
  pull_base_ref?: string;
  pull_head_repo_id?: number;
  pull_head_repo_name?: string;
  pull_head_ref?: string;
  from_api?: number;
}

interface RepositoryIdentity {
  id: number;
  name: string;
  orgId: number;
  orgLogin: string;
}

interface ProcessItemResult {
  complete: boolean;
  pagesProcessed: number;
}

interface CursorPage {
  data: any[];
  nextPageUrl?: string;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const dbDate = (value: string | null | undefined): string | undefined =>
  value ? formatDate(value) : undefined;

const actor = (value: any): { actor_id: number; actor_login: string } => ({
  actor_id: Number(value?.id ?? 0),
  actor_login: String(value?.login ?? ''),
});

const addMinutes = (date: Date, minutes: number): string =>
  new Date(date.getTime() + minutes * 60_000).toISOString();

const errorStatus = (error: any): number | undefined =>
  error?.status ?? error?.response?.status;

const nextPageUrlFromResponse = (response: any): string | undefined => {
  const link = response?.headers?.link;
  if (typeof link !== 'string') return undefined;
  for (const part of link.split(',')) {
    if (!/;\s*rel="next"\s*$/.test(part.trim())) continue;
    const match = part.match(/<([^>]+)>/);
    if (match) return match[1];
  }
  return undefined;
};

export class RepositoryUnavailableError extends Error {
  constructor(
    public readonly candidateKey: string,
    message: string,
  ) {
    super(message);
    this.name = 'RepositoryUnavailableError';
  }
}

class IssueUnavailableError extends Error {}

const eventTimestamp = (value: string | undefined): number => {
  if (!value) return Number.NaN;
  const isoLike = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Date(isoLike).getTime();
};

export const eventFallsInTimeRanges = (event: InsertRecord, ranges: SyncTimeRange[]): boolean => {
  const timestamp = eventTimestamp(event.created_at);
  return Number.isFinite(timestamp) && ranges.some(range =>
    timestamp >= new Date(range.start).getTime() && timestamp < new Date(range.end).getTime(),
  );
};

export class IssuePullSynchronizer {
  constructor(
    private readonly store: FileStateStore,
    private readonly config: SyncTaskConfig,
  ) {}

  async runRepositoryCandidate(
    candidateKey: string,
    ranges: SyncTimeRange[],
    credential: ManagedCredential,
    deadline: number,
  ): Promise<void> {
    const stored = this.store.state.repositoryCandidates[candidateKey];
    if (!stored || stored.completed) return;
    let candidate = clone(stored);
    let pageBudget = this.config.candidatePagesPerJob;

    if (!candidate.enumerationFinished) {
      // Older checkpoints persisted only an offset page. GitHub rejects page >= 100
      // for large issue sets, so rebuild the cursor chain; stored item IDs deduplicate
      // the replayed pages.
      if (candidate.listPage > 1 && !candidate.listNextPageUrl) {
        candidate.listPage = 1;
        candidate.retryCount = 0;
        candidate.lastError = undefined;
        candidate.nextDueAt = new Date().toISOString();
        await this.checkpoint(candidate);
      }
      const result = await this.enumerateIssueReferences(candidate, ranges[0].start, credential, deadline, pageBudget);
      pageBudget -= result.pagesProcessed;
      candidate = clone(this.store.state.repositoryCandidates[candidateKey]);
      if (!candidate.enumerationFinished || pageBudget <= 0 || Date.now() >= deadline) {
        candidate.nextDueAt = new Date().toISOString();
        await this.checkpoint(candidate);
        return;
      }
    }

    const references = this.store.state.repositoryItems[candidateKey] ?? [];
    while (Date.now() < deadline && pageBudget > 0 &&
      (candidate.currentItem || candidate.itemOffset < references.length)) {
      if (!candidate.currentItem) {
        const reference = references[candidate.itemOffset];
        candidate.currentItem = { ...reference, stage: 'core', page: 1 };
        await this.checkpoint(candidate);
      } else if (candidate.currentItem.stage !== 'core' &&
        candidate.currentItem.page > 1 && !candidate.currentItem.nextPageUrl) {
        // Migrate an offset-only subresource checkpoint in place.
        candidate.currentItem.page = 1;
        await this.checkpoint(candidate);
      }

      try {
        const result = await this.processItem(candidate, candidate.currentItem, ranges, credential, deadline, pageBudget);
        pageBudget -= result.pagesProcessed;
        if (!result.complete) {
          candidate.nextDueAt = new Date().toISOString();
          await this.checkpoint(candidate);
          return;
        }
        candidate.currentItem = undefined;
        candidate.itemOffset++;
        candidate.processedItemCount++;
        candidate.retryCount = 0;
        candidate.lastError = undefined;
        await this.checkpoint(candidate);
      } catch (error: any) {
        if (!(error instanceof IssueUnavailableError)) throw error;
        candidate.currentItem = undefined;
        candidate.itemOffset++;
        candidate.skippedItemCount++;
        candidate.retryCount = 0;
        candidate.lastError = undefined;
        pageBudget--;
        await this.checkpoint(candidate);
      }
    }

    if (!candidate.currentItem && candidate.itemOffset >= references.length) {
      const now = new Date().toISOString();
      candidate.completed = true;
      candidate.completedAt = now;
      candidate.nextDueAt = '9999-12-31T23:59:59.000Z';
      await this.checkpoint(candidate);
      await this.store.clearRepositoryItems(candidate.key);
    } else {
      candidate.nextDueAt = new Date().toISOString();
      await this.checkpoint(candidate);
    }
  }

  async markFailure(candidateKey: string, error: Error): Promise<void> {
    const stored = this.store.state.repositoryCandidates[candidateKey];
    if (!stored || stored.completed) return;
    const candidate = clone(stored);
    candidate.retryCount++;
    candidate.lastError = error.message;
    const retryMinutes = Math.min(24 * 60, Math.pow(2, Math.min(candidate.retryCount, 8)) * 5);
    candidate.nextDueAt = addMinutes(new Date(), retryMinutes);
    await this.checkpoint(candidate);
  }

  async markUnavailable(candidateKey: string, error: RepositoryUnavailableError): Promise<void> {
    const stored = this.store.state.repositoryCandidates[candidateKey];
    if (!stored || stored.completed) return;
    const candidate = clone(stored);
    const now = new Date().toISOString();
    candidate.completed = true;
    candidate.skipped = true;
    candidate.skipReason = error.message;
    candidate.lastError = error.message;
    const knownItems = this.store.state.repositoryItems[candidateKey]?.length ?? 0;
    candidate.skippedItemCount += Math.max(0, knownItems - candidate.itemOffset);
    candidate.itemOffset = knownItems;
    candidate.currentItem = undefined;
    candidate.completedAt = now;
    candidate.nextDueAt = '9999-12-31T23:59:59.000Z';
    await this.checkpoint(candidate);
    await this.store.clearRepositoryItems(candidate.key);
  }

  private async enumerateIssueReferences(
    candidate: RepositoryCandidateState,
    since: string,
    credential: ManagedCredential,
    deadline: number,
    pageBudget: number,
  ): Promise<{ pagesProcessed: number }> {
    let pagesProcessed = 0;
    while (!candidate.enumerationFinished && Date.now() < deadline && pagesProcessed < pageBudget) {
      const response = await this.listIssuesPage(candidate, since, credential);
      const rows = response.data as any[];
      const nextPageUrl = nextPageUrlFromResponse(response);
      const references: IssueReference[] = rows
        .filter(item => Number.isSafeInteger(Number(item.id)) && Number.isSafeInteger(Number(item.number)))
        .map(item => ({
          id: Number(item.id),
          number: Number(item.number),
          isPull: Boolean(item.pull_request),
        }));
      const finished = !nextPageUrl;
      await this.store.appendRepositoryItemPage(
        candidate.key,
        references,
        finished ? candidate.listPage : candidate.listPage + 1,
        finished,
        nextPageUrl,
      );
      pagesProcessed++;
      candidate = clone(this.store.state.repositoryCandidates[candidate.key]);
    }
    return { pagesProcessed };
  }

  private async listIssuesPage(
    candidate: RepositoryCandidateState,
    since: string,
    credential: ManagedCredential,
  ): Promise<any> {
    let [owner, repo] = candidate.repoName.split('/');
    if (!owner || !repo) {
      await this.requireRepositoryMetadata(candidate, credential);
      [owner, repo] = candidate.repoName.split('/');
    }
    const request = () => this.requestCursorPage(
      credential,
      'GET /repos/{owner}/{repo}/issues',
      {
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'asc',
        since,
      },
      candidate.listNextPageUrl,
    );
    try {
      return await request();
    } catch (error: any) {
      if (!this.isUnavailable(error)) throw error;
      await this.requireRepositoryMetadata(candidate, credential);
      [owner, repo] = candidate.repoName.split('/');
      try {
        return await request();
      } catch (retryError: any) {
        if (!this.isUnavailable(retryError)) throw retryError;
        throw new RepositoryUnavailableError(
          candidate.key,
          `Cannot enumerate Issue/PR data for repository ${candidate.repoName} (${candidate.repoId})`,
        );
      }
    }
  }

  private async processItem(
    candidate: RepositoryCandidateState,
    progress: ItemProgress,
    ranges: SyncTimeRange[],
    credential: ManagedCredential,
    deadline: number,
    pageBudget: number,
  ): Promise<ProcessItemResult> {
    const issue = await this.fetchIssue(candidate, progress.number, credential);
    progress.id = Number(issue.id ?? progress.id);
    progress.isPull = Boolean(issue.pull_request);
    let [owner, repo] = candidate.repoName.split('/');
    let pull: any;
    if (progress.isPull) {
      try {
        const response = await credential.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
          owner,
          repo,
          pull_number: progress.number,
        });
        pull = response.data;
      } catch (error: any) {
        if (!this.isUnavailable(error)) throw error;
        throw new IssueUnavailableError(`Pull request ${candidate.repoName}#${progress.number} is unavailable`);
      }
    }

    const source = pull ?? issue;
    const repository: RepositoryIdentity = {
      id: candidate.repoId,
      name: candidate.repoName,
      orgId: candidate.orgId,
      orgLogin: candidate.orgLogin,
    };
    const base = this.itemBase(repository, source, progress.isPull);
    const earliestStart = ranges[0].start;
    let pagesProcessed = 0;

    while (Date.now() < deadline && pagesProcessed < pageBudget) {
      let events: InsertRecord[];
      let pageComplete = true;
      switch (progress.stage) {
        case 'core':
          events = this.coreEvents(base, source, progress.isPull, issue);
          break;
        case 'comments': {
          const page = await this.fetchPage(
            credential,
            'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
            { owner, repo, issue_number: progress.number, since: earliestStart },
            progress.nextPageUrl,
          );
          events = this.commentEvents(base, page.data);
          progress.nextPageUrl = page.nextPageUrl;
          pageComplete = !page.nextPageUrl;
          break;
        }
        case 'timeline': {
          const page = await this.fetchPage(
            credential,
            'GET /repos/{owner}/{repo}/issues/{issue_number}/events',
            { owner, repo, issue_number: progress.number },
            progress.nextPageUrl,
          );
          events = this.transitionEvents(
            base,
            page.data,
            progress.isPull ? 'PullRequestEvent' : 'IssuesEvent',
            pull?.merged_at,
          );
          progress.nextPageUrl = page.nextPageUrl;
          pageComplete = !page.nextPageUrl;
          break;
        }
        case 'reviewComments': {
          const page = await this.fetchPage(
            credential,
            'GET /repos/{owner}/{repo}/pulls/{pull_number}/comments',
            { owner, repo, pull_number: progress.number },
            progress.nextPageUrl,
          );
          events = this.reviewCommentEvents(base, page.data);
          progress.nextPageUrl = page.nextPageUrl;
          pageComplete = !page.nextPageUrl;
          break;
        }
        case 'reviews': {
          const page = await this.fetchPage(
            credential,
            'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
            { owner, repo, pull_number: progress.number },
            progress.nextPageUrl,
          );
          events = this.reviewEvents(base, page.data);
          progress.nextPageUrl = page.nextPageUrl;
          pageComplete = !page.nextPageUrl;
          break;
        }
      }

      await this.insertWindowEvents(events, ranges);
      pagesProcessed++;
      if (!pageComplete) {
        progress.page++;
      } else if (!this.advanceStage(progress)) {
        return { complete: true, pagesProcessed };
      }
      await this.checkpoint(candidate);
    }
    return { complete: false, pagesProcessed };
  }

  private async fetchIssue(
    candidate: RepositoryCandidateState,
    issueNumber: number,
    credential: ManagedCredential,
  ): Promise<any> {
    let [owner, repo] = candidate.repoName.split('/');
    const request = () => credential.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
      owner,
      repo,
      issue_number: issueNumber,
    });
    try {
      return (await request()).data;
    } catch (error: any) {
      if (!this.isUnavailable(error)) throw error;
      await this.requireRepositoryMetadata(candidate, credential);
      [owner, repo] = candidate.repoName.split('/');
      try {
        return (await request()).data;
      } catch (retryError: any) {
        if (!this.isUnavailable(retryError)) throw retryError;
        throw new IssueUnavailableError(`Issue/PR ${candidate.repoName}#${issueNumber} is unavailable`);
      }
    }
  }

  private async requireRepositoryMetadata(
    candidate: RepositoryCandidateState,
    credential: ManagedCredential,
  ): Promise<void> {
    let response: any;
    try {
      response = await credential.request('GET /repositories/{repository_id}', {
        repository_id: candidate.repoId,
      });
    } catch (error: any) {
      if (!this.isUnavailable(error)) throw error;
      throw new RepositoryUnavailableError(
        candidate.key,
        `Repository ${candidate.repoName} (${candidate.repoId}) no longer exists or is not visible`,
      );
    }
    const metadata = response.data;
    if (Number(metadata.id) !== candidate.repoId) {
      throw new Error(
        `GitHub repository ID changed for ${candidate.repoName}: expected ${candidate.repoId}, got ${metadata.id}`,
      );
    }
    candidate.repoName = String(metadata.full_name ?? candidate.repoName);
    const organizationOwner = metadata.owner?.type === 'Organization';
    candidate.orgId = organizationOwner ? Number(metadata.owner?.id ?? 0) : 0;
    candidate.orgLogin = organizationOwner ? String(metadata.owner?.login ?? '') : '';
    await this.checkpoint(candidate);
  }

  private isUnavailable(error: any): boolean {
    const status = errorStatus(error);
    return status === 404 || status === 410 || status === 451;
  }

  private itemBase(repository: RepositoryIdentity, item: any, isPull: boolean): InsertRecord {
    const base = this.issueBase(repository, item, Number(item.id));
    if (!isPull) return base;
    return {
      ...base,
      pull_additions: Number(item.additions ?? 0),
      pull_deletions: Number(item.deletions ?? 0),
      pull_base_ref: String(item.base?.ref ?? ''),
      pull_head_ref: String(item.head?.ref ?? ''),
      pull_head_repo_id: Number(item.head?.repo?.id ?? 0),
      pull_head_repo_name: String(item.head?.repo?.full_name ?? ''),
    };
  }

  private issueBase(repository: RepositoryIdentity, issue: any, issueId: number): InsertRecord {
    const labels = (issue.labels ?? []).map((label: any) => typeof label === 'string' ? { name: label } : label);
    const author = actor(issue.user);
    return {
      platform: 'GitHub',
      type: '',
      action: '',
      actor_id: 0,
      actor_login: '',
      repo_id: repository.id,
      repo_name: repository.name,
      org_id: repository.orgId,
      org_login: repository.orgLogin,
      issue_id: issueId,
      issue_number: Number(issue.number),
      issue_title: issue.title ?? '',
      body: issue.body ?? '',
      issue_author_id: author.actor_id,
      issue_author_login: author.actor_login,
      issue_created_at: dbDate(issue.created_at),
      issue_updated_at: dbDate(issue.updated_at),
      issue_closed_at: dbDate(issue.closed_at),
      'issue_labels.name': labels.map((label: any) => String(label.name ?? '')),
      'issue_labels.color': labels.map((label: any) => String(label.color ?? '')),
      'issue_labels.default': labels.map((label: any) => label.default ? 1 : 0),
      'issue_labels.description': labels.map((label: any) => String(label.description ?? '')),
    };
  }

  private coreEvents(base: InsertRecord, item: any, isPull: boolean, issue: any): InsertRecord[] {
    const type = isPull ? 'PullRequestEvent' : 'IssuesEvent';
    const events: InsertRecord[] = [{
      ...base,
      ...actor(item.user),
      type,
      action: 'opened',
      created_at: formatDate(item.created_at),
    }];
    const closedAt = isPull ? item.merged_at ?? item.closed_at : item.closed_at;
    if (closedAt) {
      events.push({
        ...base,
        ...actor(item.merged_by ?? issue.closed_by ?? item.closed_by ?? item.user),
        type,
        action: 'closed',
        ...(isPull ? { pull_merged: item.merged_at ? 1 : 0 } : {}),
        created_at: formatDate(closedAt),
      });
    }
    return events;
  }

  private commentEvents(base: InsertRecord, comments: any[]): InsertRecord[] {
    return comments.filter(comment => comment.created_at).map(comment => ({
      ...base,
      ...actor(comment.user),
      type: 'IssueCommentEvent',
      action: 'created',
      body: comment.body ?? '',
      issue_comment_id: Number(comment.id),
      issue_comment_created_at: dbDate(comment.created_at),
      issue_comment_updated_at: dbDate(comment.updated_at),
      issue_comment_author_id: Number(comment.user?.id ?? 0),
      issue_comment_author_login: String(comment.user?.login ?? ''),
      created_at: formatDate(comment.created_at),
    }));
  }

  private reviewCommentEvents(base: InsertRecord, comments: any[]): InsertRecord[] {
    return comments.filter(comment => comment.created_at).map(comment => ({
      ...base,
      ...actor(comment.user),
      type: 'PullRequestReviewCommentEvent',
      action: 'created',
      body: comment.body ?? '',
      pull_review_comment_id: Number(comment.id),
      pull_review_comment_created_at: dbDate(comment.created_at),
      pull_review_comment_updated_at: dbDate(comment.updated_at),
      pull_review_comment_author_id: Number(comment.user?.id ?? 0),
      pull_review_comment_author_login: String(comment.user?.login ?? ''),
      created_at: formatDate(comment.created_at),
    }));
  }

  private reviewEvents(base: InsertRecord, reviews: any[]): InsertRecord[] {
    return reviews.filter(review => review.submitted_at && review.user).map(review => ({
      ...base,
      ...actor(review.user),
      type: 'PullRequestReviewEvent',
      action: 'created',
      body: review.body ?? '',
      pull_review_id: Number(review.id),
      pull_review_state: String(review.state ?? '').toLowerCase(),
      created_at: formatDate(review.submitted_at),
    }));
  }

  private transitionEvents(
    base: InsertRecord,
    timeline: any[],
    type: 'IssuesEvent' | 'PullRequestEvent',
    mergedAt?: string,
  ): InsertRecord[] {
    return timeline
      .filter(item => item.event === 'closed' && item.created_at)
      .map(item => ({
        ...base,
        ...actor(item.actor),
        type,
        action: item.event,
        ...(type === 'PullRequestEvent' && item.event === 'closed'
          ? { pull_merged: mergedAt && dbDate(mergedAt) === dbDate(item.created_at) ? 1 : 0 }
          : {}),
        created_at: formatDate(item.created_at),
      }));
  }

  private async fetchPage(
    credential: ManagedCredential,
    route: string,
    parameters: Record<string, any>,
    nextPageUrl?: string,
  ): Promise<CursorPage> {
    const response = await this.requestCursorPage(credential, route, parameters, nextPageUrl);
    return {
      data: response.data as any[],
      nextPageUrl: nextPageUrlFromResponse(response),
    };
  }

  private requestCursorPage(
    credential: ManagedCredential,
    route: string,
    initialParameters: Record<string, any>,
    nextPageUrl?: string,
  ): Promise<any> {
    if (!nextPageUrl) {
      return credential.request(route, { ...initialParameters, per_page: 100 });
    }
    const url = new URL(nextPageUrl);
    const parameters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => { parameters[key] = value; });
    // Some Link URLs include the legacy page number together with a cursor.
    // Sending both can still trigger GitHub's large-dataset offset guard.
    if (parameters.after || parameters.before) delete parameters.page;
    return credential.request(`GET ${url.pathname}`, parameters);
  }

  private advanceStage(progress: ItemProgress): boolean {
    const stages: ItemStage[] = progress.isPull
      ? ['core', 'comments', 'timeline', 'reviewComments', 'reviews']
      : ['core', 'comments', 'timeline'];
    const index = stages.indexOf(progress.stage);
    if (index < 0 || index === stages.length - 1) return false;
    progress.stage = stages[index + 1];
    progress.page = 1;
    progress.nextPageUrl = undefined;
    return true;
  }

  private async insertWindowEvents(events: InsertRecord[], ranges: SyncTimeRange[]): Promise<void> {
    const filtered = events.filter(event => eventFallsInTimeRanges(event, ranges));
    const unique = this.deduplicateWithinPage(filtered).map(event => ({ ...event, from_api: 1 }));
    await insertRecords(unique, 'events');
  }

  private async checkpoint(candidate: RepositoryCandidateState): Promise<void> {
    candidate.updatedAt = new Date().toISOString();
    await this.store.putRepositoryCandidate(candidate);
  }

  private deduplicateWithinPage(events: InsertRecord[]): InsertRecord[] {
    const unique = new Map<string, InsertRecord>();
    for (const event of events) {
      let key: string;
      if (event.issue_comment_id) {
        key = `issue-comment:${event.issue_comment_id}`;
      } else if (event.pull_review_comment_id) {
        key = `review-comment:${event.pull_review_comment_id}`;
      } else if (event.pull_review_id) {
        key = `review:${event.pull_review_id}`;
      } else {
        key = `event:${event.repo_id}:${event.issue_id}:${event.type}:${event.action}:${event.created_at}`;
      }
      unique.set(key, event);
    }
    return Array.from(unique.values());
  }
}
