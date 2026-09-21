export type ItemStage =
  | 'core'
  | 'comments'
  | 'timeline'
  | 'reviewComments'
  | 'reviews';

export interface SyncTimeRange {
  start: string;
  end: string;
}

export interface IssueReference {
  id: number;
  number: number;
  isPull: boolean;
}

export interface ItemProgress extends IssueReference {
  stage: ItemStage;
  page: number;
  nextPageUrl?: string;
}

export interface RepositoryCandidateState {
  key: string;
  repoId: number;
  repoName: string;
  orgId: number;
  orgLogin: string;
  listPage: number;
  listNextPageUrl?: string;
  enumerationFinished: boolean;
  itemOffset: number;
  currentItem?: ItemProgress;
  discoveredItemCount: number;
  processedItemCount: number;
  skippedItemCount: number;
  completed: boolean;
  skipped?: boolean;
  skipReason?: string;
  nextDueAt: string;
  retryCount: number;
  lastError?: string;
  discoveredAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WindowSyncMetadata {
  scopeHash: string;
  timeRanges: SyncTimeRange[];
  cursorRepoId: number;
  batchLastRepoId?: number;
  sourceExhausted: boolean;
  finished: boolean;
  discoveredCount: number;
  completedCount: number;
  skippedCount: number;
  discoveredItemCount: number;
  processedItemCount: number;
  skippedItemCount: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CredentialRuntimeState {
  fingerprint: string;
  principalId?: number;
  principalLogin?: string;
  remaining?: number;
  limit?: number;
  resetAt?: string;
  cooldownUntil?: string;
  disabled?: boolean;
  lastError?: string;
}

export interface SchedulerMetadata {
  globalCooldownUntil?: string;
}

export interface SchedulerState {
  schemaVersion: 1;
  lastSequence: number;
  credentials: Record<string, CredentialRuntimeState>;
  metadata: SchedulerMetadata;
  repositoryCandidates: Record<string, RepositoryCandidateState>;
  repositoryItems: Record<string, IssueReference[]>;
  windowSync?: WindowSyncMetadata;
}

export type StatePatch =
  | { type: 'putCredential'; credential: CredentialRuntimeState }
  | { type: 'putMetadata'; metadata: SchedulerMetadata }
  | { type: 'putRepositoryCandidate'; candidate: RepositoryCandidateState }
  | {
    type: 'appendRepositoryItemPage';
    candidateKey: string;
    items: IssueReference[];
    nextListPage: number;
    nextListPageUrl?: string;
    enumerationFinished: boolean;
    updatedAt: string;
  }
  | { type: 'clearRepositoryItems'; candidateKey: string }
  | { type: 'putWindowState'; metadata: WindowSyncMetadata; candidates: RepositoryCandidateState[] };

export interface JournalEntry {
  sequence: number;
  createdAt: string;
  patch: StatePatch;
}

export interface TokenInput {
  id: string;
  token: string;
}

export interface SyncTaskConfig {
  tokenFile?: string;
  tokens?: Array<string | { id?: string; token: string }>;
  stateDir: string;
  maxConcurrency: number;
  maxConcurrencyPerPrincipal: number;
  maxRunSeconds: number;
  snapshotEvery: number;
  rateLimitReserve: number;
  timeRanges: SyncTimeRange[];
  candidateBatchSize: number;
  candidatePagesPerJob: number;
}

export const defaultSchedulerState = (): SchedulerState => ({
  schemaVersion: 1,
  lastSequence: 0,
  credentials: {},
  metadata: {},
  repositoryCandidates: {},
  repositoryItems: {},
});
