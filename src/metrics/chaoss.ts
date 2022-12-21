import {
  filterEnumType,
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeAndIdClauseForClickhouse,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  QueryConfig
} from "./basic";
import * as clickhouse from '../db/clickhouse';
import { basicActivitySqlComponent } from "./indices";

// Common - Contributions
export const chaossTechnicalFork = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'ForkEvent'"];
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
    const [id, name, count] = row;
    return {
      id,
      name,
      count,
    }
  });
};

// Evolution - Code Development Activity
interface CodeChangeCommitsOptions {
  // a filter regular expression for commit message
  messageFilter: '^(build:|chore:|ci:|docs:|feat:|fix:|perf:|refactor:|revert:|style:|test:).*' | string;
}
export const chaossCodeChangeCommits = async (config: QueryConfig<CodeChangeCommitsOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PushEvent' "];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'commits_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT(arrayJoin(${config.options?.messageFilter ? `arrayFilter(x -> match(x, '${config.options.messageFilter}'), push_commits.message)` : 'push_commits.message'})) AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY commits_count[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, count] = row;
    return {
      id,
      name,
      count,
    }
  });
};

interface CodeChangeLinesOptions {
  by: 'add' | 'remove' | 'sum';
}
export const chaossCodeChangeLines = async (config: QueryConfig<CodeChangeLinesOptions>) => {
  config = getMergedConfig(config);
  const by = filterEnumType(config.options?.by, ['add', 'remove', 'sum'], 'add');
  const whereClauses: string[] = ["type = 'PullRequestEvent' "];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'code_change_lines', value: 'lines' })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    ${(() => {
      if (by === 'add') {
        return `
          SUM(pull_additions) AS lines`
      } else if (by === 'remove') {
        return `
          SUM(pull_deletions) AS lines`
      } else if (by === 'sum') {
        return `
          SUM(pull_additions) AS additions,
          SUM(pull_deletions) AS deletions,
          minus(additions,deletions) AS lines
          ` }
    })()}
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, time
    ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY lines ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
  )
  GROUP BY id
  ${config.order ? `ORDER BY code_change_lines[-1] ${config.order}` : ''}
  ${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, lines] = row;
    return {
      id,
      name,
      lines,
    }
  });
};

// Evolution - Issue Resolution
export const chaossIssuesNew = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent' AND action = 'opened'"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
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
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY issues_new_count[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, total_count, count] = row;
    return {
      id,
      name,
      total_count,
      count,
      ratio: count.map(v => `${(v * 100 / total_count).toPrecision(2)}%`),
    }
  });
};

export const chaossIssuesClosed = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent' AND action = 'closed'"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
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
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY issues_close_count[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, total_count, count] = row;
    return {
      id,
      name,
      total_count,
      count,
      ratio: count.map(v => `${(v * 100 / total_count).toPrecision(2)}%`),
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
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
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
    ${type}(dateDiff('${unit}', opened_at, closed_at)) AS resolution_duration
  FROM
  (
    SELECT
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      argMaxIf(action, created_at, action IN ('opened', 'closed' , 'reopened')) AS last_action,
      argMax(issue_created_at,created_at) AS opened_at,
      maxIf(created_at, action = 'closed') AS closed_at
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number
    HAVING ${byCol} >= toDate('${config.startYear}-${config.startMonth}-1') AND ${byCol} < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1') AND last_action='closed'
  )
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY resolution_duration ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY resolution_duration[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, resolution_duration] = row;
    return {
      id,
      name,
      resolution_duration,
    }
  });
};

interface IssueResponseTimeOptions {
  thresholds: number[];
  unit: 'month' | 'week' | 'day' | 'hour' | 'minute';
}
export const chaossIssueResponseTime = async (config: QueryConfig<IssueResponseTimeOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssueCommentEvent', 'IssuesEvent') AND actor_login NOT LIKE '%[bot]'  "];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month  
  let thresholds = config.options?.thresholds ?? [1, 3, 7]; // 3 thredholds will separate the value to 4 ranges
  let ranges = [...thresholds, -1]; // an array with one more element than threholds
  let unit = filterEnumType(config.options?.unit, ['month', 'week', 'day', 'hour', 'minute'], 'day');

  const sql = `
SELECT 
 id,
 argMax(name, time) AS name,   
 ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'issue_response_time', value: 'response_levels', defaultValue: `[${ranges.map(_ => `0`).join(',')}]`, noPrecision: true })}
FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo', 'issue_created_at')},
    [${ranges.map((_t, i) => `countIf(response_level = ${i})`).join(',')}] AS response_levels
  FROM
  (
    SELECT
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      minIf(created_at, action = 'opened' AND issue_comments = 0) AS issue_created_at,
      minIf(created_at, (action = 'created' AND actor_id != issue_author_id) OR (action = 'closed')) AS responded_at,
      if(responded_at = toDate('1970-01-01'), now(), responded_at) AS first_responded_at,
      dateDiff('${unit}', issue_created_at, first_responded_at) AS response_time,
      multiIf(${thresholds.map((t, i) => `response_time <= ${t}, ${i}`)}, ${thresholds.length}) AS response_level
    FROM gh_events
    WHERE ${whereClauses.join('AND')}
    GROUP BY repo_id, org_id, issue_number
    HAVING issue_created_at >= toDate('${config.startYear}-${config.startMonth}-1') 
             AND issue_created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1')
  )
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY response_levels[1] ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY issue_response_time[-1][1] ${config.order}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, issue_response_time] = row;
    return {
      id,
      name,
      issue_response_time,
    }
  });
};

// Evolution - Code Development Efficiency
export const chaossChangeRequestsAccepted = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
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
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY change_requests_accepted[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, total_count, count] = row;
    return {
      id,
      name,
      total_count,
      count,
      ratio: count.map(v => `${(v * 100 / total_count).toPrecision(2)}%`),
    }
  });
};

export const chaossChangeRequestsDeclined = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 0"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
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
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY count ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY change_requests_declined[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, total_count, count] = row;
    return {
      id,
      name,
      total_count,
      count,
      ratio: count.map(v => `${(v * 100 / total_count).toPrecision(2)}%`),
    }
  });
};

interface ChangeRequestsDurationOptions {
  by: 'open' | 'close';
  type: 'avg' | 'median';
  unit: 'week' | 'day' | 'hour' | 'minute';
}
export const chaossChangeRequestsDuration = async (config: QueryConfig<ChangeRequestsDurationOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND pull_merged = 1"];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
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
    ${type}(dateDiff('${unit}', opened_at, closed_at)) AS resolution_duration
  FROM
  (
    SELECT
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      argMaxIf(action, created_at, action IN ('opened', 'closed' , 'reopened')) AS last_action,
      argMax(issue_created_at,created_at) AS opened_at,
      maxIf(created_at, action = 'closed') AS closed_at
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number
    HAVING ${byCol} >= toDate('${config.startYear}-${config.startMonth}-1') AND ${byCol} < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1') AND last_action='closed'
  )
  GROUP BY id, time
  ${config.order ? `ORDER BY resolution_duration ${config.order}` : ''}
  ${config.limit > 0 ? `LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
${config.order ? `ORDER BY resolution_duration[-1] ${config.order}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, resolution_duration] = row;
    return {
      id,
      name,
      resolution_duration,
    }
  });
};

export const chaossChangeRequestsAcceptanceRatio = async (config:QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' "];
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));
  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'change_requests_accepted_ratio', value: 'ratio' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'change_requests_accepted', value: 'accepted_count' })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'change_requests_declined', value: 'declined_count' })}

FROM
(
  SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
    COUNT() AS count,
    countIf(pull_merged = 1) AS accepted_count,
    countIf(pull_merged = 0) AS declined_count,
    accepted_count/count AS ratio
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ? 
    `${config.order ? `ORDER BY ratio ${config.order}` : ''} LIMIT ${config.limit} BY time` :
    ''}
)
GROUP BY id
${config.order ? `ORDER BY change_requests_accepted_ratio[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [ id, name, ratio, accepted_count, declined_count ] = row;
    return {
      id,
      name,
      ratio,
      accepted_count,
      declined_count,
    }
  });
};

// Evolution - Code Development Process Quality
export const chaossChangeRequests = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'opened'"];
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
    const [id, name, count] = row;
    return {
      id,
      name,
      count,
    }
  });
}

export const chaossChangeRequestReviews = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestReviewCommentEvent'"];
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
    const [id, name, count] = row;
    return {
      id,
      name,
      count,
    }
  });
}

// Risk - Business Risk
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
  } else if (by === 'change request') {
    whereClauses.push("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1");
  } else if (by === 'activity') {
    whereClauses.push("type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')");
  }
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClauseForClickhouse(config));

  const sql = `
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'bus_factor', })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'detail', noPrecision: true })},
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'total_contributions' })}
FROM
(
  SELECT
    time,
    id,
    any(name) AS name,
    SUM(count) AS total_contributions,
    length(detail) AS bus_factor,
    arrayFilter(x -> tupleElement(x, 2) >= quantileExactWeighted(${config.options?.percentage ? (1 - config.options.percentage).toString() : '0.5'})(count, count), arrayMap((x, y) -> (x, y), groupArray(${by === 'activity' ? 'actor_login' : 'author'}), groupArray(count))) AS detail
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
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, time, ${by === 'commit' ? 'author' : 'actor_id'}
    ${(config.options?.withBot && by !== 'commit') ? '' : "HAVING " + (by === 'activity' ? 'actor_login' : 'author') + " NOT LIKE '%[bot]'"}
  )
  GROUP BY id, time
  ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY bus_factor ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
)
GROUP BY id
${config.order ? `ORDER BY bus_factor[-1] ${config.order}` : ''}
${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, bus_factor, detail, total_contributions] = row;
    return {
      id,
      name,
      bus_factor,
      detail,
      total_contributions,
    }
  });
};

interface NewContributorsOptions {
  // calculate new contributors by change request or git commit index. default: change request
  by: 'commit' | 'change request';
  withBot: boolean;
}
export const chaossNewContributors = async (config: QueryConfig<NewContributorsOptions>) => {
  config = getMergedConfig(config);
  const by = filterEnumType(config.options?.by, ['commit', 'change request'], 'change request');
  const whereClauses: string[] = [];
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month
  if (by === 'commit') {
    whereClauses.push("type = 'PushEvent'")
  } else if (by === 'change request') {
    whereClauses.push("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1");
  }
  const repoWhereClause = await getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const sql = `
  SELECT
    id,
    argMax(name, time) AS name,
    ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'new_contributors', value: 'new_contributor' })},
    ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'detail', noPrecision: true })},
    SUM(new_contributor) AS total_new_contributors
  FROM
  (
    SELECT
    ${getGroupTimeAndIdClauseForClickhouse(config, 'repo', 'first_time')},
      length(detail) AS new_contributor,
      (arrayMap((x) -> (x), groupArray(author))) AS detail
    FROM
    (
      SELECT
        min(created_at) AS first_time,
        repo_id,
        argMax(repo_name, created_at) AS repo_name,
        org_id,
        argMax(org_login, created_at) AS org_login,
        ${(() => {
      if (by === 'commit') {
        return `
            author
            `
      } else if (by === 'change request') {
        return `
            actor_id,
            argMax(author,created_at) AS author
            `
      }
    })()}
      FROM
       (
          SELECT 
            repo_id,
            repo_name,
            org_id,
            org_login,
            ${(() => {
      if (by === 'commit') {
        return `
              arrayJoin(push_commits.name) AS author
              `
      } else if (by === 'change request') {
        return `
              issue_author_id AS actor_id,
              issue_author_login AS author
              `
      }
    })()},
            created_at
          FROM gh_events
          WHERE ${whereClauses.join(' AND ')}
          ${(config.options?.withBot && by !== 'commit') ? '' : "HAVING author NOT LIKE '%[bot]'"}
        )
      GROUP BY repo_id, org_id, ${by === 'commit' ? 'author' : 'actor_id'}
      HAVING first_time >= toDate('${config.startYear}-${config.startMonth}-1') AND first_time < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1')
    )
    GROUP BY id, time
    ${config.limitOption === 'each' && config.limit > 0 ?
      `${config.order ? `ORDER BY new_contributor ${config.order}` : ''} LIMIT ${config.limit} BY time` :
      ''}
  )
  GROUP BY id
  ${config.order ? `ORDER BY new_contributors[-1] ${config.order}` : ''}
  ${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, new_contributors, detail] = row;
    return {
      id,
      name,
      new_contributors,
      detail,
    }
  });
}
