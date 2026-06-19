import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { getLogger, runTasks } from '../../utils';
import { Octokit } from '@octokit/rest';
import { request } from 'https';

/**
 * This task is used to fetch github pull diff info
 */

let round = 0;
const API_RATE_LIMIT_EXCEEDED = 'API RATE LIMIT EXCEEDED';
const task: Task = {
  cron: '20 * * * *',
  singleInstance: false,
  callback: async () => {

    const logger = getLogger('FetchPullDiffTask');

    const config = await getConfig();
    const githubToken = config.task.configs.fetchPullDiff.githubTokens[
      round++ % config.task.configs.fetchPullDiff.githubTokens.length
    ];

    const atomgitToken = config.task.configs.fetchPullDiff.atomgitTokens[
      round++ % config.task.configs.fetchPullDiff.atomgitTokens.length
    ];

    const ghClient = new Octokit({
      auth: `Bearer ${githubToken}`,
    });

    const supportedPlatforms = ['GitHub', 'AtomGit'];

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
    ORDER BY (id, platform)
    SETTINGS index_granularity = 8192`;
    await query(createTableQuery);

    // get pull requests ids
    const getPullRequests = async (totalCount: number): Promise<any[]> => {
      // try to get pull requests ids from label data first
      let q = `SELECT argMax(repo_name, created_at), argMax(platform, created_at) AS p, argMax(issue_number, created_at), argMax(issue_id, created_at)
        FROM events WHERE type='PullRequestEvent' AND platform IN (${supportedPlatforms.map(p => `'${p}'`).join(',')}) AND (issue_id, platform) IN (SELECT id, platform FROM pulls_with_label)
        AND (issue_id, platform) NOT IN (SELECT id, platform FROM pull_diff) GROUP BY issue_id LIMIT ${totalCount} by p`;
      let pullRequests = await query(q);
      if (pullRequests.length > 0) {
        logger.info(`Get ${pullRequests.length} pull requests to update from label data`);
        return pullRequests;
      }
      return [];
    };

    // fetch pr changed files info from AtomGit api
    const fetchAtomGitFiles = (repo: string, number: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        const [owner, repoName] = repo.split('/');
        const path = `/api/v5/repos/${owner}/${repoName}/pulls/${number}/files.json?access_token=${atomgitToken}`;
        const options = {
          hostname: 'api.atomgit.com',
          port: 443,
          path,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'opendigger-bot',
          },
        };
        const req = request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              if (res.statusCode !== 200) {
                reject(new Error(`AtomGit API error: ${res.statusCode} ${res.statusMessage} - ${data}`));
                return;
              }
              resolve(JSON.parse(data));
            } catch (e: any) {
              reject(new Error(`Error parsing AtomGit response: ${e.message} - ${data}`));
            }
          });
        });
        req.on('error', (e) => reject(e));
        req.end();
      });
    };

    // build a unified diff like text from AtomGit files response
    const buildAtomGitDiffText = (data: any): string => {
      if (!data || !Array.isArray(data.diffs)) return '';
      const parts: string[] = [];
      for (const file of data.diffs) {
        const stat = file.statistic ?? {};
        const oldPath = stat.old_path || stat.path || '';
        const newPath = stat.new_path || stat.path || '';
        parts.push(`diff --git a/${oldPath} b/${newPath}`);
        parts.push(`--- a/${oldPath}`);
        parts.push(`+++ b/${newPath}`);
        const lines = file.content?.text;
        if (Array.isArray(lines)) {
          for (const line of lines) {
            const content = line.line_content ?? '';
            const type = line.type;
            // AtomGit api behaviour:
            // - type 'old'  => deleted line, line_content has NO prefix => add '-'
            // - type 'new'  => added line, line_content has NO prefix => add '+'
            // - type 'match' (hunk header) and context lines (no type) already
            //   carry their own leading char (@@ / space), output as-is
            if (type === 'old') {
              parts.push('-' + content);
            } else if (type === 'new') {
              parts.push('+' + content);
            } else {
              parts.push(content);
            }
          }
        }
      }
      return parts.join('\n');
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
        } else if (platform === 'AtomGit') {
          const data = await fetchAtomGitFiles(repo, number);
          const diffText = buildAtomGitDiffText(data);
          return diffText.slice(0, config.task.configs.fetchPullDiff.maxDiffSize);
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
        platform,
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
