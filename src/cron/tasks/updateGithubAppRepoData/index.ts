import { formatDate, getLogger, runTasks } from '../../../utils';
import { Task } from '../../index';
import { getNewClient, insertRecords, query } from '../../../db/clickhouse';
import { createGithubAppRepoDataTable, InsertRecord } from './createTable';
import { getPulls } from './getPulls';
import { getIssues } from './getIssues';

/**
 * This task is used to update github app repo data
 */

const REPO_UPDATE_CONCURRENCY = 20;
// update repos by installation id in batch, so that we can avoid rate limit error
// since github also has rate limit for installation access
// reference: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-github-app-installations
const INSTALLATION_UPDATE_BATCH_SIZE = 100;
const task: Task = {
  cron: '30 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateGithubAppRepoDataTask');

    const updateRepoDataTask = async () => {
      // repo updated_at means repo code or description changed, so update data when update or today is the first day of the month
      const repos = await query<any>(`
SELECT
  id, installation_id,
  repo_name,
  issue_updated_at,
  pull_updated_at,
  issue_end_cursor,
  pull_end_cursor,
  issue_updated_at < repo_updated_at AS should_update_issue,
  pull_updated_at < repo_updated_at AS should_update_pull,
  (toDayOfMonth(now()) = 1 AND toMonth(now()) != toMonth(issue_updated_at)) OR (toDayOfMonth(now()) = 1 AND toMonth(now()) != toMonth(pull_updated_at)) AS force_update
FROM github_app_repo_list WHERE should_update_issue OR should_update_pull OR force_update
LIMIT ${INSTALLATION_UPDATE_BATCH_SIZE} BY installation_id;`);
      logger.info(`Got ${repos.length} repos to update`);

      const updateRepoData = async (r: any[]) => {
        const repo = {
          id: +r[0],
          installationId: +r[1],
          repoName: r[2],
          issueUpdatedAt: r[3],
          pullUpdatedAt: r[4],
          issueEndCursor: r[5],
          pullEndCursor: r[6],
          shouldUpdateIssue: +r[7] === 1,
          shouldUpdatePull: +r[8] === 1,
          forceUpdate: +r[9] === 1,
        };
        const [owner, name] = repo.repoName.split('/');
        let issueEvents: InsertRecord[] = [], pullEvents: InsertRecord[] = [];
        let issueFinished = true, pullFinished = true, issueEndCursor = repo.issueEndCursor, pullEndCursor = repo.pullEndCursor, issueCost = 0, pullCost = 0;
        if (repo.shouldUpdateIssue || repo.forceUpdate) {
          const issueResult = await getIssues(+repo.id, repo.installationId, owner, name, repo.issueEndCursor);
          issueEvents = issueResult.events;
          issueFinished = issueResult.finished;
          if (issueResult.endCursor) {
            issueEndCursor = issueResult.endCursor;
          }
          issueCost = issueResult.cost;
        }
        if (repo.shouldUpdatePull || repo.forceUpdate) {
          const pullResult = await getPulls(+repo.id, repo.installationId, owner, name, repo.pullEndCursor);
          pullEvents = pullResult.events;
          pullFinished = pullResult.finished;
          if (pullResult.endCursor) {
            pullEndCursor = pullResult.endCursor;
          }
          pullCost = pullResult.cost;
        }
        logger.info(`Got ${issueEvents.length} issue(cost: ${issueCost}) events and ${pullEvents.length} pull(cost: ${pullCost}) events for ${repo.repoName}`);
        const events = [...issueEvents, ...pullEvents];
        if (events.length > 0) {
          await insertRecords(events, 'github_app_repo_data');
        }
        const issueUpdateTime = issueFinished ? new Date() : new Date(repo.issueUpdatedAt);
        const pullUpdateTime = pullFinished ? new Date() : new Date(repo.pullUpdatedAt);
        const q = `ALTER TABLE github_app_repo_list UPDATE
        issue_updated_at = '${formatDate(issueUpdateTime.toISOString())}',
        pull_updated_at = '${formatDate(pullUpdateTime.toISOString())}',
        issue_end_cursor = '${issueEndCursor}',
        pull_end_cursor = '${pullEndCursor}'
        WHERE id = ${repo.id};`
        await query(q);
      };
      await runTasks(repos.map(r => async () => {
        try {
          return await updateRepoData(r);
        } catch (e: any) {
          logger.error(`Error on updating repo data for ${r[2]}: ${e.message}\n${e.stack}`);
          return null;
        }
      }), REPO_UPDATE_CONCURRENCY);

      // optimize table after data update
      const client = await getNewClient();
      await client.command({ query: `OPTIMIZE TABLE github_app_repo_data DEDUPLICATE;` });
      await client.close();
    };

    await createGithubAppRepoDataTable();
    await updateRepoDataTask();
  }
};

module.exports = task;
