import { QueryConfig, 
        getMergedConfig, 
        getRepoWhereClauseForNeo4j, 
        getTimeRangeWhereClauseForNeo4j, 
        getTimeRangeSumClauseForNeo4j, 
        getUserWhereClauseForNeo4j, 
        getRepoWhereClauseForClickhouse,
        getUserWhereClauseForClickhouse,
        getTimeRangeWhereClauseForClickhouse,
        getGroupArrayInsertAtClauseForClickhouse,
        getGroupTimeAndIdClauseForClickhouse} from './basic';
import * as neo4j from '../db/neo4j'
import { getLabelData } from '../label_data_utils';
import * as clickhouse from '../db/clickhouse';

export const ISSUE_COMMENT_WEIGHT = 1;
export const OPEN_ISSUE_WEIGHT = 2;
export const OPEN_PULL_WEIGHT = 3;
export const REVIEW_COMMENT_WEIGHT = 4;
export const PULL_MERGED_WEIGHT = 2;

export const getRepoActivityOrOpenrank = async (config: QueryConfig, type: 'activity' | 'open_rank') => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = await getTimeRangeWhereClauseForNeo4j(config, 'r');
  const timeActivityOrOpenrankClause = getTimeRangeSumClauseForNeo4j(config, `r.${type}`);
  if (!config.groupBy) {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ?? timeWhereClause} RETURN r.name AS repo_name, r.org_login AS org, [${(await timeActivityOrOpenrankClause).join(',')}] AS ${type} ORDER BY reverse(${type}) ${config.order} ${config.limit > 0 ? `LIMIT ${config.limit}` : ''};`;
    return neo4j.query(query);
  } else if (config.groupBy === 'org') {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ?? timeWhereClause} RETURN r.org_login AS org_login, count(r.id) AS repo_count, [${(await timeActivityOrOpenrankClause).map(i => `round(SUM(${i}), ${config.percision})`)}] AS ${type} ORDER BY reverse(${type}) ${config.order} ${config.limit > 0 ? `LIMIT ${config.limit}` : ''};`;
    return neo4j.query(query);
  } else {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ?? timeWhereClause} RETURN r.id AS repo_id, r.org_id AS org_id, [${(await timeActivityOrOpenrankClause).join(',')}] AS ${type};`;
    const queryResult: any[] = await neo4j.query(query);
    const labelData = getLabelData()?.filter(l => l.type === config.groupBy);
    const result = new Map();
    if (!labelData) return null;
    queryResult.forEach(row => {
      const label = labelData.find(l => l.githubRepos.includes(row.repo_id) || l.githubOrgs.includes(row.org_id));
      if (!label) return;
      let values: any;
      if (!result.get(label.name)) values = row[type];
      else {
        values = result.get(label.name)[type];
        for (let i = 0; i < values.length; i++) {
          values[i] += row[type][i];
        }
      }
      result.set(label.name, {
        label: label.name,
        repo_count: (result.get(label.name)?.repo_count ?? 0) + 1,
        [type]: values,
      });
    });
    const resultArr = Array.from(result.values());
    if (config.order === 'ASC') resultArr.sort((a, b) => a[type][a[type].length - 1] - b[type][b[type].length - 1]);
    if (config.order === 'DESC') resultArr.sort((a, b) => b[type][b[type].length - 1] - a[type][a[type].length - 1]);
    resultArr.forEach(i => i[type] = i[type].map(v => parseFloat(v.toFixed(config.percision))));
    return resultArr.slice(0, config.limit);
  }
}

export const getUserActivityOrOpenrank = async (config: QueryConfig, type: 'activity' | 'open_rank') => {
  config = getMergedConfig(config);
  const userWhereClause = getUserWhereClauseForNeo4j(config);
  const timeWhereClause = await getTimeRangeWhereClauseForNeo4j(config, 'u');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, `u.${type}`);
  const query = `MATCH (u:User) WHERE ${userWhereClause ? userWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN u.login AS user_login, [${(await timeActivityClause).join(',')}] AS ${type} ORDER BY ${type} ${config.order} ${config.limit > 0 ? `LIMIT ${config.limit}` : ''};`;
  return neo4j.query(query);
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

export const getRepoActivityWithDetail = async (config: QueryConfig) => {
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
  ${config.limit > 0 ? `ORDER BY activity DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY activity[-1] ${config.order}
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

export const getUserActivityWithDetail = async (config: QueryConfig, withBot: boolean = true) => {
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
  ${config.limit > 0 ? `ORDER BY activity DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY activity[-1] ${config.order}
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
