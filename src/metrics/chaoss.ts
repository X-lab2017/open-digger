import {
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeAndIdClauseForClickhouse,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  QueryConfig } from "./basic";
import * as clickhouse from '../db/clickhouse';

export const chaossIssuesNew = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent' AND action = 'opened'"];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

    const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  SUM(new_issue_count) AS total_count,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'count', value: 'new_issue_count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    SUM(count) AS new_issue_count
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      COUNT() AS count
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, month
  )
  GROUP BY id, time
  ${config.limit > 0 ? `ORDER BY count DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY count[-1] ${config.order}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, total_count, count ] = row;
    return {
      id,
      name,
      total_count,
      count,
      ratio: count.map(v => `${(v*100/total_count).toPrecision(2)}%`),
    }
  });
};

export const chaossIssuesClosed = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent' AND action = 'closed'"];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

    const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  SUM(closed_issue_count) AS total_count,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'count', value: 'closed_issue_count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    SUM(count) AS closed_issue_count
  FROM
  (
    SELECT
      toStartOfMonth(created_at) AS month,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      COUNT() AS count
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, month
  )
  GROUP BY id, time
  ${config.limit > 0 ? `ORDER BY count DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY count[-1] ${config.order}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, total_count, count ] = row;
    return {
      id,
      name,
      total_count,
      count,
      ratio: count.map(v => `${(v*100/total_count).toPrecision(2)}%`),
    }
  });
};
