import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { formatDate, getLogger, runTasks } from '../../utils';
import { Octokit } from '@octokit/rest';
import { InsertRecord } from './updateGithubAppRepoData/utils';

/**
 * This task scans events table for GitHub PRs that have a logged 'opened' event
 * but never received a 'closed' event (logs are missing PR close/merge events
 * since 2026-05). For each such PR, it fetches the PR detail via Octokit REST
 * API and, only when the PR is actually closed/merged, writes a paired
 * (opened, closed) event back into events with from_api=1, also setting
 * pull_merged=1 if merged. PRs that are still open are skipped this round to
 * avoid producing duplicate opened events on every random sample.
 */

let round = 0;
const API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED';
const MISSING_DATA_START = '2025-05-01 00:00:00';

const task: Task = {
  cron: '*/10 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateGithubPullsInfoTask');
    const config: any = await getConfig();

    const updateCount = config.task.configs.updateGithubPullsInfo.updateBatchSize;
    const concurrentRequestNumber = config.task.configs.updateGithubPullsInfo.concurrentRequestNumber;

    const tokens: string[] | undefined = config?.task?.configs?.updateGithubPullsInfo?.tokens;
    if (!tokens || tokens.length === 0) {
      logger.error('No tokens configured at task.configs.updateGithubPullsInfo.tokens, exit.');
      return;
    }
    const token = tokens[round++ % tokens.length];
    const oct = new Octokit({ auth: `Bearer ${token}` });

    // Find PRs that have an 'opened' event but no 'closed' event in the
    // missing-data window, excluding PRs already backfilled by this task.
    const getMissingClosedPulls = async (limit: number): Promise<any[]> => {
      const sql = `
        SELECT argMax(repo_id, created_at) AS repo_id,
               argMax(repo_name, created_at) AS repo_name,
               argMax(issue_number, created_at) AS issue_number,
               issue_id
        FROM events
        WHERE platform = 'GitHub'
          AND type = 'PullRequestEvent'
          AND created_at >= '${MISSING_DATA_START}'
          AND created_at <  subtractDays(now(), 12)
          AND from_api = 0
          AND (((platform, events.repo_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE entity_type = 'Repo'))
            OR ((platform, events.org_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE entity_type = 'Org')))
          AND (platform, events.repo_id) NOT IN (SELECT platform, id FROM repo_info WHERE status='not_found')
        GROUP BY issue_id
        HAVING countIf(action = 'opened') > 0
           AND countIf(action = 'closed') = 0
           AND issue_id NOT IN (
             SELECT issue_id FROM events
             WHERE platform = 'GitHub' AND type = 'PullRequestEvent'
               AND action = 'closed' AND from_api = 1
               AND created_at >= '${MISSING_DATA_START}'
           )
        ORDER BY rand()
        LIMIT ${limit}`;
      return await query(sql);
    };

    // Fetch PR detail and build (opened, closed) event pair when closed_at is set.
    const fetchPullEvents = async (
      repoId: number, repoName: string, issueNumber: number, issueIdFromDb: number,
    ): Promise<{ events: InsertRecord[] } | typeof API_RATE_LIMIT_EXCEEDED | null> => {
      const [owner, repo] = repoName.split('/');
      try {
        const { data: pr } = await oct.pulls.get({ owner, repo, pull_number: issueNumber });

        // PR still open: skip entirely to avoid duplicate opened events.
        if (!pr.closed_at) return null;
        if (!pr.user) return null;

        const ownerInfo: any = pr.base?.repo?.owner;
        const orgId = ownerInfo?.type === 'Organization' ? ownerInfo.id : 0;
        const orgLogin = ownerInfo?.type === 'Organization' ? ownerInfo.login : '';

        const labels = pr.labels ?? [];
        const basePullItem: InsertRecord = {
          platform: 'GitHub',
          type: '',
          action: '',
          actor_id: 0,
          actor_login: '',
          repo_id: repoId,
          repo_name: repoName,
          org_id: orgId,
          org_login: orgLogin,
          issue_id: pr.id,
          issue_number: pr.number,
          issue_title: pr.title ?? '',
          body: pr.body ?? '',
          issue_author_id: pr.user.id,
          issue_author_login: pr.user.login,
          issue_created_at: formatDate(pr.created_at),
          issue_closed_at: pr.closed_at ? formatDate(pr.closed_at) : undefined,
          'issue_labels.name': labels.map((l: any) => l.name ?? ''),
          'issue_labels.color': labels.map((l: any) => l.color ?? ''),
          'issue_labels.default': labels.map((l: any) => (l.default ? 1 : 0)),
          'issue_labels.description': labels.map((l: any) => l.description ?? ''),
          pull_additions: pr.additions ?? 0,
          pull_deletions: pr.deletions ?? 0,
          pull_base_ref: pr.base?.ref ?? '',
          pull_head_ref: pr.head?.ref ?? '',
          pull_head_repo_id: pr.head?.repo?.id ?? 0,
          from_api: 1,
        };

        const events: InsertRecord[] = [];
        // opened event: actor is the PR author. Bot accounts already include
        // the [bot] suffix in REST `login`, do NOT append it manually here.
        events.push({
          ...basePullItem,
          type: 'PullRequestEvent',
          action: 'opened',
          actor_id: pr.user.id,
          actor_login: pr.user.login,
          created_at: formatDate(pr.created_at),
        });
        // closed event: prefer merged_by when merged, else PR author as actor.
        const closedActor = pr.merged && pr.merged_by ? pr.merged_by : pr.user;
        events.push({
          ...basePullItem,
          type: 'PullRequestEvent',
          action: 'closed',
          actor_id: closedActor.id,
          actor_login: closedActor.login,
          pull_merged: pr.merged ? 1 : 0,
          created_at: formatDate(pr.merged_at ?? pr.closed_at),
        });

        return { events };
      } catch (e: any) {
        const msg: string = e?.message ?? '';
        if (msg.includes('API rate limit exceeded')) {
          return API_RATE_LIMIT_EXCEEDED;
        }
        if (e?.status === 404) {
          // PR 在 GitHub 已不可访问（被删除/转为 private/repo 迁移等）。
          // 写一条 from_api=1 的 closed 占位事件（pull_merged=0），
          // 让子查询 NOT IN 识别、下次不再重复调 API。
          logger.warn(`PR not found, mark closed via 404: ${repoName}#${issueNumber}`);
          const nowStr = formatDate(new Date().toISOString());
          const placeholder: InsertRecord = {
            platform: 'GitHub',
            type: 'PullRequestEvent',
            action: 'closed',
            actor_id: 0,
            actor_login: '',
            repo_id: repoId,
            repo_name: repoName,
            org_id: 0,
            org_login: '',
            issue_id: issueIdFromDb, // PR 详情拿不到，复用本轮查出的 issue_id，以保证 NOT IN 子查询能识别去重
            issue_number: issueNumber,
            pull_merged: 0,
            created_at: nowStr,
            from_api: 1,
          };
          return { events: [placeholder] };
        }
        logger.warn(`Error fetching ${repoName}#${issueNumber}: ${msg}`);
        return null;
      }
    };

    const pulls = await getMissingClosedPulls(updateCount);
    if (pulls.length === 0) {
      logger.info('No pulls to backfill.');
      logger.info('UpdateGithubPullsInfoTask done.');
      return;
    }
    logger.info(`Got ${pulls.length} pulls to backfill.`);

    let rateLimitHit = false;
    let okCount = 0;
    let skipCount = 0;
    const allEvents: InsertRecord[] = [];

    await runTasks(pulls.map(p => async () => {
      if (rateLimitHit) return;
      const [repoId, repoName, issueNumber, issueId] = p;
      const result = await fetchPullEvents(+repoId, repoName, +issueNumber, +issueId);
      if (result === API_RATE_LIMIT_EXCEEDED) {
        if (!rateLimitHit) {
          rateLimitHit = true;
          logger.warn('API rate limit exceeded, stop fetching this round.');
        }
        return;
      }
      if (!result) {
        skipCount++;
        return;
      }
      allEvents.push(...result.events);
      okCount++;
    }), concurrentRequestNumber);

    if (allEvents.length > 0) {
      await insertRecords(allEvents, 'events');
    }
    logger.info(`Inserted ${allEvents.length} events for ${okCount} pulls, skipped ${skipCount}.`);
    logger.info('UpdateGithubPullsInfoTask done.');
  }
};

module.exports = task;
