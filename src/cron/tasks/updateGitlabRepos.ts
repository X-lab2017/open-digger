import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { formatDate, getLogger } from '../../utils';
import { get } from 'https';

/**
 * This task is used to update GitLab repos basic info
 */
const task: Task = {
  cron: '0 * * * *',
  singleInstance: false,
  callback: async () => {
    const logger = getLogger('UpdateGitlabRepoTask');
    const config = await getConfig();
    const gitlabToken = config.gitlab.token;
    const gitlabApiUrl = config.gitlab.apiUrl;

    if (!gitlabToken || !gitlabApiUrl || gitlabToken === '' || gitlabApiUrl === '') {
      logger.error('GitLab token or API URL is not set');
      return;
    }

    const tableName = 'gitlab_repo_list';
    const perPage = 100;

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
          issue_updated_at DateTime,
          issue_end_cursor String,
          mr_updated_at DateTime,
          mr_end_cursor String,
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
        namespace_name: project.namespace.full_path,
        name: project.path_with_namespace,
        description: project.description ?? '',
        default_branch: project.default_branch ?? '',
        archived: project.archived ? 1 : 0,
        topics: project.topics,
        tag_list: project.tag_list,
        created_at: formatDate(project.created_at),
        stars_count: project.stars_count,
        forks_count: project.forks_count,
        last_activity_at: formatDate(project.last_activity_at),
        updated_at: formatDate(project.updated_at),
        inserted_at: 0, // will be set when saving
      };
    };

    const getProjects = async (lastActivityAfter: string, limit: number): Promise<ProjectRaw[]> => {
      const projects = await new Promise<ProjectRaw[]>((resolve, reject) => {
        const params = new URLSearchParams({
          last_activity_after: lastActivityAfter,
          per_page: limit.toString(),
          sort: 'asc',
          order_by: 'last_activity_at',
        });
        const url = new URL(`${gitlabApiUrl}/projects?${params.toString()}`);
        const options = {
          hostname: url.hostname,
          path: url.pathname + url.search,
          headers: {
            'Authorization': `Bearer ${gitlabToken}`,
            'User-Agent': 'opendigger-bot'
          }
        };
        get(options, (res) => {
          if (res.statusCode && res.statusCode >= 500) {
            // server error, retry after 1 second
            setTimeout(() => {
              getProjects(lastActivityAfter, limit).then(resolve).catch(reject);
            }, 1000);
            return;
          }
          if (res.statusCode !== 200) {
            logger.error(`Error getting projects: ${res.statusCode} ${res.statusMessage}`);
            reject(new Error(`Error getting projects: ${res.statusCode} ${res.statusMessage}`));
            return;
          }
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
      // Get existing data to preserve issue/mr cursor and update times
      let currentData: any[];
      try {
        currentData = await query<any>(`SELECT id, issue_updated_at, issue_end_cursor, mr_updated_at, mr_end_cursor FROM ${tableName}
          WHERE id IN (${projects.map(p => p.id).join(',')})`);
      } catch (err: any) {
        logger.error(`Error fetching existing project data, aborting update to avoid overwriting progress: ${err.message}`);
        throw new Error(`Aborting project update due to failure in fetching historical progress data`);
      }
      const currentDataMap = new Map(currentData.map((r: any) => [+r[0], {
        issue_updated_at: r[1],
        issue_end_cursor: r[2] || '',
        mr_updated_at: r[3],
        mr_end_cursor: r[4] || ''
      }]));

      await insertRecords(projects.map(project => {
        const existing = currentDataMap.get(+project.id);
        return {
          ...project,
          issue_updated_at: existing?.issue_updated_at || formatDate(new Date(0).toISOString()),
          issue_end_cursor: existing?.issue_end_cursor || '',
          mr_updated_at: existing?.mr_updated_at || formatDate(new Date(0).toISOString()),
          mr_end_cursor: existing?.mr_end_cursor || '',
          inserted_at: new Date().getTime(),
        };
      }), tableName);
    };

    const maxLastActivityAt = await query<any[]>(`SELECT MAX(last_activity_at) AS max_last_activity_at FROM ${tableName}`);
    let lastActivityAt = maxLastActivityAt[0][0].replace(' ', 'T') + '.000Z';
    let projects: ProjectRaw[] = [];
    logger.info(`Max last activity at in database: ${lastActivityAt}`);
    let totalCount = 0;
    do {
      try {
        projects = await getProjects(lastActivityAt, perPage);
        if (projects.length === 0) {
          logger.info(`No projects found starting from ${lastActivityAt}, task done.`);
          break;
        }
        await saveProjects(projects.map(parseProject));
        lastActivityAt = projects[projects.length - 1].last_activity_at;
        totalCount += projects.length;
        logger.info(`Saved ${projects.length} projects, starting from ${lastActivityAt}, total count: ${totalCount}`);
      } catch (error: any) {
        logger.error(`Error getting projects starting from ${lastActivityAt}: ${error.message}\n${error.stack}`);
        break;
      }
    } while (projects.length === perPage && totalCount < 10000);
    logger.info(`Task done, total count: ${totalCount}`);
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
    full_path: string;
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
  issue_updated_at?: string | null;
  issue_end_cursor?: string;
  mr_updated_at?: string | null;
  mr_end_cursor?: string;
  inserted_at: number;
}

module.exports = task;
