import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { getLogger, runTasks } from '../../utils';
import { Octokit } from '@octokit/rest';

/**
 * This task is used to fetch github pull diff info
 */

let round = 0;
const API_RATE_LIMIT_EXCEEDED = 'API RATE LIMIT EXCEEDED';
const task: Task = {
  cron: '*/12 * * * *',
  singleInstance: false,
  callback: async () => {

    const logger = getLogger('FetchPullDiffTask');

    const config = await getConfig();
    const token = config.task.configs.fetchPullDiff.tokens[
      round++ % config.task.configs.fetchPullDiff.tokens.length
    ];

    const ghClient = new Octokit({
      auth: `Bearer ${token}`,
    });

    // create pull detail table
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS pull_diff
    (
      \`id\` UInt64,
      \`platform\` LowCardinality(String),
      \`status\` Enum('normal' = 1, 'not_found' = 2),
      \`updated_at\` DateTime,
      \`diff\` String
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (id)
    SETTINGS index_granularity = 8192`;
    await query(createTableQuery);

    // get pull requests ids
    const getPullRequests = async (totalCount: number): Promise<any[]> => {
      // try to get pull requests ids from label data first
      let q = `SELECT argMax(repo_name, created_at), argMax(platform, created_at), argMax(issue_number, created_at), argMax(issue_id, created_at)
        FROM events WHERE type='PullRequestEvent' AND platform='GitHub' AND (issue_id, platform) IN (SELECT id, platform FROM pulls_with_label)
        AND (issue_id, platform) NOT IN (SELECT id, platform FROM pull_diff) GROUP BY issue_id LIMIT ${totalCount}`;
      let pullRequests = await query(q);
      if (pullRequests.length > 0) {
        logger.info(`Get ${pullRequests.length} pull requests to update from label data`);
        return pullRequests;
      }
      return [];
      // ** Do not get export data right now, too many prs to analyze **
      // q = `SELECT argMax(repo_name, created_at), argMax(platform, created_at), argMax(issue_number, created_at), argMax(issue_id, created_at)
      //   FROM events WHERE type='PullRequestEvent' AND platform='GitHub' AND repo_id IN (SELECT id FROM export_repo)
      //   AND toYear(created_at) >= 2025
      //   AND (issue_id, platform) NOT IN (SELECT id, platform FROM pull_diff) GROUP BY issue_id LIMIT ${totalCount}`;
      // pullRequests = await query(q);
      // logger.info(`Get ${pullRequests.length} pull requests to update from export repo data`);
      // return pullRequests;
    };

    const getDiff = async (repo: string, platform: string, number: number): Promise<any> => {
      try {
        if (platform === 'GitHub') {
          const diff: any = await ghClient.rest.pulls.get({
            owner: repo.split('/')[0],
            repo: repo.split('/')[1],
            pull_number: number,
            mediaType: {
              format: 'diff',
            },
          });
          return diff.data.slice(0, config.task.configs.fetchPullDiff.maxDiffSize);
        } else {
          logger.error('Platform not supported.', platform);
        }
      } catch (error: any) {
        const msg: string = error.message;
        if (msg.includes('API rate limit exceeded')) {
          return API_RATE_LIMIT_EXCEEDED;
        }
        return null;
      }
    };

    const pullRequests = await getPullRequests(config.task.configs.fetchPullDiff.updateBatchSize);
    if (pullRequests.length === 0) {
      logger.info(`No pull requests to update`);
      return;
    }

    const diffs = await runTasks(pullRequests.map(pull => async () => {
      const [repo, platform, number, id] = pull;
      const diff = await getDiff(repo, platform, number);
      const item: any = {
        id: +id,
        updated_at: new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
      };
      if (!diff) {
        item.status = 'not_found';
        item.diff = '';
      } else if (diff === API_RATE_LIMIT_EXCEEDED) {
        return null;
      } else {
        item.status = 'normal';
        item.diff = diff;
      }
      return item;
    }), config.task.configs.fetchPullDiff.concurrentRequestNumber);

    await insertRecords(diffs, 'pull_diff');
  }
};

module.exports = task;
