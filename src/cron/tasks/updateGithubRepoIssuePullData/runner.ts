import { resolve } from 'path';
import getConfig from '../../../config';
import { getLogger } from '../../../utils';
import { FileStateStore } from './stateStore';
import {
  IssuePullSynchronizer,
  RepositoryUnavailableError,
} from './sync';
import { GitHubLimitError, TokenPool, loadTokenInputs } from './tokenPool';
import {
  SyncTaskConfig,
  TokenInput,
  RepositoryCandidateState,
} from './types';
import { WindowRepositoryRegistry, normalizeTimeRanges } from './windowRegistry';

const logger = getLogger('UpdateGithubRepoIssuePullDataTask');

const positiveNumber = (value: any, fallback: number, maximum?: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return maximum === undefined ? parsed : Math.min(parsed, maximum);
};

const positiveInteger = (value: any, fallback: number, maximum?: number): number =>
  Math.floor(positiveNumber(value, fallback, maximum));

export const resolveTaskConfig = (raw: any): SyncTaskConfig => ({
  tokenFile: raw?.tokenFile,
  tokens: raw?.tokens ?? [],
  stateDir: resolve(raw?.stateDir ?? 'local_files/github_issue_pull_window_sync'),
  maxConcurrency: positiveInteger(raw?.maxConcurrency, 4, 100),
  maxConcurrencyPerPrincipal: positiveInteger(raw?.maxConcurrencyPerPrincipal, 2, 10),
  maxRunSeconds: positiveNumber(raw?.maxRunSeconds, 290, 55 * 60),
  snapshotEvery: positiveInteger(raw?.snapshotEvery, 500),
  rateLimitReserve: positiveInteger(raw?.rateLimitReserve, 100),
  timeRanges: normalizeTimeRanges(raw?.timeRanges),
  candidateBatchSize: positiveInteger(raw?.candidateBatchSize, 5000, 100_000),
  candidatePagesPerJob: positiveInteger(raw?.candidatePagesPerJob, 10, 100),
});

export class GithubIssuePullRunner {
  private initialized = false;
  private config!: SyncTaskConfig;
  private store!: FileStateStore;
  private registry!: WindowRepositoryRegistry;
  private synchronizer!: IssuePullSynchronizer;
  private tokenPool!: TokenPool;
  private configuredTokens: Array<string | { id?: string; token: string }> = [];
  private readonly runningRepositories = new Set<string>();
  private readonly jobWaiters = new Set<() => void>();
  private batchPreparation?: Promise<boolean>;
  private roundRunning = false;
  private emptyRangeWarningLogged = false;

  async runRound(): Promise<void> {
    if (this.roundRunning) {
      logger.warn('The previous GitHub Issue/PR supplementation round is still running; skip this invocation.');
      return;
    }
    const startedAt = Date.now();
    this.roundRunning = true;
    try {
      await this.runRoundInternal(startedAt);
    } finally {
      this.roundRunning = false;
    }
  }

  private async runRoundInternal(startedAt: number): Promise<void> {
    await this.initialize();
    if (this.config.timeRanges.length === 0) {
      if (!this.emptyRangeWarningLogged) {
        logger.warn('No timeRanges configured; GitHub Issue/PR API supplementation is disabled.');
        this.emptyRangeWarningLogged = true;
      }
      return;
    }

    await this.registry.ensureScope();
    if (!await this.ensureCandidateBatch()) return;
    if (!await this.reloadTokens()) return;
    if (this.tokenPool.principalCount === 0) {
      logger.warn('No usable GitHub credentials; candidates are retained and API supplementation is skipped.');
      return;
    }

    const deadline = startedAt + this.config.maxRunSeconds * 1000;
    const laneCount = Math.min(this.config.maxConcurrency, this.tokenPool.concurrencyCapacity);
    await Promise.all(Array.from({ length: laneCount }, () => this.runLane(deadline)));

    const metadata = { ...this.store.state.metadata };
    if (metadata.globalCooldownUntil && new Date(metadata.globalCooldownUntil).getTime() <= Date.now()) {
      metadata.globalCooldownUntil = undefined;
      await this.store.putMetadata(metadata);
    }
    await this.store.flush();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    const appConfig: any = await getConfig();
    const raw = appConfig.task?.configs?.updateGithubRepoIssuePullData ?? {};
    this.config = resolveTaskConfig(raw);
    this.store = new FileStateStore(this.config.stateDir, this.config.snapshotEvery);
    await this.store.initialize();
    this.registry = new WindowRepositoryRegistry(this.store, this.config, logger);
    this.synchronizer = new IssuePullSynchronizer(this.store, this.config);
    this.configuredTokens = [...(this.config.tokens ?? [])];
    this.tokenPool = new TokenPool(
      [],
      this.store,
      this.config.rateLimitReserve,
      this.config.maxConcurrencyPerPrincipal,
      logger,
    );
    this.initialized = true;
  }

  private async reloadTokens(): Promise<boolean> {
    let inputs: TokenInput[];
    try {
      inputs = loadTokenInputs(this.configuredTokens, this.config.tokenFile);
    } catch (error: any) {
      logger.error(`Failed to reload the GitHub token file: ${error.message}`);
      return false;
    }
    await this.tokenPool.reload(inputs);
    return true;
  }

  private async runLane(deadline: number): Promise<void> {
    while (Date.now() < deadline) {
      const credential = this.tokenPool.acquire();
      if (!credential) return;
      const candidate = this.claimNextCandidate();
      if (!candidate) {
        await this.tokenPool.release(credential);
        if (this.runningRepositories.size > 0 && Date.now() < deadline) {
          await this.waitForJobChange(deadline);
          continue;
        }
        if (await this.ensureCandidateBatch()) continue;
        return;
      }

      try {
        await this.synchronizer.runRepositoryCandidate(
          candidate.key,
          this.config.timeRanges,
          credential,
          deadline,
        );
      } catch (error: any) {
        if (error instanceof GitHubLimitError) {
          await this.tokenPool.handleLimitError(error);
        } else if (error instanceof RepositoryUnavailableError) {
          await this.synchronizer.markUnavailable(candidate.key, error);
          logger.warn(`${error.message}; repository skipped.`);
        } else {
          await this.synchronizer.markFailure(candidate.key, error);
          logger.warn(`Issue/PR supplementation failed for repository ${candidate.repoName}: ${error.message}`);
        }
      } finally {
        this.runningRepositories.delete(candidate.key);
        this.signalJobChange();
        await this.tokenPool.release(credential);
      }
    }
  }

  private claimNextCandidate(now = Date.now()): RepositoryCandidateState | undefined {
    const candidate = Object.values(this.store.state.repositoryCandidates)
      .filter(item => !item.completed &&
        !this.runningRepositories.has(item.key) &&
        new Date(item.nextDueAt).getTime() <= now)
      .sort((a, b) =>
        new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime() ||
        a.repoId - b.repoId,
      )[0];
    if (candidate) this.runningRepositories.add(candidate.key);
    return candidate;
  }

  private async ensureCandidateBatch(): Promise<boolean> {
    if (!this.batchPreparation) {
      const operation = this.registry.prepareBatch().then(() =>
        Object.values(this.store.state.repositoryCandidates).some(candidate =>
          !candidate.completed && new Date(candidate.nextDueAt).getTime() <= Date.now(),
        ),
      );
      const tracked = operation.finally(() => {
        if (this.batchPreparation === tracked) this.batchPreparation = undefined;
      });
      this.batchPreparation = tracked;
    }
    return this.batchPreparation;
  }

  private waitForJobChange(deadline: number): Promise<void> {
    return new Promise(resolvePromise => {
      let timer: NodeJS.Timeout;
      const done = () => {
        clearTimeout(timer);
        this.jobWaiters.delete(done);
        resolvePromise();
      };
      this.jobWaiters.add(done);
      timer = setTimeout(done, Math.max(1, deadline - Date.now()));
    });
  }

  private signalJobChange(): void {
    for (const resolvePromise of Array.from(this.jobWaiters)) resolvePromise();
  }
}
