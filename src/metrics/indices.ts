import { QueryConfig, 
        getMergedConfig, 
        getRepoWhereClauseForClickhouse,
        getUserWhereClauseForClickhouse,
        getTimeRangeWhereClauseForClickhouse,
        getGroupArrayInsertAtClauseForClickhouse,
        getGroupTimeAndIdClauseForClickhouse} from './basic';
import * as clickhouse from '../db/clickhouse';

export const ISSUE_COMMENT_WEIGHT = 1;
export const OPEN_ISSUE_WEIGHT = 2;
export const OPEN_PULL_WEIGHT = 3;
export const REVIEW_COMMENT_WEIGHT = 4;
export const PULL_MERGED_WEIGHT = 2;

export const getRepoOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    SUM(openrank) AS openrank
  FROM github_log.repo_openrank
  WHERE ${repoWhereClause}
  GROUP BY id, time
  ${config.order ? `ORDER BY openrank ${config.order}` : ''}
  ${config.limit > 0 ? `LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
${config.order ? `ORDER BY openrank[-1] ${config.order}` : ''}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, openrank ] = row;
    return {
      id,
      name,
      openrank,
    }
  });
}

export const getUserOpenrank = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const userWhereClause = getUserWhereClauseForClickhouse(config);

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'openrank' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'user')},
    SUM(openrank) AS openrank
  FROM github_log.user_openrank
  WHERE ${userWhereClause}
  GROUP BY id, time
  ${config.order ? `ORDER BY openrank ${config.order}` : ''}
  ${config.limit > 0 ? `LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
${config.order ? `ORDER BY openrank[-1] ${config.order}` : ''}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, openrank ] = row;
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

export const getRepoActivity = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'activity' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'participants' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'merged_pull' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo', 'month')},
    ROUND(SUM(activity), 2) AS activity,
    COUNT(actor_id) AS participants,
    SUM(issue_comment) AS issue_comment,
    SUM(open_issue) AS open_issue,
    SUM(open_pull) AS open_pull,
    SUM(review_comment) AS review_comment,
    SUM(merged_pull) AS merged_pull
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      repo_id, argMax(repo_name, created_at) AS repo_name,
      org_id, argMax(org_login, created_at) AS org_login,
      ${basicActivitySqlComponent}
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, actor_id, month
    HAVING activity > 0
  )
  GROUP BY id, time
  ${config.order ? `ORDER BY activity ${config.order}`: ''}
  ${config.limit > 0 ? `LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
${config.order ? `ORDER BY activity[-1] ${config.order}` : ''}
FORMAT JSONCompact`;  // use JSONCompact to reduce network I/O

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, activity, participants, issue_comment, open_issue, open_pull, review_comment, merged_pull ] = row;
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
    }
  });
}

export const getUserActivity = async (config: QueryConfig, withBot: boolean = true) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"]; // specify types to reduce memory usage and calculation
  const userWhereClause = getUserWhereClauseForClickhouse(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'activity' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issue_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_issue' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'open_pull' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'review_comment' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'merged_pull' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'actor', 'month')},
    ROUND(SUM(activity), 2) AS activity,
    SUM(issue_comment) AS issue_comment,
    SUM(open_issue) AS open_issue,
    SUM(open_pull) AS open_pull,
    SUM(review_comment) AS review_comment,
    SUM(merged_pull) AS merged_pull
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      repo_id,
      ${basicActivitySqlComponent}
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, actor_id, month
    HAVING activity > 0 ${ withBot ? '' : `AND actor_login NOT LIKE '%[bot]'` }
  )
  GROUP BY id, time
  ${config.order ? `ORDER BY activity ${config.order}`: ''}
  ${config.limit > 0 ? `LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
${config.order ? `ORDER BY activity[-1] ${config.order}` : ''}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, activity, issue_comment, open_issue, open_pull, review_comment, merged_pull ] = row;
    return {
      id,
      name,
      activity,
      issue_comment,
      open_issue,
      open_pull,
      review_comment,
      merged_pull,
    }
  });
}

export const getAttention = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('WatchEvent', 'ForkEvent')"];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
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
    ${getGroupTimeAndIdClauseForClickhouse(config)},
    countIf(type='WatchEvent') AS stars,
    countIf(type='ForkEvent') AS forks,
    stars + 2 * forks AS attention
  FROM github_log.events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.order ? `ORDER BY attention ${config.order}` : ''}
  ${config.limit > 0 ? `LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
${config.order ? `ORDER BY attention[-1] ${config.order}` : ''}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, attention ] = row;
    return {
      id,
      name,
      attention,
    }
  });
};
