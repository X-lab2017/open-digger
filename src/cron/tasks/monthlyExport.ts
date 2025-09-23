// @ts-nocheck
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Task } from '..';
import { query, queryStream } from '../../db/clickhouse';
import { getRepoActivity, getRepoOpenrank, getUserActivity, getUserOpenrank, getAttention } from '../../metrics/indices';
import { forEveryMonthByConfig, forEveryQuarterByConfig, forEveryYearByConfig, timeDurationConstants } from '../../metrics/basic';
import { getLogger, waitFor } from '../../utils';
import getConfig from '../../config';
import { chaossActiveDatesAndTimes, chaossBusFactor, chaossChangeRequestAge, chaossChangeRequestResolutionDuration, chaossChangeRequestResponseTime, chaossChangeRequestReviews, chaossChangeRequests, chaossChangeRequestsAccepted, chaossCodeChangeLines, chaossContributors, chaossInactiveContributors, chaossIssueAge, chaossIssueResolutionDuration, chaossIssueResponseTime, chaossIssuesAndChangeRequestActive, chaossIssuesClosed, chaossIssuesNew, chaossNewContributors, chaossTechnicalFork } from '../../metrics/chaoss';
import { contributorEmailSuffixes, repoIssueComments, repoParticipants, repoStars } from '../../metrics/metrics';
import { getLabelData } from '../../labelDataUtils';
import { EOL } from 'os';

const task: Task = {
  cron: '0 0 5 * *',
  callback: async () => {

    const config = await getConfig();
    const exportRepoTableName = 'export_repo';
    const exportUserTableName = 'export_user';

    const logger = getLogger('MonthlyExportTask');

    const needInitExportTable = config.export.needInit;
    const initExportTable = async () => {
      // export all labeled repos/orgs/users anyway
      const platform = new Map<string, {
        repos: Set<number>;
        orgs: Set<number>,
        users: Set<number>,
      }>();
      const labelData = getLabelData();
      labelData.forEach(l => {
        l.platforms.filter(p => p.type === 'Code Hosting').forEach(p => {
          if (!platform.has(p.name)) {
            platform.set(p.name, {
              repos: new Set<number>(),
              orgs: new Set<number>(),
              users: new Set<number>(),
            });
          }
          p.orgs.forEach(o => platform.get(p.name)!.orgs.add(o.id));
          p.repos.forEach(r => platform.get(p.name)!.repos.add(r.id));
          p.users.forEach(u => platform.get(p.name)!.users.add(u.id));
        });
      });
      // handle export table first
      // - create the table if not exist
      // - insert repo and user with openrank > e in any month in history or in label data
      const exportTableQueries: string[] = [
        `CREATE TABLE IF NOT EXISTS ${exportRepoTableName}
  (\`id\` UInt64,
  \`platform\` Enum('GitHub' = 1, 'Gitee' = 2, 'AtomGit' = 3, 'GitLab.com' = 4, 'Gitea' = 5, 'GitLab.cn' = 6),
  \`repo_name\` LowCardinality(String),
  \`org_id\` UInt64
  )
  ENGINE = ReplacingMergeTree
  ORDER BY (id, platform)
  SETTINGS index_granularity = 8192`,
        `CREATE TABLE IF NOT EXISTS ${exportUserTableName}
  (\`id\` UInt64,
  \`platform\` Enum('GitHub' = 1, 'Gitee' = 2, 'AtomGit' = 3, 'GitLab.com' = 4, 'Gitea' = 5, 'GitLab.cn' = 6),
  \`actor_login\` LowCardinality(String)
  )
  ENGINE = ReplacingMergeTree
  ORDER BY (id, platform)
  SETTINGS index_granularity = 8192`,
        `ALTER TABLE ${exportRepoTableName} DELETE WHERE id > 0`,
        `ALTER TABLE ${exportUserTableName} DELETE WHERE id > 0`,
        `INSERT INTO ${exportRepoTableName}
  SELECT argMax(repo_id, time) AS id, platform, repo_name, any(orgid) AS org_id FROM
  (SELECT repo_id, platform, argMax(repo_name, created_at) AS repo_name, MAX(created_at) AS time, any(org_id) AS orgid 
  FROM global_openrank WHERE type='Repo' AND (${(() => {
          const arr: string[] = [];
          for (const [name, p] of platform.entries()) {
            if (p.repos.size > 0) arr.push(`(platform = '${name}' AND repo_id IN (${Array.from(p.repos).join(',')}))`);
            if (p.orgs.size > 0) arr.push(`(platform = '${name}' AND org_id IN (${Array.from(p.orgs).join(',')}))`);
          }
          return arr.join(' OR ');
        })()}) GROUP BY repo_id, platform)
  GROUP BY repo_name, platform`,
        `INSERT INTO ${exportUserTableName}
  SELECT argMax(actor_id, time) AS id, platform, actor_login FROM
  (SELECT actor_id, platform, argMax(actor_login, created_at) AS actor_login, MAX(created_at) AS time
  FROM global_openrank WHERE type='User' AND (actor_id IN (SELECT actor_id FROM global_openrank WHERE openrank > 5 AND type='User') OR ${(() => {
          const arr: string[] = [];
          for (const [name, p] of platform.entries()) {
            if (p.users.size > 0) arr.push(`(platform = '${name}' AND actor_id IN (${Array.from(p.users).join(',')}))`);
          }
          return arr.join(' OR ');
        })()}) GROUP BY actor_id, platform)
  GROUP BY actor_login, platform`,
      ];
      for (const q of exportTableQueries) {
        await query(q);
        await waitFor(2000); // wait for 2s to make sure the preceeding query finished
      }
    };
    if (needInitExportTable) {
      await initExportTable();
      logger.info('Init export table done.');
    }

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
            writeFileSync(join(path, 'meta.json'), JSON.stringify({
              updatedAt: new Date().getTime(),
              type: option.type ?? undefined,
              id: parseInt(id),
            }));
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
        option.whereClause = `repo_id BETWEEN ${min} AND ${max} AND repo_id IN (SELECT id FROM ${exportRepoTableName})`;
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

      logger.info('Start to process repo brief export task.');
      const repoBriefPartitions = await getPartition('Repo', 200);
      for (let i = 0; i < repoBriefPartitions.length; i++) {
        const { min, max } = repoBriefPartitions[i];
        option.whereClause = `repo_id BETWEEN ${min} AND ${max}
          AND (platform, repo_id) IN (SELECT platform, repo_id FROM global_openrank WHERE type='Repo' AND openrank > 3)`;
        option.type = 'repo';
        // [X-lab index] repo activity
        await processMetric(getRepoActivity, { ...option, options: { developerDetail: false } }, getField('activity'));
        // [X-lab index] repo openrank
        await processMetric(getRepoOpenrank, option, getField('openrank'));
        // [X-lab metric] repo participants
        await processMetric(repoParticipants, option, getField('count', { targetKey: 'participants' }));
        // [CHAOSS] contributors
        await processMetric(chaossContributors, option, getField('count', { targetKey: 'contributors' }));
        // [X-lab metric] repo stars
        await processMetric(repoStars, option, getField('count', { targetKey: 'stars' }));
        logger.info(`Process repo brief for round ${i} done.`);
      }

      logger.info('Start to process user export task.');
      const userPartitions = await getPartition('User');
      for (let i = 0; i < userPartitions.length; i++) {
        const { min, max } = userPartitions[i];
        option.whereClause = `actor_id BETWEEN ${min} AND ${max} AND actor_id IN (SELECT id FROM ${exportUserTableName})`;
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

    // export owner meta data
    const exportOwnerMeta = async () => {
      const sql = `SELECT platform, splitByChar('/', repo_name)[1] AS owner, groupArray(repo_name), groupArray(id), any(org_id) FROM ${exportRepoTableName} GROUP BY owner, platform`;
      await queryStream(sql, row => {
        const [platform, owner, repos, ids, orgId] = row;
        updateMetaData(join(exportBasePath, platform.toLowerCase(), owner, 'meta.json'), {
          updatedAt: new Date().getTime(),
          id: orgId === '0' ? undefined : parseInt(orgId),
          type: orgId === '0' ? 'user' : 'org',
          repos: repos.map((name, index) => {
            return {
              name,
              id: parseInt(ids[index]),
            };
          }),
        });
      });
      logger.info('Export owner meta data done.');
    };

    // export label data
    const exportLabelData = async () => {
      const labelData = getLabelData();
      const labelMap = new Map<string, any[]>();
      const labelDetailMap = new Map<string, { label: any, platforms: { name: string, type: string, orgs: Map<string, number>; repos: Map<string, number>; users: Map<string, number> }[] }>();
      for (const l of labelData) {
        const update = (name: any) => {
          if (!labelMap.has(name)) labelMap.set(name, []);
          // avoid duplicate label
          if (labelMap.get(name)!.findIndex(i => i.id === l.identifier) < 0) {
            labelMap.get(name)!.push({
              id: l.identifier,
              name: l.name,
              type: l.type,
            });
          }
        };
        labelDetailMap.set(l.identifier, {
          label: {
            id: l.identifier,
            name: l.name,
            type: l.type,
          },
          platforms: [],
        });
        const labelDetail = labelDetailMap.get(l.identifier)!;
        for (const p of l.platforms) {
          const { name, type, orgs, repos, users } = p;
          const item = {
            name,
            type,
            orgs: new Map<string, number>(),
            repos: new Map<string, number>(),
            users: new Map<string, number>(),
          };
          await Promise.all([
            (async () => {
              if (!orgs || orgs.length <= 0) return;
              const sql = `SELECT org_login, ROUND(SUM(repo_openrank), 2) AS openrank FROM
    (SELECT org_id, argMax(org_login, created_at) AS org_login, repo_id, argMax(openrank, created_at) AS repo_openrank FROM global_openrank
    WHERE org_id IN (${orgs.map(o => o.id).join(',')}) AND platform = '${name}' AND type='Repo'
    GROUP BY org_id, repo_id)
    GROUP BY org_login
    ORDER BY openrank DESC`;
              await queryStream(sql, row => {
                const [orgLogin, openrank] = row;
                item.orgs.set(orgLogin, openrank);
                update(`${name.toLowerCase()}/${orgLogin}`);
              });
            })(),
            (async () => {
              if (!orgs || orgs.length <= 0) return;
              // add the label to repos under the org too.
              const sql = `SELECT argMax(repo_name, created_at), ROUND(argMax(openrank, created_at), 2) AS openrank FROM global_openrank WHERE org_id IN (${orgs.map(o => o.id).join(',')}) AND platform = '${name}' AND type='Repo' GROUP BY repo_id ORDER BY openrank DESC`
              await queryStream(sql, row => {
                const [repoName] = row;
                update(`${name.toLowerCase()}/${repoName}`);
              });
            })(),
            (async () => {
              if (!repos || repos.length <= 0) return;
              const sql = `SELECT argMax(repo_name, created_at), ROUND(argMax(openrank, created_at), 2) AS openrank FROM global_openrank WHERE repo_id IN (${repos.map(r => r.id).join(',')}) AND platform='${name}' AND type='Repo' GROUP BY repo_id ORDER BY openrank DESC`;
              await queryStream(sql, row => {
                const [repoName, openrank] = row;
                item.repos.set(repoName, openrank);
                update(`${name.toLowerCase()}/${repoName}`);
              });
            })(),
            (async () => {
              if (!users || users.length <= 0) return;
              const sql = `SELECT argMax(actor_login, created_at), ROUND(argMax(openrank, created_at), 2) AS openrank FROM global_openrank WHERE actor_id IN (${users.map(u => u.id).join(',')}) AND platform='${name}' AND type='User' GROUP BY actor_id ORDER BY openrank DESC`;
              await queryStream(sql, row => {
                const [actorLogin, openrank] = row;
                item.users.set(actorLogin, openrank);
                update(`${name.toLowerCase()}/${actorLogin}`);
              });
            })(),
          ]);
          labelDetail.platforms.push(item);
        }
        logger.info(`Process ${l.identifier} done.`);
      }

      for (const [name, labels] of labelMap.entries()) {
        updateMetaData(join(exportBasePath, name, 'meta.json'), {
          labels,
        });
      }
      const convertMap = (map: Map<string, number>) => {
        if (map.size === 0) return undefined;
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(i => { return { name: i[0], openrank: i[1] } });
      };
      for (const [labelId, detail] of labelDetailMap.entries()) {
        const labelPath = join(config.export.path, 'label_data', labelId);
        mkdirSync(labelPath, { recursive: true });
        writeFileSync(join(labelPath, 'data.json'), JSON.stringify({
          ...detail.label,
          platforms: detail.platforms.map(p => ({
            name: p.name,
            type: p.type,
            orgs: convertMap(p.orgs),
            repos: convertMap(p.repos),
            users: convertMap(p.users),
          })),
        }));
      }
      logger.info('Export label data done.');
    };

    const exportUserInfo = async () => {
      let processedCount = 0;
      const userInfoQuery = `SELECT platform, b.actor_login, a.location, a.bio, a.name, a.company FROM
    (SELECT CAST('GitHub','Enum8(\\\'GitHub\\\'=1)') AS platform, id, location, bio, name, company FROM gh_user_info WHERE status='normal' AND id IN (SELECT id FROM ${exportUserTableName} WHERE platform='GitHub'))a
    LEFT JOIN
    (SELECT id, platform, actor_login FROM ${exportUserTableName})b
    ON a.id = b.id AND a.platform = b.platform
    LIMIT 1 BY b.id`;
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
        processedCount++;
        if (processedCount % 10000 === 0) {
          logger.info(`${processedCount} user info has been exported.`);
        }
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
    await exportOwnerMeta();
    await exportLabelData();
    await exportUserInfo();
    await exportAllRepoList();
    await exportAllUserList();

    logger.info(`Task monthly export done.`);
  }
};

module.exports = task;
