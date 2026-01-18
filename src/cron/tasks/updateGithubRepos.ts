import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { GitHubClient } from 'github-graphql-v4-client';
import { getLogger } from '../../utils';
import { Octokit } from '@octokit/rest';

/**
 * This task is used to update github repos basic info
 */
const task: Task = {
  cron: '10 * * * *',
  singleInstance: true,
  callback: async () => {

    const logger = getLogger('UpdateGitHubRepoTask');

    const config = await getConfig();
    const updateBatchSize = config.task.configs.updateGithubRepos.updateBatchSize;
    const tokens: string[] = config.task.configs.updateGithubRepos.tokens;
    const oct = new Octokit({ auth: tokens[0] });
    const graphqlClient = new GitHubClient({
      tokens: tokens.slice(1),
      maxConcurrentReqNumber: 40,
      logger: {
        info: () => { },
        error: () => { },
        warn: () => { }
      }
    })
    await graphqlClient.init();

    const queryRepoInfo = async (owner: string, name: string) => {
      try {
        const [result, readme]: any[] = await Promise.all([
          graphqlClient.query(`query getRepo($owner: String!, $name: String!){ 
            repository(owner: $owner, name: $name) {
              createdAt
              description
              repositoryTopics(first: 50) {
                nodes {
                  topic {
                    name
                  }
                }
              }
              defaultBranchRef {
                name
              }
              homepageUrl
              isFork
              primaryLanguage {
                name
              }
              languages(first: 50, orderBy: {field:SIZE, direction:DESC}) {
                nodes {
                  name
                }
              }
              licenseInfo {
                name
                nickname
                spdxId
              }
            }
          }`, { owner, name }),
          oct.repos.getReadme({ owner, repo: name }),
        ]);
        if (!result) return null;
        const repo = result.repository;
        repo.repositoryTopics = repo.repositoryTopics.nodes;
        repo.languages = repo.languages.nodes;
        if (readme && readme.data && readme.data.content) {
          if (readme.data.encoding !== 'base64') {
          } else {
            repo.readmeText = Buffer.from(readme.data.content, 'base64').toString('utf-8');
          }
        } else {
          logger.warn(`Can not find README for ${owner}/${name}`);
        }
        return repo;
      } catch (e) {
        logger.error(`Error on fetch ${owner}/${name}, e=${e}`);
        return null;
      }
    };

    // create info table
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS gh_repo_info
    (
      \`id\` UInt64,
      \`status\` Enum('normal' = 1, 'not_found' = 2),
      \`updated_at\` DateTime,
      \`description\` String,
      \`default_branch\` LowCardinality(String),
      \`homepage_url\` String,
      \`isFork\` UInt8,
      \`primary_language\` String,
      \`license\` LowCardinality(String),
      \`languages\` Array(LowCardinality(String)),
      \`license_spdx_id\` LowCardinality(String),
      \`topics\` Array(String),
      \`readme_text\` String,
      \`created_at\` DateTime
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (id, updated_at)
    SETTINGS index_granularity = 8192`;
    await query(createTableQuery);

    // get repos
    const now = new Date();
    const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01 00:00:00`;
    const getRepossList = async (totalCount: number): Promise<any[]> => {
      let q = `SELECT id, repo_name FROM export_repo
      WHERE platform='GitHub' AND id NOT IN (SELECT id FROM gh_repo_info WHERE updated_at > subtractMonths(now(), 6) OR status = 'not_found')
      LIMIT ${totalCount}`;
      let reposList = await query(q);
      return reposList;
    };

    const reposList = await getRepossList(updateBatchSize);
    if (reposList.length === 0) return;
    logger.info(`Get ${reposList.length} repos to update`);

    const items: any[] = [];
    for (const [id, repoName] of reposList) {
      const [owner, name] = repoName.split('/');
      const repo: any = await queryRepoInfo(owner, name);
      const item: any = { id: parseInt(id), updated_at: date };
      if (!repo) {
        item.status = 'not_found';
      } else {
        item.status = 'normal';
        item.description = repo.description ?? '';
        item.topics = repo.repositoryTopics.map(i => i.topic.name);
        item.default_branch = repo.defaultBranchRef?.name ?? '';
        item.homepage_url = repo.homepageUrl ?? '';
        item.isFork = repo.isFork ? 1 : 0;
        item.primary_language = repo.primaryLanguage?.name ?? '';
        item.languages = repo.languages.map(i => i.name);
        item.license = repo.licenseInfo?.name ?? '';
        item.license_spdx_id = repo.licenseInfo?.spdxId ?? '';
        item.readme_text = repo.readmeText ?? '';
        item.created_at = repo.createdAt.replace('T', ' ').replace('Z', '');
      }
      items.push(item);
      if (items.length % 500 === 0) {
        logger.info(`${items.length} repos have been processed.`);
      }
    }
    await insertRecords(items, 'gh_repo_info');
  }
};

module.exports = task;
