import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import getConfig from '../config';
import {
  fingerprintToken,
  loadTokenInputs,
} from '../cron/tasks/updateGithubRepoIssuePullData/tokenPool';
import {
  JournalEntry,
  SchedulerState,
  StatePatch,
  defaultSchedulerState,
} from '../cron/tasks/updateGithubRepoIssuePullData/types';
import { normalizeTimeRanges } from '../cron/tasks/updateGithubRepoIssuePullData/windowRegistry';

const snapshotFileName = 'state.snapshot.json';
const journalFileName = 'state.journal.jsonl';

const applyPatch = (state: SchedulerState, patch: StatePatch): void => {
  switch (patch.type) {
    case 'putCredential':
      state.credentials[patch.credential.fingerprint] = patch.credential;
      break;
    case 'putMetadata':
      state.metadata = patch.metadata;
      break;
    case 'putRepositoryCandidate':
      state.repositoryCandidates[patch.candidate.key] = patch.candidate;
      break;
    case 'appendRepositoryItemPage': {
      const candidate = state.repositoryCandidates[patch.candidateKey];
      if (!candidate) break;
      const unique = new Map((state.repositoryItems[patch.candidateKey] ?? []).map(item => [item.id, item]));
      for (const item of patch.items) unique.set(item.id, item);
      state.repositoryItems[patch.candidateKey] = Array.from(unique.values());
      candidate.listPage = patch.nextListPage;
      candidate.listNextPageUrl = patch.nextListPageUrl;
      candidate.enumerationFinished = patch.enumerationFinished;
      candidate.discoveredItemCount = unique.size;
      candidate.updatedAt = patch.updatedAt;
      break;
    }
    case 'clearRepositoryItems':
      delete state.repositoryItems[patch.candidateKey];
      break;
    case 'putWindowState':
      state.windowSync = patch.metadata;
      state.repositoryCandidates = Object.fromEntries(
        patch.candidates.map(candidate => [candidate.key, candidate]),
      );
      state.repositoryItems = {};
      break;
  }
};

const snapshotIdentity = async (path: string): Promise<string> => {
  try {
    const info = await stat(path);
    return `${info.ino}:${info.size}:${info.mtimeMs}`;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return 'missing';
    throw error;
  }
};

/** Read current state without taking the task's process lock. */
export const loadSchedulerStateForStatus = async (stateDir: string): Promise<SchedulerState> => {
  const snapshotPath = resolve(stateDir, snapshotFileName);
  const journalPath = resolve(stateDir, journalFileName);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const before = await snapshotIdentity(snapshotPath);
    const state = existsSync(snapshotPath)
      ? JSON.parse(await readFile(snapshotPath, 'utf8')) as SchedulerState
      : defaultSchedulerState();
    if (state.schemaVersion !== 1) {
      throw new Error(`Unsupported scheduler state schema version: ${state.schemaVersion}`);
    }
    state.credentials ??= {};
    state.metadata ??= {};
    state.repositoryCandidates ??= {};
    state.repositoryItems ??= {};

    if (existsSync(journalPath)) {
      const lines = (await readFile(journalPath, 'utf8')).split('\n');
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (!line.trim()) continue;
        let entry: JournalEntry;
        try {
          entry = JSON.parse(line) as JournalEntry;
        } catch (error) {
          if (lines.slice(index + 1).every(candidate => !candidate.trim())) break;
          throw error;
        }
        if (entry.sequence <= state.lastSequence) continue;
        applyPatch(state, entry.patch);
        state.lastSequence = entry.sequence;
      }
    }
    if (before === await snapshotIdentity(snapshotPath)) return state;
  }
  throw new Error('Scheduler snapshot kept changing while status was being read; retry the command.');
};

export const buildSyncStatus = (
  state: SchedulerState,
  stateDir: string,
  configuredTokenFingerprints: string[],
  configuredRanges: Array<{ start: string; end: string }>,
  maxConcurrency: number,
  maxConcurrencyPerPrincipal: number,
) => {
  const candidates = Object.values(state.repositoryCandidates);
  const completedInBatch = candidates.filter(candidate => candidate.completed);
  const skippedInBatch = completedInBatch.filter(candidate => candidate.skipped);
  const errors = candidates.filter(candidate => candidate.lastError && !candidate.skipped);
  const discoveredItemsInBatch = candidates.reduce((sum, candidate) => sum + candidate.discoveredItemCount, 0);
  const processedItemsInBatch = candidates.reduce((sum, candidate) => sum + candidate.processedItemCount, 0);
  const skippedItemsInBatch = candidates.reduce((sum, candidate) => sum + candidate.skippedItemCount, 0);
  const configuredFingerprintSet = new Set(configuredTokenFingerprints);
  const allCredentials = Object.values(state.credentials);
  const credentials = allCredentials.filter(credential => configuredFingerprintSet.has(credential.fingerprint));
  const usable = credentials.filter(credential => !credential.disabled);
  const principalMap = new Map<string, typeof usable>();
  for (const credential of usable) {
    const key = credential.principalId
      ? `principal:${credential.principalId}`
      : `token:${credential.fingerprint}`;
    const group = principalMap.get(key) ?? [];
    group.push(credential);
    principalMap.set(key, group);
  }
  const principals = Array.from(principalMap.values()).map(group => ({
    login: group.find(item => item.principalLogin)?.principalLogin ?? '(unresolved)',
    tokenCount: group.length,
    remaining: group.map(item => item.remaining).filter((value): value is number => value !== undefined)
      .reduce<number | undefined>((lowest, value) => lowest === undefined ? value : Math.min(lowest, value), undefined),
    limit: group.map(item => item.limit).filter((value): value is number => value !== undefined)
      .reduce<number | undefined>((highest, value) => highest === undefined ? value : Math.max(highest, value), undefined),
    resetAt: group.map(item => item.resetAt).filter((value): value is string => Boolean(value)).sort().pop(),
    cooldownUntil: group.map(item => item.cooldownUntil).filter((value): value is string => Boolean(value)).sort().pop(),
  }));
  const metadata = state.windowSync;
  const processed = (metadata?.completedCount ?? 0) + completedInBatch.length;
  const skipped = (metadata?.skippedCount ?? 0) + skippedInBatch.length;

  return {
    generatedAt: new Date().toISOString(),
    stateDir,
    stateSequence: state.lastSequence,
    status: configuredRanges.length === 0
      ? 'disabled'
      : metadata?.finished ? 'finished' : metadata ? 'running' : 'not_started',
    configuredRanges,
    activeScope: metadata ? {
      scopeHash: metadata.scopeHash,
      timeRanges: metadata.timeRanges,
      startedAt: metadata.startedAt,
      updatedAt: metadata.updatedAt,
      completedAt: metadata.completedAt,
      cursorRepoId: metadata.cursorRepoId,
      sourceExhausted: metadata.sourceExhausted,
      repositoriesDiscovered: metadata.discoveredCount,
      repositoriesProcessed: processed,
      repositoriesSkipped: skipped,
      itemsDiscovered: (metadata.discoveredItemCount ?? 0) + discoveredItemsInBatch,
      itemsProcessed: (metadata.processedItemCount ?? 0) + processedItemsInBatch,
      itemsSkipped: (metadata.skippedItemCount ?? 0) + skippedItemsInBatch,
    } : undefined,
    currentBatch: {
      repositoriesTotal: candidates.length,
      repositoriesCompleted: completedInBatch.length,
      repositoriesPending: candidates.length - completedInBatch.length,
      repositoriesSkipped: skippedInBatch.length,
      repositoriesWithError: errors.length,
      repositoriesEnumerating: candidates.filter(candidate => !candidate.completed && !candidate.enumerationFinished).length,
      itemsDiscovered: discoveredItemsInBatch,
      itemsProcessed: processedItemsInBatch,
      itemsSkipped: skippedItemsInBatch,
      stages: Object.fromEntries(['core', 'comments', 'timeline', 'reviewComments', 'reviews']
        .map(stage => [stage, candidates.filter(candidate => candidate.currentItem?.stage === stage).length])),
    },
    errors: errors.slice(0, 20).map(candidate => ({
      repository: candidate.repoName,
      listPage: candidate.listPage,
      issueNumber: candidate.currentItem?.number,
      stage: candidate.currentItem?.stage,
      page: candidate.currentItem?.page,
      retryCount: candidate.retryCount,
      nextDueAt: candidate.nextDueAt,
      error: candidate.lastError,
    })),
    tokens: {
      configured: configuredFingerprintSet.size,
      knownRuntimeStates: credentials.length,
      staleRuntimeStates: allCredentials.length - credentials.length,
      disabled: credentials.filter(credential => credential.disabled).length,
      usablePrincipals: principalMap.size,
      maxConcurrency,
      maxConcurrencyPerPrincipal,
      effectiveConcurrency: Math.min(maxConcurrency, principalMap.size * maxConcurrencyPerPrincipal),
      principals,
    },
  };
};

const printHumanStatus = (status: ReturnType<typeof buildSyncStatus>): void => {
  const statusName: Record<string, string> = {
    disabled: '未配置时间段（不会发起 API 请求）',
    not_started: '尚未开始',
    running: '进行中',
    finished: '已完成',
  };
  console.log(`GitHub Issue/PR 时间段补充状态 @ ${status.generatedAt}`);
  console.log(`状态: ${statusName[status.status]}; 状态目录: ${status.stateDir}; 序号: ${status.stateSequence}`);
  console.log('配置时间段（左闭右开）');
  if (status.configuredRanges.length > 0) console.table(status.configuredRanges);
  else console.log('无');

  if (status.activeScope) {
    console.log('扫描进度');
    console.table([{
      scope: status.activeScope.scopeHash,
      已发现仓库: status.activeScope.repositoriesDiscovered,
      已处理仓库: status.activeScope.repositoriesProcessed,
      已跳过仓库: status.activeScope.repositoriesSkipped,
      已发现IssuePR: status.activeScope.itemsDiscovered,
      已处理IssuePR: status.activeScope.itemsProcessed,
      已跳过IssuePR: status.activeScope.itemsSkipped,
      当前仓库游标: status.activeScope.cursorRepoId,
      候选扫描结束: status.activeScope.sourceExhausted ? '是' : '否',
    }]);
  }

  console.log('当前候选批次');
  console.table([{
    仓库总数: status.currentBatch.repositoriesTotal,
    仓库完成: status.currentBatch.repositoriesCompleted,
    仓库待处理: status.currentBatch.repositoriesPending,
    仓库跳过: status.currentBatch.repositoriesSkipped,
    仓库错误: status.currentBatch.repositoriesWithError,
    正在枚举: status.currentBatch.repositoriesEnumerating,
    已发现IssuePR: status.currentBatch.itemsDiscovered,
    已处理IssuePR: status.currentBatch.itemsProcessed,
    已跳过IssuePR: status.currentBatch.itemsSkipped,
    core: status.currentBatch.stages.core,
    comments: status.currentBatch.stages.comments,
    timeline: status.currentBatch.stages.timeline,
    reviewComments: status.currentBatch.stages.reviewComments,
    reviews: status.currentBatch.stages.reviews,
  }]);
  console.log('Token');
  console.log(
    `配置 ${status.tokens.configured}; 可用主体 ${status.tokens.usablePrincipals}; ` +
    `禁用 ${status.tokens.disabled}; 已移除历史状态 ${status.tokens.staleRuntimeStates}; ` +
    `实际并发 ${status.tokens.effectiveConcurrency} ` +
    `(全局 ${status.tokens.maxConcurrency}, 每主体 ${status.tokens.maxConcurrencyPerPrincipal})`,
  );
  if (status.tokens.principals.length > 0) console.table(status.tokens.principals);
  if (status.errors.length > 0) {
    console.log('当前错误（前 20）');
    console.table(status.errors);
  }
};

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async (): Promise<void> => {
  const config: any = await getConfig();
  const taskConfig = config.task?.configs?.updateGithubRepoIssuePullData ?? {};
  const stateDir = resolve(
    argumentValue('--state-dir') ?? taskConfig.stateDir ?? 'local_files/github_issue_pull_window_sync',
  );
  const configuredTokens = loadTokenInputs(taskConfig.tokens ?? [], taskConfig.tokenFile);
  const state = await loadSchedulerStateForStatus(stateDir);
  const status = buildSyncStatus(
    state,
    stateDir,
    configuredTokens.map(input => fingerprintToken(input.token)),
    normalizeTimeRanges(taskConfig.timeRanges),
    Number(taskConfig.maxConcurrency ?? 4),
    Number(taskConfig.maxConcurrencyPerPrincipal ?? 2),
  );
  if (process.argv.includes('--json')) console.log(JSON.stringify(status, null, 2));
  else printHumanStatus(status);
};

if (require.main === module) {
  main().catch(error => {
    console.error(`读取 GitHub Issue/PR 补充状态失败: ${error.message}`);
    process.exitCode = 1;
  });
}
