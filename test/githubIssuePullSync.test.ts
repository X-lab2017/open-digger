import assert from 'assert';
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileStateStore } from '../src/cron/tasks/updateGithubRepoIssuePullData/stateStore';
import {
  IssuePullSynchronizer,
  RepositoryUnavailableError,
  eventFallsInTimeRanges,
} from '../src/cron/tasks/updateGithubRepoIssuePullData/sync';
import {
  GitHubLimitError,
  ManagedCredential,
  TokenPool,
  loadTokenInputs,
} from '../src/cron/tasks/updateGithubRepoIssuePullData/tokenPool';
import {
  RepositoryCandidateState,
  SyncTaskConfig,
  WindowSyncMetadata,
} from '../src/cron/tasks/updateGithubRepoIssuePullData/types';
import {
  buildWindowRepositoryQuery,
  normalizeTimeRanges,
  timeRangeScopeHash,
} from '../src/cron/tasks/updateGithubRepoIssuePullData/windowRegistry';

describe('GitHub configured-window Issue/PR supplementation', () => {
  const directories: string[] = [];
  const logger = { info: () => undefined, warn: () => undefined, error: () => undefined };

  const temporaryDirectory = async (): Promise<string> => {
    const directory = await mkdtemp(join(tmpdir(), 'open-digger-github-window-sync-'));
    directories.push(directory);
    return directory;
  };

  const windowState = (): { metadata: WindowSyncMetadata; candidate: RepositoryCandidateState } => {
    const now = '2026-09-07T00:00:00.000Z';
    const ranges = [{ start: '2025-01-01T00:00:00.000Z', end: '2025-02-01T00:00:00.000Z' }];
    return {
      metadata: {
        scopeHash: timeRangeScopeHash(ranges),
        timeRanges: ranges,
        cursorRepoId: 0,
        batchLastRepoId: 10,
        sourceExhausted: true,
        finished: false,
        discoveredCount: 1,
        completedCount: 0,
        skippedCount: 0,
        discoveredItemCount: 0,
        processedItemCount: 0,
        skippedItemCount: 0,
        startedAt: now,
        updatedAt: now,
      },
      candidate: {
        key: '10',
        repoId: 10,
        repoName: 'owner/repo',
        orgId: 1,
        orgLogin: 'owner',
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
      },
    };
  };

  const syncConfig = (directory: string, ranges: WindowSyncMetadata['timeRanges']): SyncTaskConfig => ({
    stateDir: directory,
    maxConcurrency: 1,
    maxConcurrencyPerPrincipal: 1,
    maxRunSeconds: 10,
    snapshotEvery: 100,
    rateLimitReserve: 100,
    timeRanges: ranges,
    candidateBatchSize: 100,
    candidatePagesPerJob: 1,
  });

  afterEach(async () => {
    await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
  });

  it('normalizes, sorts, and merges overlapping or adjacent ranges', () => {
    assert.deepStrictEqual(normalizeTimeRanges([
      { start: '2025-02-01T00:00:00Z', end: '2025-03-01T00:00:00Z' },
      { start: '2025-01-15T00:00:00Z', end: '2025-02-01T00:00:00Z' },
      { start: '2025-01-01T08:00:00+08:00', end: '2025-01-10T00:00:00Z' },
    ]), [
      { start: '2025-01-01T00:00:00.000Z', end: '2025-01-10T00:00:00.000Z' },
      { start: '2025-01-15T00:00:00.000Z', end: '2025-03-01T00:00:00.000Z' },
    ]);
    assert.throws(
      () => normalizeTimeRanges([{ start: '2025-02-01', end: '2025-01-01' }]),
      /start earlier than end/,
    );
  });

  it('discovers repositories without depending on issue_number in global events', () => {
    const sql = buildWindowRepositoryQuery(
      [{ start: '2025-01-01T00:00:00.000Z', end: '2025-02-01T00:00:00.000Z' }],
      10,
      5000,
    );
    assert.match(sql, /events\.created_at >= '2025-01-01 00:00:00'/);
    assert.match(sql, /events\.created_at < '2025-02-01 00:00:00'/);
    assert.match(sql, /entity_type = 'Repo'/);
    assert.match(sql, /entity_type = 'Org'/);
    assert.match(sql, /events\.repo_id > 10/);
    assert.match(sql, /GROUP BY events\.repo_id/);
    assert.doesNotMatch(sql, /issue_number/);
    assert.doesNotMatch(sql, /WHERE[^]*latest_org_id/);
  });

  it('enumerates missing Issue/PR numbers from the repository API and checkpoints them', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    const store = new FileStateStore(directory, 100);
    await store.initialize();
    await store.putWindowState(metadata, [candidate]);
    const synchronizer = new IssuePullSynchronizer(store, syncConfig(directory, metadata.timeRanges));
    const credential = {
      request: async (route: string, parameters: Record<string, any>) => {
        assert.strictEqual(route, 'GET /repos/{owner}/{repo}/issues');
        assert.strictEqual(parameters.owner, 'owner');
        assert.strictEqual(parameters.repo, 'repo');
        assert.strictEqual(parameters.since, metadata.timeRanges[0].start);
        assert.strictEqual(parameters.sort, 'updated');
        return {
          data: [
            { id: 101, number: 7 },
            { id: 102, number: 8, pull_request: { url: 'https://api.github.test/pulls/8' } },
          ],
        };
      },
    } as unknown as ManagedCredential;

    await synchronizer.runRepositoryCandidate(candidate.key, metadata.timeRanges, credential, Date.now() + 10_000);
    assert.deepStrictEqual(store.state.repositoryItems[candidate.key], [
      { id: 101, number: 7, isPull: false },
      { id: 102, number: 8, isPull: true },
    ]);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].enumerationFinished, true);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].discoveredItemCount, 2);
    await store.close();
  });

  it('persists GitHub cursor links and migrates an offset-only enumeration checkpoint', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    candidate.listPage = 100;
    const store = new FileStateStore(directory, 100);
    await store.initialize();
    await store.putWindowState(metadata, [candidate]);
    const synchronizer = new IssuePullSynchronizer(store, syncConfig(directory, metadata.timeRanges));
    const nextUrl = 'https://api.github.com/repositories/10/issues?per_page=100&page=2&after=cursor-1';
    let requestCount = 0;
    const credential = {
      request: async (route: string, parameters: Record<string, any>) => {
        requestCount++;
        if (requestCount === 1) {
          assert.strictEqual(route, 'GET /repos/{owner}/{repo}/issues');
          assert.strictEqual(parameters.page, undefined);
          return {
            data: Array.from({ length: 100 }, (_, index) => ({ id: 1000 + index, number: index + 1 })),
            headers: { link: `<${nextUrl}>; rel="next"` },
          };
        }
        assert.strictEqual(route, 'GET /repositories/10/issues');
        assert.strictEqual(parameters.after, 'cursor-1');
        assert.strictEqual(parameters.page, undefined);
        return { data: [{ id: 1100, number: 101 }], headers: {} };
      },
    } as unknown as ManagedCredential;

    await synchronizer.runRepositoryCandidate(candidate.key, metadata.timeRanges, credential, Date.now() + 10_000);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].listPage, 2);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].listNextPageUrl, nextUrl);

    await synchronizer.runRepositoryCandidate(candidate.key, metadata.timeRanges, credential, Date.now() + 10_000);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].enumerationFinished, true);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].listNextPageUrl, undefined);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].discoveredItemCount, 101);
    await store.close();
  });

  it('filters generated API events with left-closed/right-open semantics', () => {
    const ranges = [
      { start: '2025-01-01T00:00:00.000Z', end: '2025-02-01T00:00:00.000Z' },
      { start: '2025-06-01T00:00:00.000Z', end: '2025-07-01T00:00:00.000Z' },
    ];
    const event = (created_at: string) => ({
      platform: 'GitHub', type: 'IssuesEvent', action: 'opened', actor_id: 1, actor_login: 'u',
      repo_id: 2, repo_name: 'o/r', org_id: 3, org_login: 'o', issue_id: 4, issue_number: 5, created_at,
    });
    assert.strictEqual(eventFallsInTimeRanges(event('2025-01-01 00:00:00'), ranges), true);
    assert.strictEqual(eventFallsInTimeRanges(event('2025-01-31 23:59:59'), ranges), true);
    assert.strictEqual(eventFallsInTimeRanges(event('2025-02-01 00:00:00'), ranges), false);
    assert.strictEqual(eventFallsInTimeRanges(event('2025-06-15 00:00:00'), ranges), true);
  });

  it('fetches only opened, closed, comment, and review data without reactions or reopened events', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    const store = new FileStateStore(directory, 100);
    await store.initialize();
    await store.putWindowState(metadata, [candidate]);
    await store.appendRepositoryItemPage(candidate.key, [{ id: 102, number: 8, isPull: true }], 1, true);
    const config = { ...syncConfig(directory, metadata.timeRanges), candidatePagesPerJob: 20 };
    const synchronizer = new IssuePullSynchronizer(store, config);
    const requestedRoutes: string[] = [];
    const issue = {
      id: 102,
      number: 8,
      title: 'PR',
      body: '',
      user: { id: 1, login: 'author' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      pull_request: { url: 'https://api.github.test/pulls/8' },
    };
    const pull = {
      ...issue,
      additions: 1,
      deletions: 0,
      base: { ref: 'main' },
      head: { ref: 'feature', repo: { id: 11, full_name: 'fork/repo' } },
    };
    const credential = {
      request: async (route: string) => {
        requestedRoutes.push(route);
        if (route === 'GET /repos/{owner}/{repo}/issues/{issue_number}') return { data: issue };
        if (route === 'GET /repos/{owner}/{repo}/pulls/{pull_number}') return { data: pull };
        return { data: [] };
      },
    } as unknown as ManagedCredential;

    await synchronizer.runRepositoryCandidate(candidate.key, metadata.timeRanges, credential, Date.now() + 10_000);

    assert.deepStrictEqual(requestedRoutes, [
      'GET /repos/{owner}/{repo}/issues/{issue_number}',
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
      'GET /repos/{owner}/{repo}/issues/{issue_number}/events',
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/comments',
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
    ]);
    assert.ok(requestedRoutes.every(route => !route.includes('reactions')));

    const base = {
      platform: 'GitHub', type: '', action: '', actor_id: 0, actor_login: '',
      repo_id: 10, repo_name: 'owner/repo', org_id: 1, org_login: 'owner',
      issue_id: 102, issue_number: 8,
    };
    const transitions = (synchronizer as any).transitionEvents(base, [
      { event: 'closed', created_at: '2025-01-02T00:00:00Z', actor: { id: 2, login: 'closer' } },
      { event: 'reopened', created_at: '2025-01-03T00:00:00Z', actor: { id: 3, login: 'reopener' } },
    ], 'PullRequestEvent');
    assert.deepStrictEqual(transitions.map((event: any) => event.action), ['closed']);
    await store.close();
  });

  it('replays repository and enumerated-item state and repairs an incomplete journal entry', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    const first = new FileStateStore(directory, 100);
    await first.initialize();
    await first.putWindowState(metadata, [candidate]);
    await first.appendRepositoryItemPage(candidate.key, [{ id: 101, number: 7, isPull: false }], 2, false);
    await first.close();

    await appendFile(join(directory, 'state.journal.jsonl'), '{"sequence":3');
    const second = new FileStateStore(directory, 100);
    await second.initialize();
    assert.strictEqual(second.state.windowSync?.scopeHash, metadata.scopeHash);
    assert.strictEqual(second.state.repositoryCandidates['10'].listPage, 2);
    assert.strictEqual(second.state.repositoryItems['10'][0].number, 7);
    assert.strictEqual(second.state.lastSequence, 2);
    await second.close();
  });

  it('deduplicates API enumeration overlaps by stable issue ID', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    const store = new FileStateStore(directory, 100);
    await store.initialize();
    await store.putWindowState(metadata, [candidate]);
    await store.appendRepositoryItemPage(candidate.key, [
      { id: 101, number: 7, isPull: false },
      { id: 102, number: 8, isPull: true },
    ], 2, false);
    await store.appendRepositoryItemPage(candidate.key, [
      { id: 102, number: 8, isPull: true },
      { id: 103, number: 9, isPull: false },
    ], 2, true);
    assert.deepStrictEqual(store.state.repositoryItems[candidate.key].map(item => item.id), [101, 102, 103]);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].discoveredItemCount, 3);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].enumerationFinished, true);
    await store.close();
  });

  it('recovers a completed repository from a compacted snapshot', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    const first = new FileStateStore(directory, 2);
    await first.initialize();
    await first.putWindowState(metadata, [candidate]);
    candidate.completed = true;
    await first.putRepositoryCandidate(candidate);
    await first.close();

    assert.strictEqual(await readFile(join(directory, 'state.journal.jsonl'), 'utf8'), '');
    const second = new FileStateStore(directory, 2);
    await second.initialize();
    assert.strictEqual(second.state.repositoryCandidates['10'].completed, true);
    assert.strictEqual(second.state.lastSequence, 2);
    await second.close();
  });

  it('deduplicates identical tokens from config and token file', async () => {
    const directory = await temporaryDirectory();
    const tokenFile = join(directory, 'tokens.json');
    await writeFile(tokenFile, JSON.stringify([
      'same-token',
      { id: 'second', token: 'different-token' },
    ]));
    assert.deepStrictEqual(loadTokenInputs(['same-token'], tokenFile), [
      { id: 'token-1', token: 'same-token' },
      { id: 'second', token: 'different-token' },
    ]);
  });

  it('stops scheduling a repository confirmed unavailable by stable ID', async () => {
    const directory = await temporaryDirectory();
    const { metadata, candidate } = windowState();
    const store = new FileStateStore(directory, 100);
    await store.initialize();
    await store.putWindowState(metadata, [candidate]);
    const synchronizer = new IssuePullSynchronizer(store, syncConfig(directory, metadata.timeRanges));
    const credential = {
      request: async (route: string) => {
        if (route === 'GET /repos/{owner}/{repo}/issues') {
          throw Object.assign(new Error('Not Found'), { status: 404 });
        }
        assert.strictEqual(route, 'GET /repositories/{repository_id}');
        throw Object.assign(new Error('Not Found'), { status: 404 });
      },
    } as unknown as ManagedCredential;

    let unavailable: RepositoryUnavailableError | undefined;
    try {
      await synchronizer.runRepositoryCandidate(candidate.key, metadata.timeRanges, credential, Date.now() + 10_000);
    } catch (error: any) {
      unavailable = error;
    }
    assert.ok(unavailable instanceof RepositoryUnavailableError);
    await synchronizer.markUnavailable(candidate.key, unavailable!);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].completed, true);
    assert.strictEqual(store.state.repositoryCandidates[candidate.key].skipped, true);
    await store.close();
  });

  it('stops before a request when the primary-rate reserve is reached', async () => {
    const resetAt = new Date(Date.now() + 60_000).toISOString();
    const credential = new ManagedCredential(
      { id: 'limited', token: 'not-used' },
      { fingerprint: 'test', remaining: 10, limit: 5000, resetAt },
      100,
    );
    await assert.rejects(
      () => credential.request('GET /user'),
      (error: any) => error instanceof GitHubLimitError && error.kind === 'primary' && error.retryAt === resetAt,
    );
  });

  it('applies a shared secondary-rate cooldown before every request', async () => {
    const cooldown = new Date(Date.now() + 60_000).toISOString();
    const credential = new ManagedCredential(
      { id: 'secondary-limited', token: 'not-used' },
      { fingerprint: 'test' },
      0,
      () => cooldown,
    );
    await assert.rejects(
      () => credential.request('GET /user'),
      (error: any) => error instanceof GitHubLimitError && error.kind === 'secondary' && error.retryAt === cooldown,
    );
  });

  it('allows two concurrent lanes per GitHub principal', async () => {
    const directory = await temporaryDirectory();
    const store = new FileStateStore(directory, 100);
    await store.initialize();
    const inputs = [
      { id: 'first', token: 'first-token' },
      { id: 'same-principal', token: 'second-token' },
    ];
    for (const input of inputs) {
      const credential = new ManagedCredential(input, undefined);
      await store.putCredential({
        fingerprint: credential.fingerprint,
        principalId: 42,
        principalLogin: 'shared-principal',
        remaining: 5000,
        limit: 5000,
        resetAt: new Date(Date.now() + 60_000).toISOString(),
      });
    }
    const pool = new TokenPool(inputs, store, 100, 2, logger);
    await pool.initialize();
    assert.strictEqual(pool.principalCount, 1);
    assert.strictEqual(pool.concurrencyCapacity, 2);
    const first = pool.acquire();
    const second = pool.acquire();
    assert.ok(first);
    assert.ok(second);
    assert.strictEqual(pool.acquire(), undefined);
    await pool.release(first!);
    assert.ok(pool.acquire());
    await pool.release(second!);
    await store.close();
  });

  it('keeps concurrent rate-limit responses monotonic within one reset window', () => {
    const resetSeconds = Math.floor(Date.now() / 1000) + 3600;
    const credential = new ManagedCredential(
      { id: 'concurrent', token: 'not-used' },
      { fingerprint: 'test', remaining: 100, limit: 5000, resetAt: new Date(resetSeconds * 1000).toISOString() },
    );
    const update = (remaining: number, reset = resetSeconds) => (credential as any).updateRateState({
      'x-ratelimit-remaining': String(remaining),
      'x-ratelimit-limit': '5000',
      'x-ratelimit-reset': String(reset),
    });
    update(98);
    update(99);
    assert.strictEqual(credential.runtime.remaining, 98);
    update(4999, resetSeconds + 3600);
    assert.strictEqual(credential.runtime.remaining, 4999);
  });
});
