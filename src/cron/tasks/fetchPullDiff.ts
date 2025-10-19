import { Task } from '..';
import getConfig from '../../config';
import { query } from '../../db/clickhouse';
import { Readable } from 'stream';
import { createClient } from '@clickhouse/client';
import { getLogger } from '../../utils';
import { Octokit } from '@octokit/rest';

/**
 * This task is used to fetch github pull diff info
 */

let round = 0;
const task: Task = {
  cron: '*/10 * * * *',
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
      // try to get pull requests ids first
      const q = `SELECT argMax(repo_name, created_at), argMax(platform, created_at), argMax(issue_number, created_at), argMax(issue_id, created_at)
        FROM events WHERE type='PullRequestEvent' AND platform='GitHub' AND repo_id IN (SELECT id FROM export_repo)
        AND (issue_id, platform) NOT IN (SELECT id, platform FROM pull_diff) GROUP BY issue_id LIMIT ${totalCount}`;
      const pullRequests = await query(q);
      return pullRequests;
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
      } catch (error) {
        return null;
      }
    };

    const pullRequests = await getPullRequests(config.task.configs.fetchPullDiff.updateBatchSize);
    if (pullRequests.length === 0) {
      logger.info(`No pull requests to update`);
      return;
    }
    logger.info(`Get ${pullRequests.length} pull requests to update`);

    let processedCount = 0;
    const stream = new Readable({
      objectMode: true,
      read: () => { },
    });
    const client = createClient(config.db.clickhouse);

    // Split pullRequests into batches
    const batchSize = config.task.configs.fetchPullDiff.fetchBatchSize;
    const batches: any[][] = [];
    for (let i = 0; i < pullRequests.length; i += batchSize) {
      batches.push(pullRequests.slice(i, i + batchSize));
    }

    logger.info(`Processing ${pullRequests.length} pull requests in ${batches.length} batches of ${batchSize}`);

    // Process each batch concurrently
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Execute all requests in current batch concurrently
      const batchPromises = batch.map(async ([repo, platform, number, id]) => {
        const diff: any = await getDiff(repo, platform, number);
        const item: any = {
          id: +id,
          updated_at: new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
        };

        if (!diff) {
          item.status = 'not_found';
          item.diff = '';
        } else {
          item.status = 'normal';
          item.diff = diff;
        }
        item.platform = platform;

        return item;
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Push results to stream
      for (const item of batchResults) {
        stream.push(item);
        processedCount++;
      }

      // Record progress every 100 requests
      if (processedCount % 100 === 0) {
        logger.info(`${processedCount} pull requests has been processed.`);
      }

      // Add small delay between batches to avoid too frequent requests
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    stream.push(null);
    await client.insert({
      table: 'pull_diff',
      values: stream,
      format: 'JSONEachRow',
    });
    await client.close();

    logger.info(`Task completed. Processed ${processedCount} pull requests in ${batches.length} batches.`);
  }
};

module.exports = task;
