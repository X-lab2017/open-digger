import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Task } from '..';
import { query, queryStream } from '../../db/clickhouse';
import { getRepoActivity, getRepoOpenrank, getUserActivity, getUserOpenrank, getAttention } from '../../metrics/indices';
import { forEveryMonthByConfig } from '../../metrics/basic';
import { waitFor } from '../../utils';
import getConfig from '../../config';
import { chaossBusFactor, chaossChangeRequestReviews, chaossChangeRequests, chaossChangeRequestsAccepted, chaossCodeChangeLines, chaossIssuesClosed, chaossIssuesNew, chaossTechnicalFork } from '../../metrics/chaoss';
import { repoIssueComments, repoParticipants, repoStars } from '../../metrics/metrics';

const task: Task = {
  cron: '0 0 5 * *',
  enable: true,
  immediate: false,
  callback: async () => {

    const config = await getConfig();
    const exportRepoTableName = 'github_log.export_repo';
    const exportUserTableName = 'github_log.export_user';

    const needInitExportTable = config.export.needInit;
    const initExportTable = async () => {
      // handle export table first
      // - create the table if not exist
      // - delete all the content of the table
      // - insert repo and user with openrank > e in any month in history
      const exportTableQueries: string[] = [
        `CREATE TABLE IF NOT EXISTS ${exportRepoTableName}
  (\`id\` UInt64)
  ENGINE = MergeTree()
  ORDER BY (id)
  SETTINGS index_granularity = 8192`,
        `CREATE TABLE IF NOT EXISTS ${exportUserTableName}
  (\`id\` UInt64)
  ENGINE = MergeTree()
  ORDER BY (id)
  SETTINGS index_granularity = 8192`,
        `ALTER TABLE ${exportRepoTableName} DELETE WHERE id > 0`,
        `ALTER TABLE ${exportUserTableName} DELETE WHERE id > 0`,
        `INSERT INTO ${exportRepoTableName}
  SELECT DISTINCT(repo_id) AS id FROM github_log.repo_openrank WHERE openrank > ${Math.E}`,
        `INSERT INTO ${exportUserTableName}
  SELECT DISTINCT(actor_id) AS id FROM github_log.user_openrank WHERE openrank > ${Math.E}`,
      ];
      for (const q of exportTableQueries) {
        await query(q);
        await waitFor(2000); // wait for 2s to make sure the preceeding query finished
      }
    };
    if (needInitExportTable) {
      await initExportTable();
    }

    // start to export data for all repos and actors
    // split the sql into 20 pieces to avoid memory issue
    const getPartition = async (type: 'User' | 'Repo'): Promise<Array<{min: number, max: number}>> => {
      const quantileArr: number[] = [];
      for (let i = 0.05; i <= 0.95; i += 0.05) { 
        quantileArr.push(i);
      }
      const partitions: any[] = [];
      const sql = `SELECT [${quantileArr.map(i => `ROUND(quantile(${i})(id))`).join(',')}] AS quantiles FROM ${type === 'Repo' ? exportRepoTableName : exportUserTableName}`;
      await queryStream(sql, row => {
        const quantiles: number[] = row.quantiles;
        for (let i = 0; i < quantiles.length; i++) {
          partitions.push({min: i === 0 ? 1 : quantiles[i - 1], max: quantiles[i] - 1});
        }
        partitions.push({min: quantiles[quantiles.length - 1], max: Number.MAX_SAFE_INTEGER});
      });
      return partitions;
    }

    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const startYear = 2015, startMonth = 1, endYear = date.getFullYear(), endMonth = date.getMonth() + 1;
    const processMetric = async (func: (option: any) => Promise<any>, option: any, fields: string[]|string[][], path: string) => {
      const result: any[] = await func(option);
      for (const row of result) {
        const name = row.name;
        if (!existsSync(join(path, name))) {
          mkdirSync(join(path, name), { recursive: true });
        }
        for (let field of fields) {
          let outputField = field;
          if (Array.isArray(field)) {
            outputField = field[1];
            field = field[0];
          }
          const dataArr = row[field];
          if (!dataArr) {
            console.log(`Can not find field ${field}`);
            continue;
          }
          const exportPath = join(path, name, outputField + '.json');
          const content: any = {};
          let index = 0;
          await forEveryMonthByConfig(option, async (y, m) => {
            if (dataArr.length <= index) return;
            const key = `${y}-${m.toString().padStart(2, '0')}`;
            const ele = parseFloat(dataArr[index++]);
            if (ele !== 0) content[key] = ele;
          });
          writeFileSync(exportPath, JSON.stringify(content));
        }
      }
    };

    const exportBasePath = join(config.export.path, 'github');
    const option: any = { startYear, startMonth, endYear, endMonth, limit: -1, groupTimeRange: 'month' };

    const repoPartitions = await getPartition('Repo');
    for (let i = 0; i < repoPartitions.length; i++) {
      const {min, max} = repoPartitions[i];
      option.whereClause = `repo_id BETWEEN ${min} AND ${max} AND repo_id IN (SELECT id FROM ${exportRepoTableName})`;
      // [X-lab index] repo activity
      await processMetric(getRepoActivity, option, ['activity'], exportBasePath);
      // [X-lab index] repo openrank
      await processMetric(getRepoOpenrank, option, ['openrank'], exportBasePath);
      // [X-lab index] repo attention
      await processMetric(getAttention, option, ['attention'], exportBasePath);
      // [CHAOSS metric] repo technical fork
      await processMetric(chaossTechnicalFork, option, [['count', 'technical_fork']], exportBasePath);
      // [X-lab metric] repo stars
      await processMetric(repoStars, option, [['count', 'stars']], exportBasePath);
      // [CHAOSS metric] repo issues new
      await processMetric(chaossIssuesNew, option, [['count', 'issues_new']], exportBasePath);
      // [CHAOSS metric] repo issues closed
      await processMetric(chaossIssuesClosed, option, [['count', 'issues_closed']], exportBasePath);
      // [CHAOSS metric] repo code changes lines
      await processMetric(chaossCodeChangeLines, { ...option, options: {by: 'add'}}, [['lines', 'code_change_lines_add']], exportBasePath);
      await processMetric(chaossCodeChangeLines, { ...option, options: {by: 'remove'}}, [['lines', 'code_change_lines_remove']], exportBasePath);
      await processMetric(chaossCodeChangeLines, { ...option, options: {by: 'sum'}}, [['lines', 'code_change_lines_sum']], exportBasePath);
      // [CHAOSS metric] repo change requests
      await processMetric(chaossChangeRequests, option, [['count', 'change_requests']], exportBasePath);
      // [CHAOSS metric] repo change requests accepted
      await processMetric(chaossChangeRequestsAccepted, option, [['count', 'change_requests_accepted']], exportBasePath);
      // [X-lab metric] repo issue comments
      await processMetric(repoIssueComments, option, [['count', 'issue_comments']], exportBasePath);
      // [CHAOSS metric] repo chagne request reviews
      await processMetric(chaossChangeRequestReviews, option, [['count', 'change_requests_reviews']], exportBasePath);
      // [X-lab metric] repo participants
      await processMetric(repoParticipants, option, [['count', 'participants']], exportBasePath);
      // [CHAOSS] bus factor
      await processMetric(chaossBusFactor, option, ['bus_factor'], exportBasePath);
      console.log(`Process repo for round ${i} done.`);
    }

    const userPartitions = await getPartition('User');
    for (let i = 0; i < userPartitions.length; i++) {
      const {min, max} = userPartitions[i];
      option.whereClause = `actor_id BETWEEN ${min} AND ${max} AND actor_id IN (SELECT id FROM ${exportUserTableName})`;
      // user activity
      await processMetric(getUserActivity, option, ['activity', 'open_issue', 'issue_comment', 'open_pull', 'merged_pull', 'review_comment'], exportBasePath);
      // user openrank
      await processMetric(getUserOpenrank, option, ['openrank'], exportBasePath);
      console.log(`Process user for round ${i} done.`);
    }
  }
};

module.exports = task;
