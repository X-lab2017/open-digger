import {
  QueryConfig,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getUserWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeClauseForClickhouse,
  getGroupIdClauseForClickhouse,
  getInnerOrderAndLimit,
  getOutterOrderAndLimit
} from './basic';
import * as clickhouse from '../db/clickhouse';

export const ISSUE_COMMENT_WEIGHT = 1;
export const OPEN_ISSUE_WEIGHT = 2;
export const OPEN_PULL_WEIGHT = 3;
export const REVIEW_COMMENT_WEIGHT = 4;
export const PULL_MERGED_WEIGHT = 2;

export const getRepoOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClause.push(repoWhereClause);
  const timeRangeClause = getTimeRangeWhereClauseForClickhouse(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config)},
    SUM(openrank) AS openrank
  FROM gh_repo_openrank
  WHERE ${whereClause.join(' AND ')}
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'openrank')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'openrank')}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, openrank] = row;
    return {
      id,
      name,
      openrank,
    }
  });
}

export const getUserOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClause: string[] = [];
  const userWhereClause = await getUserWhereClauseForClickhouse(config);
  if (userWhereClause) whereClause.push(userWhereClause);
  const timeRangeClause = getTimeRangeWhereClauseForClickhouse(config);
  if (timeRangeClause) whereClause.push(timeRangeClause);

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config, 'user')},
    SUM(openrank) AS openrank
  FROM gh_user_openrank
  WHERE ${whereClause.join(' AND ')}
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'openrank')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'openrank')}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, openrank] = row;
    return {
      id,
      name,
      openrank,
    }
  });

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
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));
  const developerDetail = config.options?.developerDetail;

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'activity', value: 'agg_activity' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'participants' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'merged_pull' })}
  ${developerDetail === true ? ',' + getGroupArrayInsertAtClauseForClickhouse(config, { key: 'details', noPrecision: true, defaultValue: '[]' }) : ''}
FROM
(
  SELECT
    ${getGroupTimeClauseForClickhouse(config, 'month')},
    ${getGroupIdClauseForClickhouse(config, 'repo', 'month')},
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
      repo_id, argMax(repo_name, created_at) AS repo_name,
      org_id, argMax(org_login, created_at) AS org_login,
      ${basicActivitySqlComponent}
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, actor_id, month
    HAVING activity > 0
  )
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'agg_activity')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'activity')}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, activity, participants, issue_comment, open_issue, open_pull, review_comment, merged_pull, details] = row;
    return {
      id,
      name,
      activity,
      participants,
      issue_comment,
      open_issue,
      open_pull,
      review_comment,
      merged_pull,
      details,
    }
  });
}

interface UserActivityOption {
  repoDetail: boolean;
}
export const getUserActivity = async (config: QueryConfig<UserActivityOption>, withBot: boolean = true) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const userWhereClause = await getUserWhereClauseForClickhouse(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));
  const repoDetail = config.options?.repoDetail;

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'activity', value: 'agg_activity' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'merged_pull' })}
  ${repoDetail === true ? ',' + getGroupArrayInsertAtClauseForClickhouse(config, { key: 'details', noPrecision: true, defaultValue: '[]' }) : ''}
FROM
(
  SELECT
    ${getGroupTimeClauseForClickhouse(config, 'month')},
    ${getGroupIdClauseForClickhouse(config, 'user')},
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
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      ${basicActivitySqlComponent}
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, actor_id, month
    HAVING activity > 0 ${withBot ? '' : `AND actor_login NOT LIKE '%[bot]'`}
  )
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'agg_activity')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'activity')}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, activity, issue_comment, open_issue, open_pull, review_comment, merged_pull, details] = row;
    return {
      id,
      name,
      activity,
      issue_comment,
      open_issue,
      open_pull,
      review_comment,
      merged_pull,
      details,
    }
  });
}

export const getAttention = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('WatchEvent', 'ForkEvent')"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'attention' })}
FROM
(
  SELECT
    ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config)},
    countIf(type='WatchEvent') AS stars,
    countIf(type='ForkEvent') AS forks,
    stars + 2 * forks AS attention
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'attention')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'attention')}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, attention] = row;
    return {
      id,
      name,
      attention,
    }
  });
};
