import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Octokit } from '@octokit/rest';
import { FileStateStore } from './stateStore';
import { CredentialRuntimeState, TokenInput } from './types';

type Logger = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

export type GitHubLimitErrorKind = 'primary' | 'secondary' | 'unauthorized';

export class GitHubLimitError extends Error {
  constructor(
    public readonly kind: GitHubLimitErrorKind,
    message: string,
    public readonly retryAt?: string,
  ) {
    super(message);
  }
}

export const fingerprintToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex').slice(0, 20);

const numberHeader = (headers: Record<string, any> | undefined, name: string): number | undefined => {
  const value = headers?.[name];
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resetHeader = (headers: Record<string, any> | undefined): string | undefined => {
  const seconds = numberHeader(headers, 'x-ratelimit-reset');
  return seconds === undefined ? undefined : new Date(seconds * 1000).toISOString();
};

export const loadTokenInputs = (
  configuredTokens: Array<string | { id?: string; token: string }>,
  tokenFile?: string,
): TokenInput[] => {
  const raw: Array<string | { id?: string; token: string }> = [...configuredTokens];
  if (tokenFile) {
    const parsed = JSON.parse(readFileSync(resolve(tokenFile), 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('GitHub token file must contain a JSON array.');
    raw.push(...parsed);
  }

  const unique = new Map<string, TokenInput>();
  raw.forEach((entry, index) => {
    if (typeof entry !== 'string' && (!entry || typeof entry.token !== 'string')) {
      throw new Error(`Invalid GitHub token entry at index ${index}.`);
    }
    const token = typeof entry === 'string' ? entry : entry.token;
    if (!token) return;
    const fingerprint = fingerprintToken(token);
    if (!unique.has(fingerprint)) {
      unique.set(fingerprint, {
        id: typeof entry === 'string' ? `token-${index + 1}` : entry.id ?? `token-${index + 1}`,
        token,
      });
    }
  });
  return Array.from(unique.values());
};

export class ManagedCredential {
  readonly fingerprint: string;
  readonly octokit: Octokit;
  runtime: CredentialRuntimeState;

  constructor(
    readonly input: TokenInput,
    persistedState: CredentialRuntimeState | undefined,
    private readonly reserve = 0,
    private readonly globalCooldownUntil: () => string | undefined = () => undefined,
  ) {
    this.fingerprint = fingerprintToken(input.token);
    this.octokit = new Octokit({
      auth: input.token,
      userAgent: 'open-digger-github-issue-pull-sync',
    });
    this.runtime = persistedState ? { ...persistedState } : { fingerprint: this.fingerprint };
  }

  async request(route: string, parameters: Record<string, any> = {}): Promise<any> {
    this.assertAvailable();
    try {
      const response = await this.octokit.request(route, {
        ...parameters,
        headers: {
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
          ...(parameters.headers ?? {}),
        },
      });
      this.updateRateState(response.headers);
      return response;
    } catch (error: any) {
      const headers = error?.response?.headers as Record<string, any> | undefined;
      this.updateRateState(headers);
      const status = error?.status ?? error?.response?.status;
      const message = error?.message ?? String(error);
      if (status === 401) {
        this.runtime.disabled = true;
        this.runtime.lastError = message;
        throw new GitHubLimitError('unauthorized', message);
      }

      const retryAfter = numberHeader(headers, 'retry-after');
      const secondary = message.toLowerCase().includes('secondary rate limit') ||
        (status === 403 && retryAfter !== undefined);
      if (secondary) {
        const retryAt = new Date(Date.now() + Math.max(60, retryAfter ?? 60) * 1000).toISOString();
        this.runtime.cooldownUntil = retryAt;
        this.runtime.lastError = message;
        throw new GitHubLimitError('secondary', message, retryAt);
      }

      if ((status === 403 || status === 429) && this.runtime.remaining === 0) {
        this.runtime.cooldownUntil = this.runtime.resetAt;
        this.runtime.lastError = message;
        throw new GitHubLimitError('primary', message, this.runtime.resetAt);
      }
      throw error;
    }
  }

  private assertAvailable(): void {
    if (this.runtime.disabled) {
      throw new GitHubLimitError('unauthorized', 'GitHub credential is disabled after an authentication failure.');
    }
    const now = Date.now();
    const globalCooldownUntil = this.globalCooldownUntil();
    if (globalCooldownUntil && new Date(globalCooldownUntil).getTime() > now) {
      throw new GitHubLimitError('secondary', 'GitHub requests are paused by a secondary-rate-limit cooldown.', globalCooldownUntil);
    }
    const cooldownUntil = this.runtime.cooldownUntil;
    if (cooldownUntil && new Date(cooldownUntil).getTime() > now) {
      throw new GitHubLimitError('primary', 'GitHub credential is waiting for its rate-limit reset.', cooldownUntil);
    }
    const resetAt = this.runtime.resetAt;
    if (resetAt && new Date(resetAt).getTime() <= now) {
      this.runtime.remaining = undefined;
      this.runtime.cooldownUntil = undefined;
    }
    if ((this.runtime.remaining ?? Number.MAX_SAFE_INTEGER) <= this.reserve &&
      resetAt && new Date(resetAt).getTime() > now) {
      this.runtime.cooldownUntil = resetAt;
      throw new GitHubLimitError('primary', 'GitHub credential reached the configured rate-limit reserve.', resetAt);
    }
  }

  private updateRateState(headers: Record<string, any> | undefined): void {
    const remaining = numberHeader(headers, 'x-ratelimit-remaining');
    const limit = numberHeader(headers, 'x-ratelimit-limit');
    const nextResetAt = resetHeader(headers);
    if (remaining !== undefined) {
      const sameWindow = !nextResetAt || !this.runtime.resetAt || this.runtime.resetAt === nextResetAt;
      this.runtime.remaining = sameWindow && this.runtime.remaining !== undefined
        ? Math.min(this.runtime.remaining, remaining)
        : remaining;
    }
    if (limit !== undefined) this.runtime.limit = limit;
    this.runtime.resetAt = nextResetAt ?? this.runtime.resetAt;
  }
}

interface PrincipalGroup {
  key: string;
  credentials: ManagedCredential[];
  inUse: number;
  remaining?: number;
  limit?: number;
  resetAt?: string;
  cooldownUntil?: string;
}

export class TokenPool {
  private credentials: ManagedCredential[] = [];
  private groups: PrincipalGroup[] = [];

  constructor(
    tokenInputs: TokenInput[],
    private readonly store: FileStateStore,
    private readonly reserve: number,
    private readonly maxConcurrencyPerPrincipal: number,
    private readonly logger: Logger,
  ) {
    this.replaceCredentials(tokenInputs);
  }

  async initialize(): Promise<void> {
    for (const credential of this.credentials) {
      const before = this.store.state.credentials[credential.fingerprint];
      if (!credential.runtime.principalId && !credential.runtime.disabled) {
        try {
          const response = await credential.request('GET /user');
          credential.runtime.principalId = Number(response.data.id);
          credential.runtime.principalLogin = response.data.login;
          credential.runtime.lastError = undefined;
        } catch (error: any) {
          if (error instanceof GitHubLimitError && error.kind === 'secondary') {
            await this.handleLimitError(error);
          } else if (!(error instanceof GitHubLimitError)) {
            credential.runtime.cooldownUntil = new Date(Date.now() + 5 * 60_000).toISOString();
            credential.runtime.lastError = error.message;
          }
          this.logger.warn(`Failed to validate GitHub credential ${credential.input.id}: ${error.message}`);
        }
      }
      if (JSON.stringify(before) !== JSON.stringify(credential.runtime)) {
        await this.store.putCredential(credential.runtime);
      }
    }
    this.rebuildGroups();
    this.logger.info(`Loaded ${this.credentials.length} tokens for ${this.groups.length} GitHub principals.`);
  }

  async reload(tokenInputs: TokenInput[]): Promise<void> {
    this.replaceCredentials(tokenInputs);
    await this.initialize();
  }

  get principalCount(): number {
    return this.groups.filter(group => group.credentials.some(item => !item.runtime.disabled)).length;
  }

  get concurrencyCapacity(): number {
    return this.principalCount * this.maxConcurrencyPerPrincipal;
  }

  acquire(): ManagedCredential | undefined {
    const now = Date.now();
    const globallyBlockedUntil = this.store.state.metadata.globalCooldownUntil;
    if (globallyBlockedUntil && new Date(globallyBlockedUntil).getTime() > now) return undefined;

    const candidates = this.groups
      .filter(group => group.inUse < this.maxConcurrencyPerPrincipal &&
        group.credentials.some(item => !item.runtime.disabled) &&
        this.groupAvailable(group, now))
      .sort((a, b) => {
        const remainingDifference = (b.remaining ?? Number.MAX_SAFE_INTEGER) -
          (a.remaining ?? Number.MAX_SAFE_INTEGER);
        return remainingDifference || a.inUse - b.inUse;
      });
    const group = candidates[0];
    if (!group) return undefined;
    const credential = group.credentials.find(item => !item.runtime.disabled);
    if (!credential) return undefined;
    group.inUse++;
    return credential;
  }

  async release(credential: ManagedCredential): Promise<void> {
    const group = this.findGroup(credential);
    if (group) {
      group.inUse = Math.max(0, group.inUse - 1);
      group.remaining = credential.runtime.remaining;
      group.limit = credential.runtime.limit;
      group.resetAt = credential.runtime.resetAt;
      group.cooldownUntil = credential.runtime.cooldownUntil;
      for (const sibling of group.credentials) {
        sibling.runtime.remaining = group.remaining;
        sibling.runtime.limit = group.limit;
        sibling.runtime.resetAt = group.resetAt;
        sibling.runtime.cooldownUntil = group.cooldownUntil;
      }
    }
    await this.store.putCredential(credential.runtime);
  }

  async handleLimitError(error: GitHubLimitError): Promise<void> {
    if (error.kind !== 'secondary') return;
    const metadata = { ...this.store.state.metadata };
    metadata.globalCooldownUntil = error.retryAt ?? new Date(Date.now() + 60_000).toISOString();
    await this.store.putMetadata(metadata);
    this.logger.warn(`GitHub secondary rate limit hit; pause all requests until ${metadata.globalCooldownUntil}.`);
  }

  private rebuildGroups(): void {
    const map = new Map<string, PrincipalGroup>();
    for (const credential of this.credentials) {
      if (credential.runtime.disabled) continue;
      const key = credential.runtime.principalId
        ? `principal:${credential.runtime.principalId}`
        : `token:${credential.fingerprint}`;
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          credentials: [],
          inUse: 0,
          remaining: credential.runtime.remaining,
          limit: credential.runtime.limit,
          resetAt: credential.runtime.resetAt,
          cooldownUntil: credential.runtime.cooldownUntil,
        };
        map.set(key, group);
      }
      group.credentials.push(credential);
    }
    this.groups = Array.from(map.values());
  }

  private replaceCredentials(tokenInputs: TokenInput[]): void {
    this.credentials = tokenInputs.map(input => {
      const fingerprint = fingerprintToken(input.token);
      return new ManagedCredential(
        input,
        this.store.state.credentials[fingerprint],
        this.reserve,
        () => this.store.state.metadata.globalCooldownUntil,
      );
    });
  }

  private findGroup(credential: ManagedCredential): PrincipalGroup | undefined {
    return this.groups.find(group => group.credentials.includes(credential));
  }

  private groupAvailable(group: PrincipalGroup, now: number): boolean {
    const cooldownUntil = group.cooldownUntil ? new Date(group.cooldownUntil).getTime() : 0;
    if (cooldownUntil > now) return false;
    const resetAt = group.resetAt ? new Date(group.resetAt).getTime() : 0;
    if ((group.remaining ?? Number.MAX_SAFE_INTEGER) <= this.reserve && resetAt > now) return false;
    if (resetAt > 0 && resetAt <= now) {
      group.remaining = group.limit;
      group.cooldownUntil = undefined;
    }
    return true;
  }
}
