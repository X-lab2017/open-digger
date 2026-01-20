// @ts-nocheck
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Task } from '..';
import { query, queryStream } from '../../db/clickhouse';
import { forEveryMonthByConfig, forEveryQuarterByConfig, forEveryYearByConfig, timeDurationConstants } from '../../metrics/basic';
import {
  chaossActiveDatesAndTimes, chaossBusFactor, chaossChangeRequestAge, chaossChangeRequestResolutionDuration,
  chaossChangeRequestResponseTime, chaossChangeRequestReviews, chaossChangeRequests, chaossChangeRequestsAccepted,
  chaossCodeChangeLines, chaossContributors, chaossInactiveContributors, chaossIssueAge, chaossIssueResolutionDuration,
  chaossIssueResponseTime, chaossIssuesAndChangeRequestActive, chaossIssuesClosed, chaossIssuesNew,
  chaossNewContributors, chaossTechnicalFork
} from '../../metrics/chaoss';
import { contributorEmailSuffixes, repoIssueComments, repoParticipants, repoStars } from '../../metrics/metrics';
import { getRepoActivity, getRepoOpenrank, getUserActivity, getUserOpenrank, getAttention } from '../../metrics/indices';
import { getLogger, waitFor } from '../../utils';
import getConfig from '../../config';
import { EOL } from 'os';

const task: Task = {
  cron: '0 0 5 * *',
  singleInstance: true,
  callback: async () => {

    const config = await getConfig();
    const logger = getLogger('MonthlyExportTask');

    const exportRepoTableName = 'export_repo';
    const exportUserTableName = 'export_user';

    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const startYear = 2015, startMonth = 1, endYear = date.getFullYear(), endMonth = date.getMonth() + 1;
    const exportBasePath = join(config.export.path);

    const exportMetrics = async () => {
      const getPartition = async (type: 'User' | 'Repo', parts: number = 100): Promise<Array<{ min: number, max: number }>> => {
        const quantileArr: number[] = [];
        const step = 1 / parts;
        for (let i = step; i < 1; i += step) {
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

      const processMetric = async (func: (option: any) => Promise<any>, option: any, fields: Field | Field[], agg: boolean = false) => {
        const exportDir = new Map<string, string>();
        const exportData = new Map<string, any>();
        const iterFuncMap = new Map<string, any>([
          ['month', forEveryMonthByConfig],
          ['quarter', forEveryQuarterByConfig],
          ['year', forEveryYearByConfig],
        ]);
        try {
          for (const type of ['month', 'quarter', 'year']) {
            option.groupTimeRange = type;
            const result: any[] = await func(option);
            for (const row of result) {
              const name: string = row.name;
              const platform: string = row.platform;
              exportDir.set(join(exportBasePath, platform.toLowerCase(), name), row.id);
              if (!Array.isArray(fields)) fields = [fields];
              const aggExportPath = join(exportBasePath, platform.toLowerCase(), name, fields[0].targetKey + '.json');
              const aggContent: any = exportData.get(aggExportPath) ?? {};
              for (let field of fields) {
                const dataArr = row[field.sourceKey];
                if (!dataArr) {
                  logger.error(`Can not find field ${field}`);
                  continue;
                }
                const exportPath = join(exportBasePath, platform.toLowerCase(), name, field.targetKey + '.json');
                let content: any = exportData.get(exportPath) ?? {};
                if (agg) {
                  content = aggContent[field.sourceKey] ?? {};
                }
                let index = 0;
                await iterFuncMap.get(type)(option, async (y, m) => {
                  if (dataArr.length <= index) return;
                  let key: string = '';
                  if (type === 'month') {
                    key = `${y}-${m.toString().padStart(2, '0')}`;
                  } else if (type === 'quarter') {
                    key = `${y}Q${m}`;
                  } else if (type === 'year') {
                    key = `${y}`;
                  }
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
                  if (!arr[3]) arr[3] = 0; if (!arr[2]) arr[2] = 0;
                  if (!arr[0]) arr[0] = arr[3]; if (!arr[1]) arr[1] = arr[2];
                  // use integer form since many statistical metrics requires integer form.
                  content['2021-10'] = Math.round([0.15, 0.35, 0.35, 0.15]
                    .map((f, i) => f * arr[i]).reduce((p, c) => p + c));
                }
                if (!agg) {
                  exportData.set(exportPath, content);
                } else {
                  aggContent[field.sourceKey] = content;
                }
              }
              if (agg) {
                exportData.set(aggExportPath, aggContent);
              }
            }
          }
        } catch (e) {
          logger.error(`Error on processing metric: ${func.name}, e=${e}`);
        }

        // write back to local disk in async way
        (async () => {
          for (const [path, id] of exportDir.entries()) {
            if (!existsSync(path)) {
              mkdirSync(path, { recursive: true });
            }
            if (['getRepoActivity', 'getUserActivity', 'repoStars'].includes(func.name)) {
              // write meta data in activity calculation
              writeFileSync(join(path, 'meta.json'), JSON.stringify({
                updatedAt: new Date().getTime(),
                type: option.type ?? undefined,
                id: parseInt(id),
              }));
            }
          }

          for (const [path, content] of exportData.entries()) {
            writeFileSync(path, JSON.stringify(content));
          }
        })();
      };

      const option: any = { startYear, startMonth, endYear, endMonth, limit: -1 };
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

      logger.info('Start to process repo export task.');
      const repoPartitions = await getPartition('Repo');
      for (let i = 0; i < repoPartitions.length; i++) {
        const { min, max } = repoPartitions[i];
        option.whereClause = `repo_id BETWEEN ${min} AND ${max} AND
          (platform, repo_id) IN (SELECT platform, id FROM ${exportRepoTableName}) AND
          (platform, repo_id) NOT IN (SELECT 'GitHub', id FROM gh_repo_info WHERE status='not_found')`;
        option.type = 'repo';
        // [X-lab index] repo activity
        await processMetric(getRepoActivity, { ...option, options: { developerDetail: true } },
          [getField('activity'), getField('details', { targetKey: 'activity_details', ...arrayFieldOption, parser: arr => arr.length <= 100 ? arr : arr.filter(i => i[1] >= 2) })]);
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
        // [CHAOSS] contributors
        await processMetric(chaossContributors, option, [getField('count', { targetKey: 'contributors' }), getField('detail', { targetKey: 'contributors_detail', ...arrayFieldOption })]);
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
        logger.info(`Process repo for round ${i} done.`);
      }
      logger.info('Process repo export task done.');

      logger.info('Start to process user export task.');
      const userPartitions = await getPartition('User');
      for (let i = 0; i < userPartitions.length; i++) {
        const { min, max } = userPartitions[i];
        option.whereClause = `actor_id BETWEEN ${min} AND ${max} AND actor_id IN (SELECT id FROM ${exportUserTableName}) AND
          (platform, actor_id) NOT IN (SELECT 'GitHub', id FROM gh_user_info WHERE status='not_found')`;
        option.type = 'user';
        // user activity
        await processMetric(getUserActivity, { ...option, options: { repoDetail: false } },
          [...['activity', 'open_issue', 'issue_comment', 'open_pull', 'merged_pull', 'review_comment'].map(f => getField(f))]);
        // user openrank
        await processMetric(getUserOpenrank, option, getField('openrank'));
        logger.info(`Process user for round ${i} done.`);
      }
      logger.info('Process user export task done.');
    };

    const updateMetaData = (path: string, data: any) => {
      try {
        let outputData = data;
        if (!existsSync(path)) return;
        const originalData = JSON.parse(readFileSync(path).toString());
        outputData = {
          ...originalData,
          ...data,
        };
        writeFileSync(path, JSON.stringify(outputData));
      } catch (e: any) {
        logger.error(`Exception on updating meta data, path=${path}, data=${data}, e=${e.message}`);
      }
    };

    // export label data
    const exportLabelData = async () => {
      logger.info('Start to export repo label data.');
      const labelPriority = new Map<string, number>([
        ['Project', 1],
        ['Tech-0', 2],
        ['Community', 3],
        ['University-0', 4],
        ['Institution-0', 5],
        ['Company', 6],
        ['Foundation', 7],
        ['Division-0', 8],
      ]);
      const repoLabels = await query(`SELECT p, n, arrayDistinct(groupArray(tuple(li, ln, lt))) FROM
(SELECT o.platform AS p, o.repo_name AS n, l.id AS li, l.name ln, l.type AS lt FROM
  (SELECT platform, repo_id, any(org_id) AS org_id, argMax(repo_name, created_at) AS repo_name FROM
  global_openrank WHERE type = 'Repo' AND (platform, repo_id) IN (SELECT platform, id FROM export_repo)
  AND (platform, repo_id) NOT IN (SELECT 'GitHub', id FROM gh_repo_info WHERE status='not_found')
  GROUP BY platform, repo_id) o,
  (SELECT * FROM flatten_labels WHERE type IN ('Project', 'Community', 'Foundation', 'Company', 'Tech-0', 'University-0', 'Institution-0', 'Division-0')) l
WHERE o.platform=l.platform AND ((o.repo_id=l.entity_id AND l.entity_type='Repo') OR (o.org_id=l.entity_id AND l.entity_type='Org')))
GROUP BY p, n`);
      for (const [platform, repoName, labels] of repoLabels) {
        updateMetaData(join(exportBasePath, platform.toLowerCase(), repoName, 'meta.json'), {
          labels: labels.map(([labelId, labelName, labelType]) => ({
            id: labelId,
            name: labelName,
            type: labelType,
          })).sort((a, b) => labelPriority.get(b.type)! - labelPriority.get(a.type)!),
        });
      }
      logger.info('Export repo label data done.');
    };

    const exportUserInfo = async () => {
      logger.info('Start to export user info.');
      const userInfoQuery = `SELECT platform, login, location, bio, name, company
      FROM user_info WHERE (platform, id) IN (SELECT platform, id FROM ${exportUserTableName}) AND 
      (platform, id) NOT IN (SELECT 'GitHub', id FROM gh_user_info WHERE status='not_found')`;
      await queryStream(userInfoQuery, row => {
        const [platform, login, location, bio, name, company] = row;
        updateMetaData(join(exportBasePath, platform.toLowerCase(), login, 'meta.json'), {
          info: {
            location: location ?? undefined,
            bio: bio ?? undefined,
            name: name ?? undefined,
            company: company ?? undefined,
          }
        });
      });
      logger.info('Export user info done');
    }

    const exportAllRepoList = async () => {
      const filePath = join(exportBasePath, 'repo_list.csv');
      writeFileSync(filePath, `id,platform,repo_name${EOL}`);
      const query = `SELECT
  e.id AS id,
  e.platform AS platform,
  any(e.repo_name) AS repo_name,
  argMax (g.openrank, g.created_at) AS openrank
FROM
  global_openrank g,
  ${exportRepoTableName} e
WHERE
  e.id = g.repo_id
  AND e.platform = g.platform
GROUP BY
  id, platform
ORDER BY
  openrank DESC`;
      await queryStream(query, row => {
        const [id, platform, name] = row;
        appendFileSync(filePath, `${id},${platform.toLowerCase()},${name}${EOL}`);
      });
      logger.info('Export repo list done.');
    };

    const exportAllUserList = async () => {
      const filePath = join(exportBasePath, 'user_list.csv');
      writeFileSync(filePath, `id,platform,actor_login${EOL}`);
      const query = `SELECT
  e.id AS id,
  e.platform AS platform,
  any(e.actor_login) AS actor_login,
  argMax (g.openrank, g.created_at) AS openrank
FROM
  global_openrank g,
  ${exportUserTableName} e
WHERE
  e.id = g.actor_id
  AND e.platform = g.platform
GROUP BY
  id, platform
ORDER BY
  openrank DESC`;
      await queryStream(query, row => {
        const [id, platform, login] = row;
        appendFileSync(filePath, `${id},${platform.toLowerCase()},${login}${EOL}`);
      });
      logger.info('Export user list done.');
    };

    await exportMetrics();
    await exportLabelData();
    await exportUserInfo();
    await exportAllRepoList();
    await exportAllUserList();

    logger.info(`Task monthly export done.`);
  }
};

module.exports = task;
