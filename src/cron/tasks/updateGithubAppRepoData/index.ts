import { formatDate, getLogger, runTasks } from '../../../utils';
import { Task } from '../../index';
import { insertRecords, query } from '../../../db/clickhouse';
import { createGithubAppRepoDataTable } from './createTable';
import { getPulls } from './getPulls';
import { getIssues } from './getIssues';

/**
 * This task is used to update github app repo data
 */

const REPO_UPDATE_CONCURRENCY = 20;
const task: Task = {
  cron: '30 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateGithubAppRepoDataTask');

    const updateRepoDataTask = async () => {
      const repos = await query<any>(`
SELECT id, argMax(installation_id, inserted_at), argMax(repo_name, inserted_at), argMax(data_updated_at, inserted_at)
FROM github_app_repo_list WHERE repo_updated_at > data_updated_at GROUP BY id`);
      logger.info(`Got ${repos.length} repos to update`);

      const updateRepoData = async (repo: { id: number, installation_id: number, repo_name: string, since: string }) => {
        const [owner, name] = repo.repo_name.split('/');
        const issueEvents = await getIssues(+repo.id, repo.installation_id, owner, name, repo.since);
        const pullEvents = await getPulls(+repo.id, repo.installation_id, owner, name, repo.since);
        logger.info(`Got ${issueEvents.length} issue events and ${pullEvents.length} pull events for ${repo.repo_name}`);
        const events = [...issueEvents, ...pullEvents];
        if (events.length > 0) {
          await insertRecords(events, 'github_app_repo_data');
        }
        await query(`ALTER TABLE github_app_repo_list UPDATE data_updated_at = '${formatDate(new Date().toISOString())}' WHERE id = ${repo.id};`);
      };
      await runTasks(repos.map(r => async () => {
        try {
          return await updateRepoData({ id: r[0], installation_id: r[1], repo_name: r[2], since: r[3] });
        } catch (e: any) {
          logger.error(`Error on updating repo data for ${r[2]}: ${e.message}\n${e.stack}`);
          return null;
        }
      }), REPO_UPDATE_CONCURRENCY);
    };

    await createGithubAppRepoDataTable();
    await updateRepoDataTask();
  }
};

module.exports = task;
