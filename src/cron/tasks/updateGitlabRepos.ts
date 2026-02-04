import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { formatDate, getLogger } from '../../utils';
import { get } from 'https';

/**
 * This task is used to update GitLab repos basic info
 */
const task: Task = {
  cron: '0 10 * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateGitlabRepoTask');
    const config = await getConfig();
    const gitlabToken = config.gitlab.token;
    const gitlabApiUrl = config.gitlab.apiUrl;

    const tableName = 'gitlab_repo_list';

    const createGitlabRepoListTable = async () => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id UInt64,
          namespace_id UInt64,
          namespace_name String,
          name String,
          description String,
          default_branch String,
          archived UInt8,
          topics Array(String),
          tag_list Array(String),
          created_at DateTime,
          stars_count UInt32,
          forks_count UInt32,
          last_activity_at DateTime,
          updated_at DateTime,
          inserted_at UInt64
        )
        ENGINE = ReplacingMergeTree(inserted_at)
        ORDER BY id
        SETTINGS index_granularity = 8192
      `;
      await query(createTableQuery);
    };
    await createGitlabRepoListTable();

    const parseProject = (project: ProjectRaw): ProjectItem => {
      return {
        id: project.id,
        namespace_id: project.namespace.id,
        namespace_name: project.namespace.path,
        name: project.path_with_namespace,
        description: project.description ?? '',
        default_branch: project.default_branch,
        archived: project.archived ? 1 : 0,
        topics: project.topics,
        tag_list: project.tag_list,
        created_at: formatDate(project.created_at),
        stars_count: project.stars_count,
        forks_count: project.forks_count,
        last_activity_at: formatDate(project.last_activity_at),
        updated_at: formatDate(project.updated_at),
        inserted_at: new Date().getTime(),
      };
    };

    const getProjects = async (lastActivityAfter: string, limit: number): Promise<ProjectRaw[]> => {
      const projects = await new Promise<ProjectRaw[]>((resolve, reject) => {
        const url = new URL(`${gitlabApiUrl}/projects?last_activity_after=${lastActivityAfter}&per_page=${limit}&sort=asc&order_by=last_activity_at`);
        const options = {
          hostname: url.hostname,
          path: url.pathname + url.search,
          headers: {
            'Authorization': `Bearer ${gitlabToken}`,
            'User-Agent': 'opendigger-bot'
          }
        };
        get(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              logger.error(`Error parsing projects: ${data}`);
              reject(e);
            }
          });
        }).on('error', reject);
      });
      return projects;
    };

    const saveProjects = async (projects: ProjectItem[]) => {
      await insertRecords(projects.map(project => ({
        ...project,
        inserted_at: new Date().getTime(),
      })), tableName);
    };

    const maxLastActivityAt = await query<any[]>(`SELECT MAX(last_activity_at) AS max_last_activity_at FROM ${tableName}`);
    let lastActivityAt = new Date(maxLastActivityAt[0][0]).toISOString();
    let projects: ProjectRaw[] = [];
    logger.info(`Max last activity at in database: ${lastActivityAt}`);

    do {
      try {
        projects = await getProjects(lastActivityAt, 100);
        await saveProjects(projects.map(parseProject));
        lastActivityAt = projects[projects.length - 1].last_activity_at;
        logger.info(`Saved ${projects.length} projects, starting from ${lastActivityAt}`);
      } catch (error: any) {
        logger.error(`Error getting projects: ${error.message}\n${error.stack}`);
        break;
      }
    } while (projects.length > 0);
  }
};

interface ProjectRaw {
  id: number;
  description: string;
  path_with_namespace: string;
  created_at: string;
  default_branch: string;
  tag_list: string[];
  topics: string[];
  archived: boolean;
  forks_count: number;
  stars_count: number;
  last_activity_at: string;
  updated_at: string;
  namespace: {
    id: number;
    path: string;
    pull_path: string;
  }
};

interface ProjectItem {
  id: number;
  namespace_id: number;
  namespace_name: string;
  name: string;
  description: string;
  default_branch: string;
  archived: number;
  topics: string[];
  tag_list: string[];
  created_at: string;
  stars_count: number;
  forks_count: number;
  last_activity_at: string;
  updated_at: string;
  inserted_at: number;
}

module.exports = task;
