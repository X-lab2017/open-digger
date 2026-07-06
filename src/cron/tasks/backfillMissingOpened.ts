import { Task } from '..';
import { insertRecords, query } from '../../db/clickhouse';
import { getLogger } from '../../utils';

/**
 * This task backfills missing 'opened' events for IssuesEvent and PullRequestEvent
 * in the GitHub events table.
 *
 * Some issues/PRs have a 'closed' event recorded but are missing the corresponding
 * 'opened' event (due to incomplete log ingestion). This task:
 * 1. Queries for all (platform, repo_id, issue_id) combinations that have a 'closed'
 *    event but no 'opened' event for IssuesEvent/PullRequestEvent.
 * 2. Extracts issue metadata (author, created_at, labels, etc.) from the closed event.
 * 3. Constructs the missing 'opened' event using issue_created_at as created_at and
 *    issue_author as actor.
 */

const BATCH_SIZE = 200000;
const SLEEP_BETWEEN_ROUNDS_MS = 30_000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const task: Task = {
  cron: '30 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('BackfillMissingOpenedTask');

    // Use GROUP BY + HAVING to find issue_ids with closed but no opened events.
    // This approach is more reliable than ANTI JOIN on large ReplacingMergeTree tables
    // and only requires a single table scan.
    // Restricted to labeled repos (export_repo) to avoid scanning all GitHub events
    // which would exceed memory limits.
    const sql = `
      SELECT
          anyIf(type, action = 'closed') AS event_type,
          argMaxIf(repo_id, created_at, action = 'closed') AS r_repo_id,
          argMaxIf(repo_name, created_at, action = 'closed') AS r_repo_name,
          argMaxIf(org_id, created_at, action = 'closed') AS r_org_id,
          argMaxIf(org_login, created_at, action = 'closed') AS r_org_login,
          issue_id,
          argMaxIf(issue_number, created_at, action = 'closed') AS r_issue_number,
          argMaxIf(issue_title, created_at, action = 'closed') AS r_issue_title,
          argMaxIf(body, created_at, action = 'closed') AS r_body,
          argMaxIf(issue_author_id, created_at, action = 'closed') AS r_issue_author_id,
          argMaxIf(issue_author_login, created_at, action = 'closed') AS r_issue_author_login,
          argMaxIf(issue_author_type, created_at, action = 'closed') AS r_issue_author_type,
          argMaxIf(issue_author_association, created_at, action = 'closed') AS r_issue_author_association,
          argMaxIf(issue_assignee_id, created_at, action = 'closed') AS r_issue_assignee_id,
          argMaxIf(issue_assignee_login, created_at, action = 'closed') AS r_issue_assignee_login,
          argMaxIf(\`issue_assignees.login\`, created_at, action = 'closed') AS r_issue_assignees_login,
          argMaxIf(\`issue_assignees.id\`, created_at, action = 'closed') AS r_issue_assignees_id,
          argMaxIf(issue_created_at, created_at, action = 'closed') AS r_issue_created_at,
          argMaxIf(issue_updated_at, created_at, action = 'closed') AS r_issue_updated_at,
          argMaxIf(issue_comments, created_at, action = 'closed') AS r_issue_comments,
          argMaxIf(issue_closed_at, created_at, action = 'closed') AS r_issue_closed_at,
          argMaxIf(\`issue_labels.name\`, created_at, action = 'closed') AS r_issue_labels_name,
          argMaxIf(\`issue_labels.color\`, created_at, action = 'closed') AS r_issue_labels_color,
          argMaxIf(\`issue_labels.default\`, created_at, action = 'closed') AS r_issue_labels_default,
          argMaxIf(\`issue_labels.description\`, created_at, action = 'closed') AS r_issue_labels_desc,
          argMaxIf(pull_additions, created_at, action = 'closed') AS r_pull_additions,
          argMaxIf(pull_deletions, created_at, action = 'closed') AS r_pull_deletions,
          argMaxIf(pull_base_ref, created_at, action = 'closed') AS r_pull_base_ref,
          argMaxIf(pull_head_ref, created_at, action = 'closed') AS r_pull_head_ref,
          argMaxIf(pull_head_repo_id, created_at, action = 'closed') AS r_pull_head_repo_id,
          argMaxIf(pull_head_repo_name, created_at, action = 'closed') AS r_pull_head_repo_name
      FROM opensource.events
      WHERE platform = 'GitHub'
          AND type IN ('IssuesEvent', 'PullRequestEvent')
          AND issue_id > 0
          AND (
            repo_id IN (SELECT entity_id FROM flatten_labels WHERE platform = 'GitHub' AND entity_type = 'Repo')
            OR org_id IN (SELECT entity_id FROM flatten_labels WHERE platform = 'GitHub' AND entity_type = 'Org')
          )
      GROUP BY issue_id
      HAVING countIf(action = 'opened') = 0
         AND countIf(action = 'closed') > 0
         AND r_issue_created_at IS NOT NULL
         AND r_issue_author_id > 0
      LIMIT ${BATCH_SIZE}`;

    let round = 0;
    while (true) {
      round++;
      logger.info(`[Round ${round}] Querying closed events without corresponding opened events...`);
      let rows: any[];
      try {
        rows = await query(sql);
      } catch (e: any) {
        logger.error(`[Round ${round}] SQL query failed: ${e?.message ?? e}`);
        return;
      }

      if (rows.length === 0) {
        logger.info(`[Round ${round}] No missing opened events to backfill. All done.`);
        break;
      }

      // Validate first row to detect ClickHouse error messages returned as data
      // (e.g. MEMORY_LIMIT_EXCEEDED errors can appear as a single malformed row)
      const firstRow: any[] = rows[0];
      if (!firstRow || !Array.isArray(firstRow) || !['IssuesEvent', 'PullRequestEvent'].includes(firstRow[0])) {
        logger.error(`[Round ${round}] Query returned invalid data (possible ClickHouse error in stream): ${JSON.stringify(firstRow).slice(0, 300)}`);
        return;
      }

      logger.info(`[Round ${round}] Found ${rows.length} closed events missing opened counterpart.`);

      // Build opened event records from closed event data.
      const openedRecords = rows.map((row: any[]) => {
        const [
          eventType, repoId, repoName, orgId, orgLogin,
          issueId, issueNumber, issueTitle, issueBody,
          issueAuthorId, issueAuthorLogin, issueAuthorType, issueAuthorAssociation,
          issueAssigneeId, issueAssigneeLogin, issueAssigneesLogin, issueAssigneesId,
          issueCreatedAt, issueUpdatedAt, issueComments, issueClosedAt,
          issueLabelsName, issueLabelsColor, issueLabelsDefault, issueLabelsDesc,
          pullAdditions, pullDeletions, pullBaseRef, pullHeadRef,
          pullHeadRepoId, pullHeadRepoName,
        ] = row;

        const record: any = {
          platform: 'GitHub',
          type: eventType,
          action: 'opened',
          actor_id: issueAuthorId,
          actor_login: issueAuthorLogin,
          repo_id: repoId,
          repo_name: repoName,
          org_id: orgId,
          org_login: orgLogin,
          created_at: issueCreatedAt,  // Use issue_created_at as opened event time
          issue_id: issueId,
          issue_number: issueNumber,
          issue_title: issueTitle ?? '',
          body: issueBody ?? '',
          issue_author_id: issueAuthorId,
          issue_author_login: issueAuthorLogin,
          issue_author_type: issueAuthorType,
          issue_author_association: issueAuthorAssociation,
          issue_assignee_id: issueAssigneeId,
          issue_assignee_login: issueAssigneeLogin,
          'issue_assignees.login': issueAssigneesLogin ?? [],
          'issue_assignees.id': issueAssigneesId ?? [],
          issue_created_at: issueCreatedAt,
          issue_updated_at: issueUpdatedAt,
          issue_comments: issueComments,
          issue_closed_at: issueClosedAt,
          'issue_labels.name': issueLabelsName ?? [],
          'issue_labels.color': issueLabelsColor ?? [],
          'issue_labels.default': issueLabelsDefault ?? [],
          'issue_labels.description': issueLabelsDesc ?? [],
          from_api: 1,
        };

        // Add PR-specific fields for PullRequestEvent
        if (eventType === 'PullRequestEvent') {
          record.pull_additions = pullAdditions ?? 0;
          record.pull_deletions = pullDeletions ?? 0;
          record.pull_base_ref = pullBaseRef ?? '';
          record.pull_head_ref = pullHeadRef ?? '';
          record.pull_head_repo_id = pullHeadRepoId ?? 0;
          record.pull_head_repo_name = pullHeadRepoName ?? '';
        }

        return record;
      });

      logger.info(`[Round ${round}] Inserting ${openedRecords.length} backfilled opened events...`);
      await insertRecords(openedRecords, 'events');
      logger.info(`[Round ${round}] Successfully inserted ${openedRecords.length} opened events.`);

      // If this batch is smaller than BATCH_SIZE, all missing events have been processed
      if (rows.length < BATCH_SIZE) {
        logger.info(`[Round ${round}] Batch size (${rows.length}) < limit (${BATCH_SIZE}), all done.`);
        break;
      }

      // Sleep before next round to avoid overloading the database
      logger.info(`[Round ${round}] Sleeping ${SLEEP_BETWEEN_ROUNDS_MS / 1000}s before next round...`);
      await sleep(SLEEP_BETWEEN_ROUNDS_MS);
    }

    logger.info('BackfillMissingOpenedTask done.');
  }
};

module.exports = task;
