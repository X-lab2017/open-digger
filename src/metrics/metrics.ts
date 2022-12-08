import {
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeAndIdClauseForClickhouse,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  QueryConfig } from "./basic";
import * as clickhouse from '../db/clickhouse';

export const repoStars = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'WatchEvent'"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT() AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ? 
    `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
    ''}
)
GROUP BY id
${config.order ? `ORDER BY count[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, count ] = row;
    return {
      id,
      name,
      count,
    }
  });
};

export const repoIssueComments = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssueCommentEvent' AND action = 'created'"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT() AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ? 
    `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
    ''}
)
GROUP BY id
${config.order ? `ORDER BY count[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, count ] = row;
    return {
      id,
      name,
      count,
    }
  });
};

export const repoParticipants = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT(DISTINCT actor_id) AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ? 
    `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
    ''}
)
GROUP BY id
${config.order ? `ORDER BY count[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, count ] = row;
    return {
      id,
      name,
      count,
    }
  });
};
