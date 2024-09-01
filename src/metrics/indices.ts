import {
  QueryConfig,
  getMergedConfig,
  getRepoWhereClause,
  getUserWhereClause,
  getTimeRangeWhereClause,
  getGroupArrayInsertAtClause,
  getGroupTimeClause,
  getGroupIdClause,
  getInnerOrderAndLimit,
  getOutterOrderAndLimit,
  processQueryResult,
  getTopLevelPlatform,
  getInnerGroupBy
} from './basic';
import * as clickhouse from '../db/clickhouse';
import { getPlatformData } from '../label_data_utils';

export const ISSUE_COMMENT_WEIGHT = 0.5252;
export const OPEN_ISSUE_WEIGHT = 2.2235;
export const OPEN_PULL_WEIGHT = 4.0679;
export const REVIEW_COMMENT_WEIGHT = 0.7427;
export const PULL_MERGED_WEIGHT = 2.0339;

export const getRepoOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClause.push(repoWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);
  whereClause.push("type='Repo'");

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    SUM(openrank) AS openrank
  FROM global_openrank
  WHERE ${whereClause.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'openrank')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}`;
  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank']);
}

export const getUserOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClause.push(userWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);
  whereClause.push("type='User'");

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config, 'user')},
    SUM(openrank) AS openrank
  FROM global_openrank
  WHERE ${whereClause.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'openrank')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank']);
}

interface RepoCommunityOpenRankConfig {
  limit: number;
  withBot: boolean;
};
export const getRepoCommunityOpenrank = async (config: QueryConfig<RepoCommunityOpenRankConfig>) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClause.push(repoWhereClause);
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);
  const limit = (config.options?.limit == undefined) ? 30 : config.options.limit;
  if (config.options?.withBot === false) {
    const botLabelData = getPlatformData([':bot']);
    for (const b of botLabelData) {
      whereClause.push(`(NOT (platform='${b.name}' AND actor_id IN [${b.users.map(u => u.id).join(',')}]))`);
    }
    whereClause.push(`(actor_login NOT LIKE '%[bot]')`);
  }

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'openrank', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT
    id, argMax(name, time) AS name, platform, time,
    ${limit > 0 ?
      `arraySlice(groupArray((platform, actor_id, actor_login, openrank)), 1, ${limit}) AS openrank` :
      `groupArray((platform, actor_id, actor_login, openrank)) AS openrank`}
  FROM
    (
      SELECT
        ${getGroupIdClause(config, 'repo', 'time')},
        time,
        platform,
        actor_id,
        argMax(actor_login, time) AS actor_login,
        SUM(openrank) AS openrank
      FROM
        (
          SELECT
            ${getGroupTimeClause(config, 'g.created_at')},
            g.platform AS platform,
            g.repo_id AS repo_id,
            argMax(g.repo_name, time) AS repo_name,
            argMax(g.org_id, time) AS org_id,
            argMax(g.org_login, time) AS org_login,
            c.actor_id AS actor_id,
            argMax(c.actor_login, time) AS actor_login,
            SUM(c.openrank * g.openrank / r.openrank) AS openrank
          FROM
            (SELECT * FROM community_openrank WHERE ${whereClause.join(' AND ')}) c,
            (SELECT * FROM global_openrank WHERE ${whereClause.join(' AND ')}) g,
            (SELECT repo_id, platform, created_at, SUM(openrank) AS openrank FROM community_openrank WHERE actor_id > 0 AND ${whereClause.join(' AND ')} GROUP BY repo_id, platform, created_at) r
          WHERE
            c.actor_id > 0
            AND c.repo_id = g.repo_id
            AND c.platform = g.platform
            AND c.created_at = g.created_at
            AND g.repo_id = r.repo_id
            AND g.platform = r.platform
            AND g.created_at = r.created_at
          GROUP BY
            platform, repo_id, actor_id, time
        ) data
      GROUP BY id, actor_id, platform, time
      ORDER BY openrank DESC
    )
    GROUP BY id, platform, time
)
GROUP BY id, platform
${getOutterOrderAndLimit({ ...config, order: undefined }, 'openrank')}
`;
  const result = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank']);
};

interface UserCommunityOpenRankConfig {
  limit: number;
  withBot: boolean;
};
export const getUserCommunityOpenrank = async (config: QueryConfig<UserCommunityOpenRankConfig>) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClause.push(repoWhereClause);
  const userWhereClause = await getUserWhereClause(config, 'id');
  const timeRangeClause = getTimeRangeWhereClause(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);
  const limit = (config.options?.limit == undefined) ? 30 : config.options.limit;
  if (config.options?.withBot === false) {
    const botLabelData = getPlatformData([':bot']);
    for (const b of botLabelData) {
      whereClause.push(`(NOT (platform='${b.name}' AND actor_id IN [${b.users.map(u => u.id).join(',')}]))`);
    }
    whereClause.push(`(actor_login NOT LIKE '%[bot]')`);
  }

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { value: 'openrankValue', key: 'openrank' })},
  ${getGroupArrayInsertAtClause(config, { key: 'openrankDetails', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT
    id, argMax(name, time) AS name, platform, time,
    ${limit > 0 ?
      `arraySlice(groupArray((platform, repo_id, repo_name, openrank)), 1, ${limit}) AS openrankDetails` :
      `groupArray((platform, repo_id, repo_name, openrank)) AS openrankDetails`},
    SUM(openrank) AS openrankValue
  FROM
    (
      SELECT
        ${getGroupIdClause(config, 'user', 'time')},
        time,
        platform,
        repo_id,
        argMax(repo_name, time) AS repo_name,
        SUM(openrank) AS openrank
      FROM
        (
          SELECT
            ${getGroupTimeClause(config, 'g.created_at')},
            g.platform AS platform,
            g.repo_id AS repo_id,
            argMax(g.repo_name, time) AS repo_name,
            argMax(g.org_id, time) AS org_id,
            argMax(g.org_login, time) AS org_login,
            c.actor_id AS actor_id,
            argMax(c.actor_login, time) AS actor_login,
            SUM(c.openrank * g.openrank / r.openrank) AS openrank
          FROM
            (SELECT * FROM community_openrank WHERE ${whereClause.join(' AND ')}) c,
            (SELECT * FROM global_openrank WHERE ${whereClause.join(' AND ')}) g,
            (SELECT repo_id, platform, created_at, SUM(openrank) AS openrank FROM community_openrank WHERE actor_id > 0 AND ${whereClause.join(' AND ')} GROUP BY repo_id, platform, created_at) r
          WHERE
            c.actor_id > 0
            AND c.repo_id = g.repo_id
            AND c.platform = g.platform
            AND c.created_at = g.created_at
            AND g.repo_id = r.repo_id
            AND g.platform = r.platform
            AND g.created_at = r.created_at
          GROUP BY
            platform, repo_id, actor_id, time
        ) data
      GROUP BY id, repo_id, platform, time
      ORDER BY openrank DESC
    )
    GROUP BY id, platform, time
    ${userWhereClause ? `HAVING ${userWhereClause}` : ''}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'openrank')}
`;
  const result = await clickhouse.query(sql);
  return processQueryResult(result, ['openrank', 'openrankDetails']);
};

export const basicActivitySqlComponent = `
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id,
    argMax(if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_login, actor_login), created_at) AS actor_login,
    countIf(type='IssueCommentEvent' AND action='created') AS issue_comment,
    countIf(type='IssuesEvent' AND action='opened')  AS open_issue,
    countIf(type='PullRequestEvent' AND action='opened') AS open_pull,
    countIf(type='PullRequestReviewCommentEvent' AND action='created') AS review_comment,
    countIf(type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull,
    sqrt(${ISSUE_COMMENT_WEIGHT}*issue_comment + ${OPEN_ISSUE_WEIGHT}*open_issue + ${OPEN_PULL_WEIGHT}*open_pull + ${REVIEW_COMMENT_WEIGHT}*review_comment + ${PULL_MERGED_WEIGHT}*merged_pull) AS activity
`;

interface RepoActivityOption {
  developerDetail: boolean;
}
export const getRepoActivity = async (config: QueryConfig<RepoActivityOption>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));
  const developerDetail = config.options?.developerDetail;

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'activity', value: 'agg_activity' })},
  ${getGroupArrayInsertAtClause(config, { key: 'participants' })},
  ${getGroupArrayInsertAtClause(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClause(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'merged_pull' })}
  ${developerDetail === true ? ',' + getGroupArrayInsertAtClause(config, { key: 'details', noPrecision: true, defaultValue: '[]' }) : ''}
FROM
(
  SELECT
    ${getGroupTimeClause(config, 'month')},
    ${getGroupIdClause(config, 'repo', 'last_active')},
    ROUND(SUM(activity), 2) AS agg_activity,
    COUNT(actor_id) AS participants,
    SUM(issue_comment) AS issue_comment,
    SUM(open_issue) AS open_issue,
    SUM(open_pull) AS open_pull,
    SUM(review_comment) AS review_comment,
    SUM(merged_pull) AS merged_pull
    ${developerDetail === true ? ', arraySlice(arraySort(x -> -tupleElement(x, 2), groupArray((actor_login, ROUND(activity, 2)))), 1, 100) AS details' : ''}
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      max(created_at) AS last_active,
      platform,
      repo_id, argMax(repo_name, created_at) AS repo_name,
      org_id, argMax(org_login, created_at) AS org_login,
      ${basicActivitySqlComponent}
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY platform, repo_id, org_id, actor_id, month
    HAVING activity > 0
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'agg_activity')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'activity')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['activity', 'participants', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merged_pull', 'details']);
}

interface UserActivityOption {
  repoDetail: boolean;
}
export const getUserActivity = async (config: QueryConfig<UserActivityOption>, withBot: boolean = true) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));
  const repoDetail = config.options?.repoDetail;

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'activity', value: 'agg_activity' })},
  ${getGroupArrayInsertAtClause(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClause(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClause(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClause(config, { key: 'merged_pull' })}
  ${repoDetail === true ? ',' + getGroupArrayInsertAtClause(config, { key: 'details', noPrecision: true, defaultValue: '[]' }) : ''}
FROM
(
  SELECT
    ${getGroupTimeClause(config, 'month')},
    ${getGroupIdClause(config, 'user', 'last_active')},
    ROUND(SUM(activity), 2) AS agg_activity,
    SUM(issue_comment) AS issue_comment,
    SUM(open_issue) AS open_issue,
    SUM(open_pull) AS open_pull,
    SUM(review_comment) AS review_comment,
    SUM(merged_pull) AS merged_pull
    ${repoDetail === true ? ', arraySlice(arraySort(x -> -tupleElement(x, 2), groupArray((repo_name, ROUND(activity, 2)))), 1, 100) AS details' : ''}
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      max(created_at) AS last_active,
      platform,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      ${basicActivitySqlComponent}
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY platform, repo_id, actor_id, month
    HAVING activity > 0 ${withBot ? '' : `AND actor_login NOT LIKE '%[bot]'`}
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'agg_activity')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'activity')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['activity', 'issue_comment', 'open_issue', 'open_pull', 'review_comment', 'merged_pull', 'details']);
}

export const getAttention = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('WatchEvent', 'ForkEvent')"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'attention' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    countIf(type='WatchEvent') AS stars,
    countIf(type='ForkEvent') AS forks,
    stars + 2 * forks AS attention
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'attention')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'attention')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['attention']);
};
