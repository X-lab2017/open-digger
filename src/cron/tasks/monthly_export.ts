import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Task } from '..';
import { query, queryStream } from '../../db/clickhouse';
import { getRepoActivity, getRepoOpenrank, getUserActivity, getUserOpenrank, getAttention } from '../../metrics/indices';
import { forEveryMonthByConfig, timeDurationConstants } from '../../metrics/basic';
import { waitFor } from '../../utils';
import getConfig from '../../config';
import { chaossActiveDatesAndTimes, chaossBusFactor, chaossChangeRequestAge, chaossChangeRequestResolutionDuration, chaossChangeRequestResponseTime, chaossChangeRequestReviews, chaossChangeRequests, chaossChangeRequestsAccepted, chaossCodeChangeLines, chaossInactiveContributors, chaossIssueAge, chaossIssueResolutionDuration, chaossIssueResponseTime, chaossIssuesAndChangeRequestActive, chaossIssuesClosed, chaossIssuesNew, chaossNewContributors, chaossTechnicalFork } from '../../metrics/chaoss';
import { contributorEmailSuffixes, repoIssueComments, repoParticipants, repoStars } from '../../metrics/metrics';
import { getLabelData } from '../../label_data_utils';

const task: Task = {
  cron: '0 0 5 * *',
  enable: true,
  immediate: false,
  callback: async () => {

    const config = await getConfig();
    const exportRepoTableName = 'gh_export_repo';
    const exportUserTableName = 'gh_export_user';

    const needInitExportTable = config.export.needInit;
    const initExportTable = async () => {
      // export all labeled repos/orgs/users anyway
      const repos = new Set<number>();
      const orgs = new Set<number>();
      const users = new Set<number>();
      const labelData = getLabelData();
      labelData.forEach(l => {
        l.githubRepos.forEach(id => repos.add(id));
        l.githubOrgs.forEach(id => orgs.add(id));
        l.githubUsers.forEach(id => users.add(id));
      });
      // handle export table first
      // - create the table if not exist
      // - insert repo and user with openrank > e in any month in history or in label data
      const exportTableQueries: string[] = [
        `CREATE TABLE IF NOT EXISTS ${exportRepoTableName}
  (\`id\` UInt64,
  \`repo_name\` LowCardinality(String)
  )
  ENGINE = ReplacingMergeTree(id)
  ORDER BY (id)
  SETTINGS index_granularity = 8192`,
        `CREATE TABLE IF NOT EXISTS ${exportUserTableName}
  (\`id\` UInt64,
  \`actor_login\` LowCardinality(String)
  )
  ENGINE = ReplacingMergeTree(id)
  ORDER BY (id)
  SETTINGS index_granularity = 8192`,
        `ALTER TABLE ${exportRepoTableName} DELETE WHERE id > 0`,
        `ALTER TABLE ${exportUserTableName} DELETE WHERE id > 0`,
        `INSERT INTO ${exportRepoTableName}
  SELECT argMax(repo_id, time) AS id, repo_name FROM
  (SELECT repo_id, argMax(repo_name, created_at) AS repo_name, MAX(created_at) AS time FROM gh_repo_openrank
  WHERE openrank > ${Math.E} OR repo_id IN (${Array.from(repos).join(',')})
  OR org_id IN (${Array.from(orgs).join(',')}) GROUP BY repo_id)
  GROUP BY repo_name`,
        `INSERT INTO ${exportUserTableName}
  SELECT argMax(actor_id, time) AS id, actor_login FROM
  (SELECT actor_id, argMax(actor_login, created_at) AS actor_login, MAX(created_at) AS time FROM gh_user_openrank
  WHERE openrank > ${Math.E} OR actor_id IN (${Array.from(users).join(',')}) GROUP BY actor_id)
  GROUP BY actor_login`,
      ];
      for (const q of exportTableQueries) {
        await query(q);
        await waitFor(2000); // wait for 2s to make sure the preceeding query finished
      }
    };
    if (needInitExportTable) {
      await initExportTable();
      console.log('Init export table done.');
    }

    // start to export data for all repos and actors
    // split the sql into 20 pieces to avoid memory issue
    const getPartition = async (type: 'User' | 'Repo'): Promise<Array<{ min: number, max: number }>> => {
      const quantileArr: number[] = [];
      for (let i = 0.025; i <= 0.975; i += 0.025) {
        quantileArr.push(i);
      }
      const partitions: any[] = [];
      const sql = `SELECT [${quantileArr.map(i => `ROUND(quantile(${i})(id))`).join(',')}] AS quantiles FROM ${type === 'Repo' ? exportRepoTableName : exportUserTableName}`;
      await queryStream(sql, row => {
        const quantiles: number[] = row.quantiles;
        for (let i = 0; i < quantiles.length; i++) {
          partitions.push({ min: i === 0 ? 1 : quantiles[i - 1], max: quantiles[i] - 1 });
        }
        partitions.push({ min: quantiles[quantiles.length - 1], max: Number.MAX_SAFE_INTEGER });
      }, { format: 'JSONEachRow' });
      return partitions;
    }

    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const startYear = 2015, startMonth = 1, endYear = date.getFullYear(), endMonth = date.getMonth() + 1;
    const exportBasePath = join(config.export.path, 'github');

    const processMetric = async (func: (option: any) => Promise<any>, option: any, fields: Field | Field[], agg: boolean = false) => {
      const result: any[] = await func(option);
      for (const row of result) {
        const name = row.name;
        if (!existsSync(join(exportBasePath, name))) {
          mkdirSync(join(exportBasePath, name), { recursive: true });
        }
        writeFileSync(join(exportBasePath, name, 'meta.json'), JSON.stringify({ updatedAt: new Date().getTime() }));
        if (!Array.isArray(fields)) fields = [fields];
        const aggContent: any = {};
        for (let field of fields) {
          const dataArr = row[field.sourceKey];
          if (!dataArr) {
            console.log(`Can not find field ${field}`);
            continue;
          }
          const exportPath = join(exportBasePath, name, field.targetKey + '.json');
          const content: any = {};
          let index = 0;
          await forEveryMonthByConfig(option, async (y, m) => {
            if (dataArr.length <= index) return;
            const key = `${y}-${m.toString().padStart(2, '0')}`;
            const ele = field.parser(dataArr[index++]);
            if (!field.isDefaultValue(ele)) content[key] = ele;
          });
          if (!field.disableDataLoss && option.groupTimeRange === 'month' && content['2021-10']) {
            // reason: GHArchive had a data service failure about 2 weeks in 2021.10
            // https://github.com/igrigorik/gharchive.org/issues/261
            // handle data loss in 2021.10 only when generate data by month
            content['2021-10-raw'] = content['2021-10'];
            const arr = ['2021-08', '2021-09', '2021-11', '2021-12'].map(m => content[m]);
            // use 2021-08 to 2021-12 data to estimate data for 2021-10
            if (!arr[3]) arr[3] = 0;
            if (!arr[2]) arr[2] = 0;
            if (!arr[0]) arr[0] = arr[3];
            if (!arr[1]) arr[1] = arr[2];
            // use integer form since many statistical metrics requires integer form.
            content['2021-10'] = Math.round([0.15, 0.35, 0.35, 0.15].map((f, i) => f * arr[i]).reduce((p, c) => p + c));
          }
          if (agg) {
            aggContent[field.sourceKey] = content;
          } else {
            writeFileSync(exportPath, JSON.stringify(content));
          }
        }
        if (agg) {
          writeFileSync(join(exportBasePath, name, fields[0].targetKey + '.json'), JSON.stringify(aggContent));
        }
      }
    };

    const option: any = { startYear, startMonth, endYear, endMonth, limit: -1, groupTimeRange: 'month' };
    interface Field {
      sourceKey: string;
      targetKey: string;
      isDefaultValue: (i: any) => boolean;
      disableDataLoss: boolean;
      parser: (i: any) => any;
    };
    const getField = (sourceKey: string, options?: Partial<Field>): Field => {
      return {
        sourceKey,
        targetKey: options?.targetKey ?? sourceKey,
        isDefaultValue: options?.isDefaultValue ?? (i => i === 0),
        disableDataLoss: options?.disableDataLoss ?? false,
        parser: options?.parser ?? parseFloat,
      }
    };
    const arrayFieldOption: Partial<Field> = {
      isDefaultValue: i => Array.isArray(i) && i.length === 0,
      disableDataLoss: true,
      parser: i => i,
    };
    const getDurationFields = (targetKey: string): Field[] => timeDurationConstants.sortByArray.map(k => {
      return getField(k, {
        targetKey,
        ...(k === 'levels' ? {
          ...arrayFieldOption,
          parser: i => i.map(v => parseFloat(v)),
        } : {
          isDefaultValue: i => Number.isNaN(i),
          disableDataLoss: true,
        }),
      });
    });

    console.log('Start to process repo export task.');
    const repoPartitions = await getPartition('Repo');
    for (let i = 0; i < repoPartitions.length; i++) {
      const { min, max } = repoPartitions[i];
      option.whereClause = `repo_id BETWEEN ${min} AND ${max} AND repo_id IN (SELECT id FROM ${exportRepoTableName})`;
      // [X-lab index] repo activity
      await processMetric(getRepoActivity, { ...option, options: { developerDetail: true } }, [getField('activity'), getField('details', { targetKey: 'activity_details', ...arrayFieldOption })]);
      // [X-lab index] repo openrank
      await processMetric(getRepoOpenrank, option, getField('openrank'));
      // [X-lab index] repo attention
      await processMetric(getAttention, option, getField('attention'));
      // [CHAOSS metric] repo technical fork
      await processMetric(chaossTechnicalFork, option, getField('count', { targetKey: 'technical_fork' }));
      // [X-lab metric] repo stars
      await processMetric(repoStars, option, getField('count', { targetKey: 'stars' }));
      // [CHAOSS metric] repo issues new
      await processMetric(chaossIssuesNew, option, getField('count', { targetKey: 'issues_new' }));
      // [CHAOSS metric] repo issues closed
      await processMetric(chaossIssuesClosed, option, getField('count', { targetKey: 'issues_closed' }));
      // [CHAOSS metric] repo code changes lines
      await processMetric(chaossCodeChangeLines, { ...option, options: { by: 'add' } }, getField('lines',
        { targetKey: 'code_change_lines_add', disableDataLoss: true, }));
      await processMetric(chaossCodeChangeLines, { ...option, options: { by: 'remove' } }, getField('lines',
        { targetKey: 'code_change_lines_remove', disableDataLoss: true, }));
      await processMetric(chaossCodeChangeLines, { ...option, options: { by: 'sum' } }, getField('lines',
        { targetKey: 'code_change_lines_sum', disableDataLoss: true, }));
      // [CHAOSS metric] repo change requests
      await processMetric(chaossChangeRequests, option, getField('count', { targetKey: 'change_requests' }));
      // [CHAOSS metric] repo change requests accepted
      await processMetric(chaossChangeRequestsAccepted, option, getField('count', { targetKey: 'change_requests_accepted' }));
      // [X-lab metric] repo issue comments
      await processMetric(repoIssueComments, option, getField('count', { targetKey: 'issue_comments' }));
      // [CHAOSS metric] repo chagne request reviews
      await processMetric(chaossChangeRequestReviews, option, getField('count', { targetKey: 'change_requests_reviews' }));
      // [X-lab metric] repo participants
      await processMetric(repoParticipants, option, getField('count', { targetKey: 'participants' }));
      // [CHAOSS] bus factor
      await processMetric(chaossBusFactor, option, [getField('bus_factor'), getField('detail',
        { targetKey: 'bus_factor_detail', ...arrayFieldOption })]);
      // [CHAOSS] issues active
      await processMetric(chaossIssuesAndChangeRequestActive, option, getField('count', { targetKey: 'issues_and_change_request_active' }));
      // [CHAOSS] new contributors
      await processMetric(chaossNewContributors, option, [getField('new_contributors'), getField('detail', { targetKey: 'new_contributors_detail', ...arrayFieldOption })]);
      // [CHAOSS] inactive contributors
      await processMetric(chaossInactiveContributors, option, getField('inactive_contributors'));
      // [CHAOSS] active dates and times
      await processMetric(c => chaossActiveDatesAndTimes(c, 'repo'), { ...option, options: { normalize: 10 } },
        getField('count', { targetKey: 'active_dates_and_times', ...arrayFieldOption }));
      // [X-lab] contributor email suffixes
      await processMetric(contributorEmailSuffixes, option, getField('suffixes', { targetKey: 'contributor_email_suffixes', ...arrayFieldOption }));
      // time duration related
      // [CHAOSS] resolution duration / close time
      await processMetric(chaossIssueResolutionDuration, option, getDurationFields('issue_resolution_duration'), true);
      await processMetric(chaossChangeRequestResolutionDuration, option, getDurationFields('change_request_resolution_duration'), true);
      // [CHAOSS] first response time
      await processMetric(chaossIssueResponseTime, option, getDurationFields('issue_response_time'), true);
      await processMetric(chaossChangeRequestResponseTime, option, getDurationFields('change_request_response_time'), true);
      // [CHAOSS] age
      await processMetric(chaossIssueAge, option, getDurationFields('issue_age'), true);
      await processMetric(chaossChangeRequestAge, option, getDurationFields('change_request_age'), true);
      console.log(`Process repo for round ${i} done.`);
    }
    console.log('Process repo export task done.');

    console.log('Start to process user export task.');
    const userPartitions = await getPartition('User');
    for (let i = 0; i < userPartitions.length; i++) {
      const { min, max } = userPartitions[i];
      option.whereClause = `actor_id BETWEEN ${min} AND ${max} AND actor_id IN (SELECT id FROM ${exportUserTableName})`;
      // user activity
      await processMetric(getUserActivity, option, ['activity', 'open_issue', 'issue_comment', 'open_pull', 'merged_pull', 'review_comment'].map(f => getField(f)));
      // user openrank
      await processMetric(getUserOpenrank, option, getField('openrank'));
      console.log(`Process user for round ${i} done.`);
    }
    console.log('Process user export task done.');
  }
};

module.exports = task;
