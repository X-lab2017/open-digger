import {
  filterEnumType, getMergedConfig,
  getRepoWhereClause, getTimeRangeWhereClause, getUserWhereClause,
  getGroupArrayInsertAtClause, getGroupTimeClause, getGroupIdClause,
  getInnerOrderAndLimit, getOutterOrderAndLimit,
  QueryConfig, TimeDurationOption, timeDurationConstants, processQueryResult, getTopLevelPlatform, getInnerGroupBy,
} from "./basic";
import * as clickhouse from '../db/clickhouse';
import { basicActivitySqlComponent } from "./indices";

// Common - Contributions
export const chaossTechnicalFork = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'ForkEvent'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'count')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['count']);
};

// Evolution - Code Development Activity
interface CodeChangeCommitsOptions {
  // a filter regular expression for commit message
  messageFilter: '^(build:|chore:|ci:|docs:|feat:|fix:|perf:|refactor:|revert:|style:|test:).*' | string;
}
export const chaossCodeChangeCommits = async (config: QueryConfig<CodeChangeCommitsOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PushEvent' "];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'commits_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT(arrayJoin(${config.options?.messageFilter ? `arrayFilter(x -> match(x, '${config.options.messageFilter}'), push_commits.message)` : 'push_commits.message'})) AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'commits_count')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['count']);
};

interface CodeChangeLinesOptions {
  by: 'add' | 'remove' | 'sum';
}
export const chaossCodeChangeLines = async (config: QueryConfig<CodeChangeLinesOptions>) => {
  config = getMergedConfig(config);
  const by = filterEnumType(config.options?.by, ['add', 'remove', 'sum'], 'add');
  const whereClauses: string[] = ["type = 'PullRequestEvent' "];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'code_change_lines', value: 'lines' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
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
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'lines')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'code_change_lines')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['lines']);
};

// Evolution - Issue Resolution
export const chaossIssuesNew = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent' AND action IN ('opened', 'reopened')"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClause(config, { key: 'issues_new_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, platform, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'issues_new_count')}`;

  const result: any = await clickhouse.query(sql);
  const ret = processQueryResult(result, ['total_count', 'count']);
  ret.forEach(i => i.ratio = i.count.map(v => `${(v * 100 / i.total_count).toPrecision(2)}%`));
  return ret;
};

export const chaossIssuesAndChangeRequestActive = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent')"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'active_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT(DISTINCT issue_number) AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, platform, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'active_count')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['count']);
};

export const chaossIssuesClosed = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssuesEvent' AND action = 'closed'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClause(config, { key: 'issues_close_count', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, platform, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'issues_close_count')}`;

  const result: any = await clickhouse.query(sql);
  const ret = processQueryResult(result, ['total_count', 'count']);
  ret.forEach(i => i.ratio = i.count.map(v => `${(v * 100 / i.total_count).toPrecision(2)}%`));
  return ret;
};

interface ResolutionDurationOptions extends TimeDurationOption {
  by: 'open' | 'close';
}
const chaossResolutionDuration = async (config: QueryConfig<ResolutionDurationOptions>, type: 'issue' | 'change request') => {
  config = getMergedConfig(config);
  const whereClauses: string[] = type === 'issue' ? ["type = 'IssuesEvent'"] : ["type = 'PullRequestEvent'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);

  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month

  const by = filterEnumType(config.options?.by, ['open', 'close'], 'open');
  const byCol = by === 'open' ? 'opened_at' : 'closed_at';
  const unit = filterEnumType(config.options?.unit, timeDurationConstants.unitArray, 'day');
  const thresholds = config.options?.thresholds ?? [3, 7, 15];
  const ranges = [...thresholds, -1];
  const sortBy = filterEnumType(config.options?.sortBy, timeDurationConstants.sortByArray, 'avg');

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time),
  ${getGroupArrayInsertAtClause(config, { key: `avg`, defaultValue: 'NaN' })},
  ${getGroupArrayInsertAtClause(config, { key: 'levels', value: 'resolution_levels', defaultValue: `[]`, noPrecision: true })},
  ${timeDurationConstants.quantileArray.map(q => getGroupArrayInsertAtClause(config, { key: `quantile_${q}`, defaultValue: 'NaN' })).join(',')}
FROM
(
  SELECT
    ${getGroupTimeClause(config, byCol)},
    ${getGroupIdClause(config, 'repo', 'last_active')},
    avg(resolution_duration) AS avg,
    ${timeDurationConstants.quantileArray.map(q => `quantile(${q / 4})(resolution_duration) AS quantile_${q}`).join(',')},
    [${ranges.map((_t, i) => `countIf(resolution_level = ${i})`).join(',')}] AS resolution_levels
  FROM
  (
    SELECT
      platform,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      max(created_at) AS last_active,
      argMaxIf(action, created_at, action IN ('opened', 'closed' , 'reopened')) AS last_action,
      argMax(issue_created_at,created_at) AS opened_at,
      maxIf(created_at, action = 'closed') AS closed_at,
      dateDiff('${unit}', opened_at, closed_at) AS resolution_duration,
      multiIf(${thresholds.map((t, i) => `resolution_duration <= ${t}, ${i}`)}, ${thresholds.length}) AS resolution_level
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number, platform
    HAVING ${byCol} >= toDate('${config.startYear}-${config.startMonth}-1') AND ${byCol} < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1') AND last_action='closed'
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'resolution_duration')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, sortBy, sortBy === 'levels' ? 1 : undefined)}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']);
};

export const chaossIssueResolutionDuration = (config: QueryConfig<ResolutionDurationOptions>) =>
  chaossResolutionDuration(config, 'issue');

export const chaossChangeRequestResolutionDuration = (config: QueryConfig<ResolutionDurationOptions>) =>
  chaossResolutionDuration(config, 'change request');

const chaossResponseTime = async (config: QueryConfig<TimeDurationOption>, type: 'issue' | 'change request') => {
  config = getMergedConfig(config);
  const whereClauses: string[] = type === 'issue' ? ["type IN ('IssueCommentEvent', 'IssuesEvent') AND actor_login NOT LIKE '%[bot]'"] : ["type IN ('IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent', 'PullRequestReviewEvent') AND actor_login NOT LIKE '%[bot]'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month  
  const unit = filterEnumType(config.options?.unit, timeDurationConstants.unitArray, 'day');
  const thresholds = config.options?.thresholds ?? [3, 7, 15];
  const ranges = [...thresholds, -1];
  const sortBy = filterEnumType(config.options?.sortBy, timeDurationConstants.sortByArray, 'avg');

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time),
  ${getGroupArrayInsertAtClause(config, { key: `avg`, defaultValue: 'NaN' })},
  ${getGroupArrayInsertAtClause(config, { key: 'levels', value: 'response_levels', defaultValue: `[]`, noPrecision: true })},
  ${timeDurationConstants.quantileArray.map(q => getGroupArrayInsertAtClause(config, { key: `quantile_${q}`, defaultValue: 'NaN' })).join(',')}
FROM
(
  SELECT
    ${getGroupTimeClause(config, 'issue_created_at')},
    ${getGroupIdClause(config, 'repo', 'last_active')},
    avg(response_time) AS avg,
    ${timeDurationConstants.quantileArray.map(q => `quantile(${q / 4})(response_time) AS quantile_${q}`).join(',')},
    [${ranges.map((_t, i) => `countIf(response_level = ${i})`).join(',')}] AS response_levels
  FROM
  (
    SELECT
      platform,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      max(created_at) AS last_active,
      minIf(created_at, action = 'opened' AND issue_comments = 0) AS issue_created_at,
      minIf(created_at, (action = 'created' AND actor_id != issue_author_id) OR (action = 'closed')) AS responded_at,
      if(responded_at = toDate('1970-01-01'), now(), responded_at) AS first_responded_at,
      dateDiff('${unit}', issue_created_at, first_responded_at) AS response_time,
      multiIf(${thresholds.map((t, i) => `response_time <= ${t}, ${i}`)}, ${thresholds.length}) AS response_level
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number, platform
    HAVING issue_created_at >= toDate('${config.startYear}-${config.startMonth}-1') 
             AND issue_created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1')
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'response_time')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, sortBy, sortBy === 'levels' ? 1 : undefined)}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']);
};

export const chaossIssueResponseTime = (config: QueryConfig<TimeDurationOption>) => chaossResponseTime(config, 'issue');

export const chaossChangeRequestResponseTime = (config: QueryConfig<TimeDurationOption>) =>
  chaossResponseTime(config, 'change request');

export const chaossAge = async (config: QueryConfig<TimeDurationOption>, type: 'issue' | 'change request') => {
  config = getMergedConfig(config);
  const whereClauses: string[] = type === 'issue' ? ["type='IssuesEvent'"] : ["type='PullRequestEvent'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month
  const endTimeClause = `toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1')`;
  whereClauses.push(`created_at < ${endTimeClause}`);
  const unit = filterEnumType(config.options?.unit, timeDurationConstants.unitArray, 'day');
  const thresholds = config.options?.thresholds ?? [15, 30, 60];
  const ranges = [...thresholds, -1];
  const sortBy = filterEnumType(config.options?.sortBy, timeDurationConstants.sortByArray, 'avg');

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time),
  ${getGroupArrayInsertAtClause(config, { key: `avg`, defaultValue: 'NaN', positionByEndTime: true })},
  ${getGroupArrayInsertAtClause(config, { key: 'levels', value: 'if(arrayAll(x -> x = 0, age_levels), [], age_levels)', defaultValue: `[]`, noPrecision: true, positionByEndTime: true })},
  ${timeDurationConstants.quantileArray.map(q => getGroupArrayInsertAtClause(config, { key: `quantile_${q}`, defaultValue: 'NaN', positionByEndTime: true })).join(',')}
FROM
(
  SELECT
    ${(() => {
      if (config.groupTimeRange) {
        return `arrayJoin(arrayMap(x -> dateAdd(${config.groupTimeRange}, x + 1, toDate('${config.startYear}-${config.startMonth}-1')), range(toUInt64(dateDiff('${config.groupTimeRange}', toDate('${config.startYear}-${config.startMonth}-1'), ${endTimeClause}))))) AS time`;
      } else {
        return `${endTimeClause} AS time`;
      }
    })()},
    ${getGroupIdClause(config, 'repo', 'last_active')},
    avgIf(dateDiff('${unit}', opened_at, time), opened_at < time AND closed_at >= time) AS avg,
    ${timeDurationConstants.quantileArray.map(q => `quantileIf(${q / 4})(dateDiff('${unit}', opened_at, time), opened_at < time AND closed_at >= time) AS quantile_${q}`).join(',')},
    [${ranges.map((_t, i) => `countIf(multiIf(${thresholds.map((t, i) => `dateDiff('${unit}', opened_at, time) <= ${t}, ${i}`)}, ${thresholds.length}) = ${i} AND opened_at < time AND closed_at >= time)`).join(',')}] AS age_levels
  FROM
  (
    SELECT
      platform,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      max(created_at) AS last_active,
      minIf(created_at, action = 'opened') AS opened_at,
      maxIf(created_at, action = 'closed') AS real_closed_at,
      if(real_closed_at=toDate('1970-1-1'), ${endTimeClause}, real_closed_at) AS closed_at
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number, platform
    HAVING opened_at > toDate('1970-01-01')
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'age')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, sortBy, sortBy === 'levels' ? 1 : undefined)}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']);
};

export const chaossIssueAge = (config: QueryConfig<TimeDurationOption>) => chaossAge(config, 'issue');

export const chaossChangeRequestAge = (config: QueryConfig<TimeDurationOption>) => chaossAge(config, 'change request');

// Evolution - Code Development Efficiency
export const chaossChangeRequestsAccepted = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClause(config, { key: 'change_requests_accepted', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'change_requests_accepted')}`;

  const result: any = await clickhouse.query(sql);
  const ret = processQueryResult(result, ['total_count', 'count']);
  ret.forEach(i => i.ratio = i.count.map(v => `${(v * 100 / i.total_count).toPrecision(2)}%`));
  return ret;
};

export const chaossChangeRequestsDeclined = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 0"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  SUM(count) AS total_count,
  ${getGroupArrayInsertAtClause(config, { key: 'change_requests_declined', value: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'change_requests_declined')}`;

  const result: any = await clickhouse.query(sql);
  const ret = processQueryResult(result, ['total_count', 'count']);
  ret.forEach(i => i.ratio = i.count.map(v => `${(v * 100 / i.total_count).toPrecision(2)}%`));
  return ret;
};

interface ChangeRequestsDurationOptions extends TimeDurationOption {
  by: 'open' | 'close';
}
export const chaossChangeRequestsDuration = async (config: QueryConfig<ChangeRequestsDurationOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND pull_merged = 1"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);

  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month

  const by = filterEnumType(config.options?.by, ['open', 'close'], 'open');
  const byCol = by === 'open' ? 'opened_at' : 'closed_at';
  const unit = filterEnumType(config.options?.unit, timeDurationConstants.unitArray, 'day');
  const thresholds = config.options?.thresholds ?? [3, 7, 15];
  const ranges = [...thresholds, -1];
  const sortBy = filterEnumType(config.options?.sortBy, timeDurationConstants.sortByArray, 'avg');

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time),
  ${getGroupArrayInsertAtClause(config, { key: `avg`, defaultValue: 'NaN' })},
  ${getGroupArrayInsertAtClause(config, { key: 'levels', value: 'resolution_levels', defaultValue: `[]`, noPrecision: true })},
  ${timeDurationConstants.quantileArray.map(q => getGroupArrayInsertAtClause(config, { key: `quantile_${q}`, defaultValue: 'NaN' })).join(',')}
FROM
(
  SELECT
    ${getGroupTimeClause(config, byCol)},
    ${getGroupIdClause(config, 'repo', 'last_active')},
    avg(resolution_duration) AS avg,
    ${timeDurationConstants.quantileArray.map(q => `quantile(${q / 4})(resolution_duration) AS quantile_${q}`).join(',')},
    [${ranges.map((_t, i) => `countIf(resolution_level = ${i})`).join(',')}] AS resolution_levels
  FROM
  (
    SELECT
      platform,
      repo_id,
      argMax(repo_name, created_at) AS repo_name,
      org_id,
      argMax(org_login, created_at) AS org_login,
      issue_number,
      max(created_at) AS last_active,
      argMaxIf(action, created_at, action IN ('opened', 'closed' , 'reopened')) AS last_action,
      argMax(issue_created_at,created_at) AS opened_at,
      maxIf(created_at, action = 'closed') AS closed_at,
      dateDiff('${unit}', opened_at, closed_at) AS resolution_duration,
      multiIf(${thresholds.map((t, i) => `resolution_duration <= ${t}, ${i}`)}, ${thresholds.length}) AS resolution_level
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY repo_id, org_id, issue_number, platform
    HAVING ${byCol} >= toDate('${config.startYear}-${config.startMonth}-1') AND ${byCol} < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1') AND last_action='closed'
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'resolution_duration')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, sortBy, sortBy === 'levels' ? 1 : undefined)}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']);
};

export const chaossChangeRequestsAcceptanceRatio = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' "];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));
  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'change_requests_accepted_ratio', value: 'ratio' })},
  ${getGroupArrayInsertAtClause(config, { key: 'change_requests_accepted', value: 'accepted_count' })},
  ${getGroupArrayInsertAtClause(config, { key: 'change_requests_declined', value: 'declined_count' })}

FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count,
    countIf(pull_merged = 1) AS accepted_count,
    countIf(pull_merged = 0) AS declined_count,
    accepted_count/count AS ratio
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'ratio')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'change_requests_accepted_ratio')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['ratio', 'accepted_count', 'declined_count']);
};

// Evolution - Code Development Process Quality
export const chaossChangeRequests = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'opened'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'count')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['count']);
}

export const chaossChangeRequestReviews = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestReviewCommentEvent'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'count' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    COUNT() AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'count')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['count']);
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
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  platform,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'bus_factor', })},
  ${getGroupArrayInsertAtClause(config, { key: 'detail', noPrecision: true, defaultValue: '[]' })},
  ${getGroupArrayInsertAtClause(config, { key: 'total_contributions' })}
FROM
(
  SELECT
    time,
    id,
    ${getTopLevelPlatform(config)},
    any(name) AS name,
    SUM(count) AS total_contributions,
    length(detail) AS bus_factor,
    arrayFilter(x -> tupleElement(x, 2) >= quantileExactWeighted(${config.options?.percentage ? (1 - config.options.percentage).toString() : '0.5'})(count, count), arrayMap((x, y) -> (x, y), groupArray(${by === 'activity' ? 'actor_login' : 'author'}), groupArray(count))) AS detail
  FROM
  (
    SELECT
      ${getGroupTimeClause(config)},
      ${getGroupIdClause(config)},
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
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    ${getInnerGroupBy(config)}, ${by === 'commit' ? 'author' : 'actor_id'}
    ${(config.options?.withBot && by !== 'commit') ? '' : "HAVING " + (by === 'activity' ? 'actor_login' : 'author') + " NOT LIKE '%[bot]'"}
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'bus_factor')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'bus_factor')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['bus_factor', 'detail', 'total_contributions']);
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
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  const sql = `
  SELECT
    id,
    ${getTopLevelPlatform(config)},
    argMax(name, time) AS name,
    ${getGroupArrayInsertAtClause(config, { key: 'new_contributors', value: 'new_contributor' })},
    ${getGroupArrayInsertAtClause(config, { key: 'detail', noPrecision: true, defaultValue: '[]' })},
    SUM(new_contributor) AS total_new_contributors
  FROM
  (
    SELECT
      ${getGroupTimeClause(config, 'first_time')},
      ${getGroupIdClause(config, 'repo', 'last_active')},
      length(detail) AS new_contributor,
      (arrayMap((x) -> (x), groupArray(author))) AS detail
    FROM
    (
      SELECT
        platform,
        min(created_at) AS first_time,
        repo_id,
        argMax(repo_name, created_at) AS repo_name,
        org_id,
        argMax(org_login, created_at) AS org_login,
        max(created_at) AS last_active,
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
            platform,
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
          FROM events
          WHERE ${whereClauses.join(' AND ')}
          ${(config.options?.withBot && by !== 'commit') ? '' : "HAVING author NOT LIKE '%[bot]'"}
        )
      GROUP BY platform, repo_id, org_id, ${by === 'commit' ? 'author' : 'actor_id'}
      HAVING first_time >= toDate('${config.startYear}-${config.startMonth}-1') AND first_time < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1')
    )
    ${getInnerGroupBy(config)}
    ${getInnerOrderAndLimit(config, 'new_contributor')}
  )
  GROUP BY id, platform
  ${getOutterOrderAndLimit(config, 'new_contributors')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['new_contributors', 'detail']);
}

export const chaossContributors = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'contributors_count', value: 'count' })},
  ${getGroupArrayInsertAtClause(config, { key: 'detail', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT
    ${getGroupTimeClause(config)},
    ${getGroupIdClause(config)},
    groupArray(DISTINCT(issue_author_login)) AS detail,
    COUNT(DISTINCT issue_author_id) AS count
  FROM events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, platform, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'contributors_count')}`;

  const result: any = await clickhouse.query(sql);
  const ret = processQueryResult(result, ['count', 'detail']);
  return ret;
}

interface InactiveContributorsOptions {
  // time interval to determine inactive contributor, default: 6
  timeInterval: number;
  // time interval unit, default: month
  timeIntervalUnit: string;
  // determine contributor by commit or by change request
  by: 'commit' | 'change request';
  // min count of contributions to determine inactive contributor
  minCount: number;
  withBot: boolean;
}
export const chaossInactiveContributors = async (config: QueryConfig<InactiveContributorsOptions>) => {
  config = getMergedConfig(config);
  const by = filterEnumType(config.options?.by, ['commit', 'change request'], 'change request');
  const timeInterval = config.options?.timeInterval ?? 6;
  const timeIntervalUnit = filterEnumType(config.options?.timeIntervalUnit, ['month', 'quarter', 'year'], 'month');
  const minCount = config.options?.minCount ?? 0;
  const whereClauses: string[] = [];
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month
  const endTimeClause = `toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1')`;
  if (by === 'commit') {
    whereClauses.push("type = 'PushEvent'")
  } else if (by === 'change request') {
    whereClauses.push("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1");
  }
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(`created_at < ${endTimeClause}`);

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'inactive_contributors', positionByEndTime: true })},
  ${getGroupArrayInsertAtClause(config, { key: 'detail', noPrecision: true, defaultValue: '[]', positionByEndTime: true })}
FROM
(
  SELECT
    id,
    platform,
    argMax(name, time) AS name,
    time,
    countIf(first_time < time AND contributions <= ${minCount}) AS inactive_contributors,
    groupArrayIf(author, first_time < time AND contributions <= ${minCount}) AS detail
  FROM
  (
    SELECT
      ${(() => {
      if (config.groupTimeRange) {
        return `arrayJoin(arrayMap(x -> dateAdd(${config.groupTimeRange}, x + 1, toDate('${config.startYear}-${config.startMonth}-1')), range(toUInt64(dateDiff('${config.groupTimeRange}', toDate('${config.startYear}-${config.startMonth}-1'), ${endTimeClause}))))) AS time`
      } else {
        return `${endTimeClause} AS time`
      }
    })()},
      ${getGroupIdClause(config)},
      ${by === 'commit' ? 'author' : 'actor_id, argMax(author, created_at) AS author'},
      min(created_at) AS first_time,
      countIf(created_at >= dateSub(${timeIntervalUnit}, ${timeInterval}, time) AND created_at <= time) AS contributions
    FROM
    (
      SELECT
        platform,
        repo_id,
        repo_name,
        org_id,
        org_login,
        ${by === 'commit' ? 'arrayJoin(push_commits.name) AS author' :
      'issue_author_id AS actor_id, issue_author_login AS author'},
        created_at
      FROM events
      WHERE ${whereClauses.join(' AND ')}
      ${(config.options?.withBot && by !== 'commit') ? '' : "HAVING author NOT LIKE '%[bot]'"}
    )
    GROUP BY id, platform, ${by === 'commit' ? 'author' : 'actor_id'}, time
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'inactive_contributors')}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'inactive_contributors')}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['inactive_contributors', 'detail']);
}

interface ActiveDatesAndTimesOptions {
  // normalize the results by this option as max value
  normalize?: number;
}
export const chaossActiveDatesAndTimes = async (config: QueryConfig<ActiveDatesAndTimesOptions>, type: 'user' | 'repo') => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [getTimeRangeWhereClause(config)];
  if (type === 'user') {
    const userWhereClause = await getUserWhereClause(config);
    if (userWhereClause) whereClauses.push(userWhereClause);
  } else if (type === 'repo') {
    const repoWhereClause = await getRepoWhereClause(config);
    if (repoWhereClause) whereClauses.push(repoWhereClause);
  } else {
    throw new Error(`Not supported type: ${type}`);
  }

  const sql = `
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'count', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT platform, id, argMax(name, time) AS name, time, arrayMap(x -> ${config.options?.normalize ? `round(x*${config.options.normalize}/max(count))` : 'x'}, groupArrayInsertAt(0, 168)(count, toUInt32((day - 1) * 24 + hour))) AS count
  FROM
  (
    SELECT
      ${getGroupTimeClause(config)},
      ${getGroupIdClause(config, type)},
      toHour(created_at) AS hour,
      toDayOfWeek(created_at) AS day,
      COUNT() AS count
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, platform, time, hour, day
    ORDER BY day, hour
  )
  ${getInnerGroupBy(config)}
  ${getInnerOrderAndLimit(config, 'count', 1)}
)
GROUP BY id, platform
${getOutterOrderAndLimit(config, 'count', 1)}`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['count']);
}
