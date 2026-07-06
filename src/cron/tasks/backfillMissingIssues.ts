import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { formatDate, getLogger, runTasks } from '../../utils';
import { Octokit } from '@octokit/rest';
import { InsertRecord } from './updateGithubAppRepoData/utils';

/**
 * This task backfills missing Issue/PR/Discussion data for GitHub repos covered by labels.
 *
 * Issue numbers in GitHub repos are sequential (shared across Issues, PRs, and Discussions),
 * but some are missing from the events table due to incomplete log ingestion. This task:
 * 1. Detects gaps in issue_number sequences per repo using array-based gap detection
 * 2. Fetches each missing number via GitHub REST API (Issues endpoint works for both Issues and PRs)
 * 3. On 404: tries GraphQL to check if it's a Discussion; if found, inserts DiscussionEvent
 * 4. If still not found: inserts a 'deleted' placeholder to prevent future retries
 * 5. Inserts opened/closed events (and merge info for PRs) into events with from_api=1
 *
 * GitHub's Issues API (`GET /repos/{owner}/{repo}/issues/{number}`) returns both Issues and PRs.
 * When the item is a PR, the response includes a `pull_request` field. For PR-specific details
 * (additions, deletions, merged status), we additionally call the Pulls API.
 * Discussions are only accessible via GraphQL (`repository.discussion(number:)`).
 */

const BATCH_SIZE = 2500;
const CONCURRENT_REQUESTS = 25;
const API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED';
// Max gap size to backfill: gaps larger than this are treated as data anomalies and skipped.
const MAX_GAP_SIZE = 2000;
let round = 2;

const task: Task = {
  cron: '*/10 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('BackfillMissingIssuesTask');
    const config: any = await getConfig();

    const tokens: string[] | undefined = config?.task?.configs?.backfillMissingIssues?.tokens;
    if (!tokens || tokens.length === 0) {
      logger.error('No tokens configured at task.configs.backfillMissingIssues.tokens, exit.');
      return;
    }
    const token = tokens[round++ % tokens.length];
    const oct = new Octokit({ auth: `Bearer ${token}` });

    // Find missing issue numbers using gap detection on sorted arrays.
    // This approach only generates numbers in actual gaps, not the full 1..max sequence.
    // Uses export_repo.repo_name as the authoritative name to avoid argMax pollution.
    // Gap detection range is based ONLY on 'opened'/'created' events (real data);
    // 'deleted' placeholders are excluded from range computation to prevent cascading
    // errors where self-inserted high-number placeholders expand the detection range.
    // Already-handled (deleted) numbers are filtered out via anti-join.
    const getMissingNumbers = async (): Promise<any[]> => {
      const sql = `
        WITH
        repo_info AS (
            SELECT DISTINCT id AS repo_id, repo_name
            FROM export_repo
            WHERE platform = 'GitHub'
                AND (id IN (SELECT entity_id FROM flatten_labels WHERE platform = 'GitHub' AND entity_type = 'Repo')
                     OR org_id IN (SELECT entity_id FROM flatten_labels WHERE platform = 'GitHub' AND entity_type = 'Org'))
        ),
        -- Build the valid number range ONLY from real events (opened/created),
        -- not from self-inserted 'deleted' placeholders which may contain polluted high numbers.
        repo_sorted AS (
            SELECT
                e.repo_id AS repo_id,
                r.repo_name AS repo_name,
                arraySort(groupUniqArray(e.issue_number)) AS sorted_nums
            FROM events e
            INNER JOIN repo_info r ON e.repo_id = r.repo_id
            WHERE e.platform = 'GitHub'
                AND e.repo_name = r.repo_name
                AND e.type IN ('IssuesEvent', 'PullRequestEvent', 'DiscussionEvent')
                AND e.action IN ('opened', 'created')
            GROUP BY e.repo_id, r.repo_name
        ),
        -- Numbers already handled (have a 'deleted' placeholder) should be excluded from results.
        already_handled AS (
            SELECT
                e.repo_id AS repo_id,
                e.issue_number AS issue_number
            FROM events e
            INNER JOIN repo_info r ON e.repo_id = r.repo_id
            WHERE e.platform = 'GitHub'
                AND e.repo_name = r.repo_name
                AND e.type IN ('IssuesEvent', 'PullRequestEvent', 'DiscussionEvent')
                AND e.action = 'deleted'
                AND e.from_api = 1
        )
        SELECT
            repo_id,
            repo_name,
            missing_number
        FROM (
            SELECT
                repo_id,
                repo_name,
                arrayJoin(
                    arrayFlatten(
                        arrayMap(
                            (a, b) -> if(b - a > 1 AND b - a <= ${MAX_GAP_SIZE},
                                arrayMap(j -> toUInt32(a + j + 1), range(toUInt64(b - a - 1))),
                                emptyArrayUInt32()
                            ),
                            arraySlice(arrayPushFront(sorted_nums, toUInt32(0)), 1, toInt64(length(sorted_nums))),
                            sorted_nums
                        )
                    )
                ) AS missing_number
            FROM repo_sorted
            WHERE length(sorted_nums) > 0
        )
        WHERE (repo_id, missing_number) NOT IN (SELECT repo_id, issue_number FROM already_handled)
        LIMIT ${BATCH_SIZE}`;
      return await query(sql);
    };

    // Fetch Discussion via GraphQL (Discussions share the number sequence with Issues/PRs
    // but are not accessible via the Issues REST API — they return 404).
    const fetchDiscussion = async (
      owner: string, repo: string, number: number, repoId: number, repoName: string,
    ): Promise<{ events: InsertRecord[] } | null> => {
      const result: any = await oct.graphql(`
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            owner {
              ... on Organization {
                __typename
                databaseId
                login
              }
            }
            discussion(number: $number) {
              databaseId
              number
              title
              body
              createdAt
              closedAt
              author {
                ... on User { databaseId login }
                ... on Bot { databaseId login }
              }
              category { name }
            }
          }
        }
      `, { owner, repo, number });

      const discussion = result.repository?.discussion;
      if (!discussion) return null;

      const orgId = result.repository.owner?.__typename === 'Organization' ? result.repository.owner.databaseId : 0;
      const orgLogin = result.repository.owner?.__typename === 'Organization' ? result.repository.owner.login : '';
      const authorId = discussion.author?.databaseId ?? 0;
      const authorLogin = discussion.author?.login ?? '';

      const events: InsertRecord[] = [];
      events.push({
        platform: 'GitHub',
        type: 'DiscussionEvent',
        action: 'created',
        actor_id: authorId,
        actor_login: authorLogin,
        repo_id: repoId,
        repo_name: repoName,
        org_id: orgId,
        org_login: orgLogin,
        issue_id: discussion.databaseId ?? 0,
        issue_number: discussion.number,
        issue_title: discussion.title ?? '',
        body: discussion.body ?? '',
        issue_author_id: authorId,
        issue_author_login: authorLogin,
        issue_created_at: discussion.createdAt ? formatDate(discussion.createdAt) : undefined,
        issue_closed_at: discussion.closedAt ? formatDate(discussion.closedAt) : undefined,
        created_at: discussion.createdAt ? formatDate(discussion.createdAt) : formatDate(new Date().toISOString()),
        from_api: 1,
      });

      if (discussion.closedAt) {
        events.push({
          platform: 'GitHub',
          type: 'DiscussionEvent',
          action: 'closed',
          actor_id: authorId,
          actor_login: authorLogin,
          repo_id: repoId,
          repo_name: repoName,
          org_id: orgId,
          org_login: orgLogin,
          issue_id: discussion.databaseId ?? 0,
          issue_number: discussion.number,
          issue_title: discussion.title ?? '',
          body: '',
          issue_author_id: authorId,
          issue_author_login: authorLogin,
          issue_created_at: discussion.createdAt ? formatDate(discussion.createdAt) : undefined,
          issue_closed_at: formatDate(discussion.closedAt),
          created_at: formatDate(discussion.closedAt),
          from_api: 1,
        });
      }

      return { events };
    };

    // Fetch issue or PR data via GitHub REST API.
    // GitHub Issues API works for both: if the number is a PR, response includes `pull_request` field.
    const fetchIssueOrPull = async (
      repoId: number, repoName: string, issueNumber: number,
    ): Promise<{ events: InsertRecord[] } | typeof API_RATE_LIMIT_EXCEEDED | null> => {
      const [owner, repo] = repoName.split('/');
      try {
        // Step 1: Use Issues API (works for both Issues and PRs)
        const { data: issue } = await oct.issues.get({ owner, repo, issue_number: issueNumber });
        if (!issue.user) return null;

        const isPR = !!(issue as any).pull_request;
        const labels = issue.labels ?? [];

        if (isPR) {
          // Step 2: For PRs, fetch additional details via Pulls API
          const { data: pr } = await oct.pulls.get({ owner, repo, pull_number: issueNumber });
          if (!pr.user) return null;

          const ownerInfo: any = pr.base?.repo?.owner;
          const orgId = ownerInfo?.type === 'Organization' ? ownerInfo.id : 0;
          const orgLogin = ownerInfo?.type === 'Organization' ? ownerInfo.login : '';

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
            'issue_labels.name': labels.map((l: any) => typeof l === 'string' ? l : l.name ?? ''),
            'issue_labels.color': labels.map((l: any) => typeof l === 'string' ? '' : l.color ?? ''),
            'issue_labels.default': labels.map((l: any) => typeof l === 'string' ? 0 : (l.default ? 1 : 0)),
            'issue_labels.description': labels.map((l: any) => typeof l === 'string' ? '' : l.description ?? ''),
            pull_additions: pr.additions ?? 0,
            pull_deletions: pr.deletions ?? 0,
            pull_base_ref: pr.base?.ref ?? '',
            pull_head_ref: pr.head?.ref ?? '',
            pull_head_repo_id: pr.head?.repo?.id ?? 0,
            from_api: 1,
          };

          const events: InsertRecord[] = [];
          // opened event
          events.push({
            ...basePullItem,
            type: 'PullRequestEvent',
            action: 'opened',
            actor_id: pr.user.id,
            actor_login: pr.user.login,
            created_at: formatDate(pr.created_at),
          });
          // closed event (only if actually closed)
          if (pr.closed_at) {
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
          }
          return { events };
        } else {
          // Pure Issue
          const orgId = issue.repository?.owner?.type === 'Organization' ? issue.repository.owner.id : 0;
          const orgLogin = issue.repository?.owner?.type === 'Organization' ? issue.repository.owner.login : '';

          const baseIssueItem: InsertRecord = {
            platform: 'GitHub',
            type: '',
            action: '',
            actor_id: 0,
            actor_login: '',
            repo_id: repoId,
            repo_name: repoName,
            org_id: orgId,
            org_login: orgLogin,
            issue_id: issue.id,
            issue_number: issue.number,
            issue_title: issue.title ?? '',
            body: issue.body ?? '',
            issue_author_id: issue.user.id,
            issue_author_login: issue.user.login,
            issue_created_at: formatDate(issue.created_at),
            issue_closed_at: issue.closed_at ? formatDate(issue.closed_at) : undefined,
            'issue_labels.name': labels.map((l: any) => typeof l === 'string' ? l : l.name ?? ''),
            'issue_labels.color': labels.map((l: any) => typeof l === 'string' ? '' : l.color ?? ''),
            'issue_labels.default': labels.map((l: any) => typeof l === 'string' ? 0 : (l.default ? 1 : 0)),
            'issue_labels.description': labels.map((l: any) => typeof l === 'string' ? '' : l.description ?? ''),
            from_api: 1,
          };

          const events: InsertRecord[] = [];
          // opened event
          events.push({
            ...baseIssueItem,
            type: 'IssuesEvent',
            action: 'opened',
            actor_id: issue.user.id,
            actor_login: issue.user.login,
            created_at: formatDate(issue.created_at),
          });
          // closed event (only if actually closed)
          if (issue.closed_at) {
            events.push({
              ...baseIssueItem,
              type: 'IssuesEvent',
              action: 'closed',
              actor_id: issue.user.id,
              actor_login: issue.user.login,
              created_at: formatDate(issue.closed_at),
            });
          }
          return { events };
        }
      } catch (e: any) {
        const msg: string = e?.message ?? '';
        if (msg.includes('API rate limit exceeded')) {
          return API_RATE_LIMIT_EXCEEDED;
        }
        const repoBlocked = e?.status === 451 || msg.includes('Repository access blocked');
        if (e?.status === 404 || e?.status === 410 || repoBlocked) {
          // Issues API returned 404: could be a Discussion, truly deleted, or repo blocked.
          // Try fetching as a Discussion via GraphQL first.
          if (e?.status === 404) {
            try {
              const discussion = await fetchDiscussion(owner, repo, issueNumber, repoId, repoName);
              if (discussion) return discussion;
            } catch (graphqlErr: any) {
              // GraphQL failed (e.g., rate limit, no access), fall through to deleted placeholder
              logger.warn(`GraphQL discussion fetch failed for ${repoName}#${issueNumber}: ${graphqlErr?.message ?? graphqlErr}`);
            }
          }
          // Not a Discussion or repo blocked/gone → mark as deleted
          const reason = e?.status === 410 ? 'gone (410)' : repoBlocked ? 'repo blocked' : 'not found (404)';
          logger.warn(`Issue unavailable (${reason}), mark deleted: ${repoName}#${issueNumber}`);
          const nowStr = formatDate(new Date().toISOString());
          const placeholder: InsertRecord = {
            platform: 'GitHub',
            type: 'IssuesEvent',
            action: 'deleted',
            actor_id: 0,
            actor_login: '',
            repo_id: repoId,
            repo_name: repoName,
            org_id: 0,
            org_login: '',
            issue_id: 0,
            issue_number: issueNumber,
            created_at: nowStr,
            from_api: 1,
          };
          return { events: [placeholder] };
        }
        logger.warn(`Error fetching ${repoName}#${issueNumber}: ${msg}`);
        return null;
      }
    };

    // --- Main execution ---
    const missingItems = await getMissingNumbers();
    if (missingItems.length === 0) {
      logger.info('No missing issues to backfill.');
      return;
    }
    logger.info(`Got ${missingItems.length} missing issue numbers to backfill.`);

    let rateLimitHit = false;
    let okCount = 0;
    let skipCount = 0;
    const allEvents: InsertRecord[] = [];

    await runTasks(missingItems.map(item => async () => {
      if (rateLimitHit) return;
      const [repoId, repoName, issueNumber] = item;
      const result = await fetchIssueOrPull(+repoId, repoName, +issueNumber);
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
    }), CONCURRENT_REQUESTS);

    if (allEvents.length > 0) {
      await insertRecords(allEvents, 'events');
    }
    logger.info(`Inserted ${allEvents.length} events for ${okCount} issues/PRs, skipped ${skipCount}.`);
    logger.info('BackfillMissingIssuesTask done.');
  }
};

module.exports = task;
