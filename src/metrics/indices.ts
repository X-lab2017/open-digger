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
    ${getGroupIdClause(config, 'repo', 'month')},
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
    ${getGroupIdClause(config, 'user')},
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
