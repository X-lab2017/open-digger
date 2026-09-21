import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { open, readFile, rename, truncate } from 'fs/promises';
import { join } from 'path';
import {
  CredentialRuntimeState,
  IssueReference,
  JournalEntry,
  RepositoryCandidateState,
  SchedulerMetadata,
  SchedulerState,
  StatePatch,
  WindowSyncMetadata,
  defaultSchedulerState,
} from './types';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export class FileStateStore {
  private readonly snapshotPath: string;
  private readonly journalPath: string;
  private readonly lockPath: string;
  private currentState: SchedulerState = defaultSchedulerState();
  private commitQueue: Promise<void> = Promise.resolve();
  private journalEntriesSinceSnapshot = 0;
  private lockAcquired = false;
  private readonly exitHandler = (): void => {
    try {
      const existing = this.readExistingLock();
      if (existing?.pid === process.pid) unlinkSync(this.lockPath);
    } catch {
      // Best-effort cleanup; stale locks are checked during the next startup.
    }
  };

  constructor(private readonly stateDir: string, private readonly snapshotEvery: number) {
    this.snapshotPath = join(stateDir, 'state.snapshot.json');
    this.journalPath = join(stateDir, 'state.journal.jsonl');
    this.lockPath = join(stateDir, 'runner.lock');
  }

  get state(): SchedulerState {
    return this.currentState;
  }

  async initialize(): Promise<void> {
    mkdirSync(this.stateDir, { recursive: true });
    this.acquireProcessLock();
    try {
      if (existsSync(this.snapshotPath)) {
        const content = await readFile(this.snapshotPath, 'utf8');
        const parsed = JSON.parse(content) as SchedulerState;
        if (parsed.schemaVersion !== 1) {
          throw new Error(`Unsupported state schema version: ${parsed.schemaVersion}`);
        }
        this.currentState = parsed;
        this.currentState.repositoryCandidates ??= {};
        this.currentState.repositoryItems ??= {};
      }

      if (existsSync(this.journalPath)) {
        const content = await readFile(this.journalPath, 'utf8');
        const lines = content.split('\n');
        let repairLength: number | undefined;
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          if (!line.trim()) continue;
          let entry: JournalEntry;
          try {
            entry = JSON.parse(line) as JournalEntry;
          } catch (error) {
            const isLastNonEmptyLine = lines.slice(index + 1).every(candidate => !candidate.trim());
            if (isLastNonEmptyLine) {
              const validPrefix = index === 0 ? '' : `${lines.slice(0, index).join('\n')}\n`;
              repairLength = Buffer.byteLength(validPrefix);
              break;
            }
            throw error;
          }
          this.journalEntriesSinceSnapshot++;
          if (entry.sequence <= this.currentState.lastSequence) continue;
          this.applyPatch(entry.patch);
          this.currentState.lastSequence = entry.sequence;
        }
        if (repairLength !== undefined) {
          await truncate(this.journalPath, repairLength);
        } else if (content && !content.endsWith('\n')) {
          const handle = await open(this.journalPath, 'a');
          try {
            await handle.writeFile('\n', 'utf8');
            await handle.sync();
          } finally {
            await handle.close();
          }
        }
      }
    } catch (error) {
      this.releaseProcessLock();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.flush();
    this.releaseProcessLock();
  }

  async putCredential(credential: CredentialRuntimeState): Promise<void> {
    await this.commit({ type: 'putCredential', credential: clone(credential) });
  }

  async putMetadata(metadata: SchedulerMetadata): Promise<void> {
    await this.commit({ type: 'putMetadata', metadata: clone(metadata) });
  }

  async putRepositoryCandidate(candidate: RepositoryCandidateState): Promise<void> {
    await this.commit({ type: 'putRepositoryCandidate', candidate: clone(candidate) });
  }

  async appendRepositoryItemPage(
    candidateKey: string,
    items: IssueReference[],
    nextListPage: number,
    enumerationFinished: boolean,
    nextListPageUrl?: string,
  ): Promise<void> {
    await this.commit({
      type: 'appendRepositoryItemPage',
      candidateKey,
      items: clone(items),
      nextListPage,
      nextListPageUrl,
      enumerationFinished,
      updatedAt: new Date().toISOString(),
    });
  }

  async clearRepositoryItems(candidateKey: string): Promise<void> {
    await this.commit({ type: 'clearRepositoryItems', candidateKey });
  }

  async putWindowState(metadata: WindowSyncMetadata, candidates: RepositoryCandidateState[]): Promise<void> {
    await this.commit({
      type: 'putWindowState',
      metadata: clone(metadata),
      candidates: clone(candidates),
    });
  }

  async flush(): Promise<void> {
    await this.commitQueue;
  }

  async compact(): Promise<void> {
    const operation = this.commitQueue.then(() => this.writeSnapshot());
    this.commitQueue = operation.catch(() => undefined);
    await operation;
  }

  private async commit(patch: StatePatch): Promise<void> {
    const operation = this.commitQueue.then(() => this.writeJournalEntry(patch));
    this.commitQueue = operation.catch(() => undefined);
    await operation;
  }

  private async writeJournalEntry(patch: StatePatch): Promise<void> {
    const entry: JournalEntry = {
      sequence: this.currentState.lastSequence + 1,
      createdAt: new Date().toISOString(),
      patch,
    };
    const handle = await open(this.journalPath, 'a');
    try {
      await handle.writeFile(`${JSON.stringify(entry)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }

    this.applyPatch(patch);
    this.currentState.lastSequence = entry.sequence;
    this.journalEntriesSinceSnapshot++;
    if (this.journalEntriesSinceSnapshot >= this.snapshotEvery) {
      await this.writeSnapshot();
    }
  }

  private applyPatch(patch: StatePatch): void {
    switch (patch.type) {
      case 'putCredential':
        this.currentState.credentials[patch.credential.fingerprint] = clone(patch.credential);
        break;
      case 'putMetadata':
        this.currentState.metadata = clone(patch.metadata);
        break;
      case 'putRepositoryCandidate':
        this.currentState.repositoryCandidates[patch.candidate.key] = clone(patch.candidate);
        break;
      case 'appendRepositoryItemPage': {
        const candidate = this.currentState.repositoryCandidates[patch.candidateKey];
        if (!candidate) break;
        const existing = this.currentState.repositoryItems[patch.candidateKey] ?? [];
        const unique = new Map(existing.map(item => [item.id, item]));
        for (const item of patch.items) unique.set(item.id, clone(item));
        this.currentState.repositoryItems[patch.candidateKey] = Array.from(unique.values());
        candidate.listPage = patch.nextListPage;
        candidate.listNextPageUrl = patch.nextListPageUrl;
        candidate.enumerationFinished = patch.enumerationFinished;
        candidate.discoveredItemCount = unique.size;
        candidate.updatedAt = patch.updatedAt;
        break;
      }
      case 'clearRepositoryItems':
        delete this.currentState.repositoryItems[patch.candidateKey];
        break;
      case 'putWindowState':
        this.currentState.windowSync = clone(patch.metadata);
        this.currentState.repositoryCandidates = Object.fromEntries(
          patch.candidates.map(candidate => [candidate.key, clone(candidate)]),
        );
        this.currentState.repositoryItems = {};
        break;
    }
  }

  private async writeSnapshot(): Promise<void> {
    const tempPath = `${this.snapshotPath}.tmp-${process.pid}`;
    const handle = await open(tempPath, 'w');
    try {
      await handle.writeFile(JSON.stringify(this.currentState), 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tempPath, this.snapshotPath);
    if (existsSync(this.journalPath)) {
      await truncate(this.journalPath, 0);
    }
    this.journalEntriesSinceSnapshot = 0;
  }

  private acquireProcessLock(): void {
    if (this.lockAcquired) return;
    try {
      const fd = openSync(this.lockPath, 'wx');
      writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      closeSync(fd);
    } catch (error: any) {
      if (error?.code !== 'EEXIST') throw error;
      const existing = this.readExistingLock();
      if (existing?.pid && this.isProcessAlive(existing.pid)) {
        throw new Error(`GitHub sync runner is already active with pid=${existing.pid}`);
      }
      unlinkSync(this.lockPath);
      const fd = openSync(this.lockPath, 'wx');
      writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      closeSync(fd);
    }
    this.lockAcquired = true;
    process.once('exit', this.exitHandler);
  }

  private releaseProcessLock(): void {
    if (!this.lockAcquired) return;
    try {
      const existing = this.readExistingLock();
      if (existing?.pid === process.pid) unlinkSync(this.lockPath);
    } finally {
      process.removeListener('exit', this.exitHandler);
      this.lockAcquired = false;
    }
  }

  private readExistingLock(): { pid?: number } | undefined {
    try {
      return JSON.parse(readFileSync(this.lockPath, 'utf8'));
    } catch {
      return undefined;
    }
  }

  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error: any) {
      return error?.code === 'EPERM';
    }
  }
}
