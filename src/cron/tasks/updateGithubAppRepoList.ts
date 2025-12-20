import { Octokit } from '@octokit/rest';
import { App } from '@octokit/app';
import { formatDate, getLogger, runTasks } from '../../utils';
import { Task } from '../index';
import getConfig from '../../config';
import { getNewClient, insertRecords, query } from '../../db/clickhouse';

/**
 * This task is used to update github app repo list
 */

const task: Task = {
  cron: '0 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateGithubAppRepoListTask');
    const config = await getConfig();

    const createGithubAppRepoListTable = async () => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS github_app_repo_list (
          id UInt64,
          installation_id UInt64,
          repo_name String,
          created_at DateTime,
          description String,
          license LowCardinality(String),
          default_branch LowCardinality(String),
          topics Array(String),
          stargazers_count UInt32,
          repo_updated_at DateTime,
          issue_updated_at DateTime,
          issue_end_cursor String,
          pull_updated_at DateTime,
          pull_end_cursor String,
          inserted_at UInt64
        )
        ENGINE = ReplacingMergeTree(inserted_at)
        ORDER BY id
        SETTINGS index_granularity = 8192
      `;
      await query(createTableQuery);
    };

    const githubApp = new App({
      id: config.task.configs.updateGithubAppRepoList.appId,
      privateKey: config.task.configs.updateGithubAppRepoList.appPrivateKey,
    });

    const getInstalledRepos = async (): Promise<any[]> => {
      // get repo list from GitHub App
      const octokit = new Octokit({
        auth: `Bearer ${githubApp.getSignedJsonWebToken()}`,
      });
      const repos: any[] = [];
      const installations: any[] = await octokit.paginate('GET /app/installations');
      logger.info(`Got ${installations.length} installations`);
      await runTasks(installations.map(i => async () => {
        const oct = new Octokit({
          auth: `Bearer ${await githubApp.getInstallationAccessToken({ installationId: i.id })}`,
        });
        const installationRepos = await oct.paginate('GET /installation/repositories');
        logger.info(`Got ${installationRepos.length} repos for installation ${i?.account?.login}`);
        repos.push(...installationRepos.filter(r => !r.private).map(r => ({ ...r, installation_id: i.id })));
      }), 5);
      logger.info(`Got ${repos.length} repos`);
      return repos;
    };

    const saveRepoList = async (repos: any[]) => {
      const currentData = await query<any>(`SELECT id, issue_updated_at, issue_end_cursor, pull_updated_at, pull_end_cursor FROM github_app_repo_list`);
      const currentDataMap = new Map(currentData.map(r => [+r[0], { issue_updated_at: r[1], issue_end_cursor: r[2], pull_updated_at: r[3], pull_end_cursor: r[4] }]));
      // Insert new data with updated inserted_at; ReplacingMergeTree will deduplicate automatically
      await insertRecords(repos.map(r => ({
        id: r.id,
        installation_id: r.installation_id,
        repo_name: r.full_name,
        created_at: formatDate(r.created_at),
        description: r.description,
        license: r.license?.spdx_id ?? '',
        default_branch: r.default_branch ?? '',
        topics: r.topics ?? [],
        stargazers_count: r.stargazers_count,
        repo_updated_at: formatDate(r.updated_at),
        issue_updated_at: currentDataMap.get(r.id)?.issue_updated_at,
        issue_end_cursor: currentDataMap.get(r.id)?.issue_end_cursor ?? '',
        pull_updated_at: currentDataMap.get(r.id)?.pull_updated_at,
        pull_end_cursor: currentDataMap.get(r.id)?.pull_end_cursor ?? '',
        inserted_at: Date.now(),
      })), 'github_app_repo_list');
    };

    await createGithubAppRepoListTable();
    const repos = await getInstalledRepos();
    await saveRepoList(repos);
    const client = await getNewClient();
    await client.command({ query: `OPTIMIZE TABLE github_app_repo_list DEDUPLICATE;` });
    await client.close();
  },
};

module.exports = task;
