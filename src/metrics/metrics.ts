import {
  getGroupArrayInsertAtClause,
  getGroupTimeClause,
  getGroupIdClause,
  getInnerOrderAndLimit,
  getMergedConfig,
  getOutterOrderAndLimit,
  getRepoWhereClause,
  getTimeRangeWhereClause,
  getUserWhereClause,
  QueryConfig,
  processQueryResult,
  getTopLevelPlatform,
  getInnerGroupBy,
  getWithClause
} from "./basic";
import * as clickhouse from '../db/clickhouse';

export const repoStars = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'WatchEvent'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
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

export const repoIssueComments = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type = 'IssueCommentEvent' AND action = 'created'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
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

export const repoCount = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
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
    COUNT(DISTINCT repo_id) AS count
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

export const repoParticipants = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
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
    COUNT(DISTINCT actor_id) AS count
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

interface EquivalentTimeZoneOptions {
  // how many hours to accumulate the activity, default to 12
  continousHours: number;
  // what is the start time of the local working hour, default to 9
  startHour: number;
}
export const userEquivalentTimeZone = async (config: QueryConfig<EquivalentTimeZoneOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [getTimeRangeWhereClause(config)];
  const userWhereClause = await getUserWhereClause(config);
  if (userWhereClause) whereClauses.push(userWhereClause);
  const continousHours = config.options?.continousHours ?? 12;
  const startHour = config.options?.startHour ?? 9;

  /*
   * The procedure is
   * - Accumulate the users' event data for a certain time period and collect as 0am - 23pm in UTC time.
   * - Find out the maximum cumulative active value of ${continousHour} hours continuous interval
   * - Assume the hours should be started at ${startHour} in the local time zone for the user.
   * - Calculate the time zone of the user.
   * The procedure will return `13` which is an invalid result for time period without data
   */
  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'time_zone', defaultValue: '13', noPrecision: true })}
FROM
(
  SELECT
    id,
    platform,
    anyHeavy(name) AS name,
    time,
    groupArrayInsertAt(0, 24)(count, hour) AS arr,
    arraySort(x -> -x[2], arrayMap(h -> [h, if(h <= ${continousHours + 1}, arraySum(arraySlice(arr, h, ${continousHours})), arraySum(arrayConcat(arraySlice(arr, h), arraySlice(arr, 1, h - ${continousHours + 1}))))], range(1, 25)))[1][1] - 1 AS maxHour,
    if(maxHour > ${startHour + 12}, ${startHour} + 24 - maxHour, ${startHour} - maxHour) AS time_zone
  FROM
  (
    SELECT
      ${getGroupTimeClause(config)},
      ${getGroupIdClause(config, 'user')},
      toHour(created_at) AS hour,
      COUNT() AS count
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, platform, time, hour
    ORDER BY hour
  )
  ${getInnerGroupBy(config)}
)
GROUP BY id, platform`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['time_zone']);
};

export const contributorEmailSuffixes = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = ["type='PushEvent'"];
  const repoWhereClause = await getRepoWhereClause(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);
  whereClauses.push(getTimeRangeWhereClause(config));

  const sql = `
${getWithClause(config)}
SELECT
  id,
  ${getTopLevelPlatform(config)},
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClause(config, { key: 'suffixes', noPrecision: true, defaultValue: '[]' })}
FROM
(
  SELECT
    time, id, argMax(name, time) AS name, ${(config.groupBy && config.groupBy !== 'org' && config.groupBy !== 'repo') ? '' : 'platform, '}
    groupArray(DISTINCT suffix) AS distinct_suffixes,
    arraySort(x -> -tupleElement(x, 2), arrayZip(distinct_suffixes, arrayMap(s -> length(arrayFilter(x -> x = s, groupArray(suffix))), distinct_suffixes))) AS suffixes
  FROM
  (
    SELECT
      ${getGroupTimeClause(config)},
      ${getGroupIdClause(config)},
      anyHeavy(arrayJoin(arrayMap(x -> splitByChar('@', x)[2], push_commits.email))) AS suffix,
      arrayJoin(push_commits.name) AS author
    FROM events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY platform, repo_id, org_id, author, time
  )
  ${getInnerGroupBy(config)}
)
GROUP BY id, platform`;

  const result: any = await clickhouse.query(sql);
  return processQueryResult(result, ['suffixes']);
}
