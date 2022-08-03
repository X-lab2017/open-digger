import {
  filterEnumType,
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeAndIdClauseForClickhouse,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  QueryConfig } from "./basic";
import * as clickhouse from '../db/clickhouse';
import { basicActivitySqlComponent } from "./activity_openrank";

interface CodeChangeCommitsOptions {
  // a filter regular expression for commit message
  messageFilter: '^(build:|chore:|ci:|docs:|feat:|fix:|perf:|refactor:|revert:|style:|test:).*' | string;
}
export const chaossCodeChangeCommits = async (config: QueryConfig<CodeChangeCommitsOptions>) => {
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
    COUNT(arrayJoin(${config.options?.messageFilter ? `arrayFilter(x -> match(x, '${config.options.messageFilter}'), push_commits.message)` : 'push_commits.message' })) AS count
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

interface BusFactorOptions {
  // calculate bus factor by change request or git commit, or activity index. default: activity
  by: 'commit' | 'change request' | 'activity';
  // the bus factor percentage thredhold, default: 0.5
  percentage: number;
  // include GitHub Apps account, default: false
  withBot: boolean;
}
export const chaossBusFactor = async (config: QueryConfig<BusFactorOptions>) => {
  config = getMergedConfig(config);
  const by = filterEnumType(config.options?.by, ['commit', 'change request', 'activity'], 'activity');
  const whereClauses: string[] = [];
  if (by === 'commit') {
    whereClauses.push("type = 'PushEvent'")
  } else if (by === 'change request' ) {
    whereClauses.push("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1");
  } else if (by === 'activity') {
    whereClauses.push("type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')");
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
    arrayFilter(x -> tupleElement(x, 2) >= quantileExactWeighted(${config.options?.percentage ? (1 - config.options.percentage).toString() :  '0.5'})(count, count), arrayMap((x, y) -> (x, y), groupArray(${by === 'activity' ? 'actor_login': 'author' }), groupArray(count))) AS detail
  FROM
  (
    SELECT
      ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
      ${(() => {
        if (by === 'commit') {
          return `
          arrayJoin(push_commits.name) AS author,
          COUNT() AS count`
        } else if (by === 'change request') {
          return `
          issue_author_id AS actor_id,
          argMax(issue_author_login, created_at) AS author,
          COUNT() AS count`
        } else if (by === 'activity') {
          return `
          ${basicActivitySqlComponent},
          toUInt32(ceil(activity)) AS count
          `
        }
      })()}
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, time, ${by === 'commit' ? 'author' : 'actor_id' }
    ${(config.options?.withBot && by !== 'commit') ? '' : "HAVING author NOT LIKE '%[bot]'"}
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

export const chaossChangeRequestsAccepted = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1"];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'change_requests_accepted', value: 'count' })}
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
ORDER BY change_requests_accepted[-1] ${config.order}
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

export const chaossChangeRequestsDeclined = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 0"];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'change_requests_declined', value: 'count' })}
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
ORDER BY change_requests_declined[-1] ${config.order}
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

interface IssueResolutionDurationOptions {
  by: 'open' | 'close';
  type: 'avg' | 'median';
  unit: 'week' | 'day' | 'hour' | 'minute';
}
export const chaossIssueResolutionDuration = async (config: QueryConfig<IssueResolutionDurationOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent'"];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month
  
  let by = filterEnumType(config.options?.by, ['open', 'close'], 'open');
  const byCol = by === 'open' ? 'opened_at' : 'closed_at';
  let type = filterEnumType(config.options?.type, ['avg', 'median'], 'avg');
  let unit = filterEnumType(config.options?.unit, ['week', 'day', 'hour', 'minute'], 'day');
  
  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: `resolution_duration`, defaultValue: 'NaN' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo', byCol)},
    round(${type}(dateDiff('${unit}', opened_at, closed_at)), ${config.percision}) AS resolution_duration
  FROM
  (
    SELECT
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      argMaxIf(action, created_at, action IN ('opened', 'closed' , 'reopened')) AS last_action,
      maxIf(created_at, action = 'opened') AS opened_at,
      maxIf(created_at, action = 'closed') AS closed_at
    FROM github_log.events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number
    HAVING ${byCol} >= toDate('${config.startYear}-${config.startMonth}-1') AND ${byCol} < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1') AND last_action='closed'
  )
  GROUP BY id, time
  ${config.limit > 0 ? `ORDER BY resolution_duration ${config.order} LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY resolution_duration[-1] ${config.order}
FORMAT JSONCompact`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, resolution_duration ] = row;
    return {
      id,
      name,
      resolution_duration,
    }
  });
};
