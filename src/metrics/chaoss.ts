import {
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeAndIdClauseForClickhouse,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  QueryConfig } from "./basic";
import * as clickhouse from '../db/clickhouse';

export const chaossCodeChangeCommits = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PushEvent' "];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'commits_count', value:'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT() AS count
  FROM github_log.events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limit > 0 ? `ORDER BY count DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY commits_count[-1] ${config.order}
FORMAT JSONCompact`;

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
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issues_new_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT() AS count
  FROM github_log.events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limit > 0 ? `ORDER BY count DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY issues_new_count[-1] ${config.order}
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
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issues_close_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT() AS count
  FROM github_log.events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limit > 0 ? `ORDER BY count DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY issues_close_count[-1] ${config.order}
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

export const chaossBusFactor = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const byCommit = config.options?.byCommit;
  const whereClauses: string[] = [];
  if (byCommit) {
    whereClauses.push("type = 'PushEvent'")
  } else {
    whereClauses.push("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1");
  }
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'bus_factor', })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'detail' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'total_contributions' })}
FROM
(
  SELECT
    time,
    id,
    any(name) AS name,
    SUM(count) AS total_contributions,
    length(detail) AS bus_factor,
    arrayFilter(x -> tupleElement(x, 2) >= quantileExactWeighted(${config.options?.percentage ? (1 - config.options.percentage).toString() :  '0.5'})(count, count), arrayMap((x, y) -> (x, y), groupArray(author), groupArray(count))) AS detail
  FROM
  (
    SELECT
      ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
      ${(() => {
        if (byCommit) {
          return `
          arrayJoin(push_commits.name) AS author,
          `
        } else {
          return `
          issue_author_id AS actor_id,
          argMax(issue_author_login, created_at) AS author,`
        }
      })()}
      COUNT() AS count
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, time, ${byCommit ? 'author' : 'actor_id' }
    ${(config.options?.withBot && !byCommit) ? '' : "HAVING author NOT LIKE '%[bot]'"}
    ORDER BY count DESC
  )
  GROUP BY id, time
)
GROUP BY id
ORDER BY bus_factor[-1] ${config.order}
${config.limit > 0 ? `LIMIT ${config.limit}` : ''}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, bus_factor, detail, total_contributions ] = row;
    return {
      id,
      name,
      bus_factor,
      detail,
      total_contributions,
    }
  });
}
