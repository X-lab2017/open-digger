import {
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeClauseForClickhouse,
  getGroupIdClauseForClickhouse,
  getInnerOrderAndLimit,
  getMergedConfig,
  getOutterOrderAndLimit,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  getUserWhereClauseForClickhouse,
  QueryConfig
} from "./basic";
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
    ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config)},
    COUNT() AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'count')}`;

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
    ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config)},
    COUNT() AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'count')}`;

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
    ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config)},
    COUNT(DISTINCT actor_id) AS count
  FROM gh_events
  WHERE ${whereClauses.join(' AND ')}
  GROUP BY id, time
  ${getInnerOrderAndLimit(config, 'count')}
)
GROUP BY id
${getOutterOrderAndLimit(config, 'count')}`;

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

interface EquivalentTimeZoneOptions {
  // how many hours to accumulate the activity, default to 12
  continousHours: number;
  // what is the start time of the local working hour, default to 9
  startHour: number;
}
export const userEquivalentTimeZone = async (config: QueryConfig<EquivalentTimeZoneOptions>) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [getTimeRangeWhereClauseForClickhouse(config)];
  const userWhereClause = await getUserWhereClauseForClickhouse(config);
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
SELECT
  id,
  argMax(name, time) AS name,
  ${getGroupArrayInsertAtClauseForClickhouse(config, { key: 'time_zone', defaultValue: '13', noPrecision: true })}
FROM
(
  SELECT
    id,
    anyHeavy(name) AS name,
    time,
    groupArrayInsertAt(0, 24)(count, hour) AS arr,
    arraySort(x -> -x[2], arrayMap(h -> [h, if(h <= ${continousHours + 1}, arraySum(arraySlice(arr, h, ${continousHours})), arraySum(arrayConcat(arraySlice(arr, h), arraySlice(arr, 1, h - ${continousHours + 1}))))], range(1, 25)))[1][1] - 1 AS maxHour,
    if(maxHour > ${startHour + 12}, ${startHour} + 24 - maxHour, ${startHour} - maxHour) AS time_zone
  FROM
  (
    SELECT
      ${getGroupTimeClauseForClickhouse(config)},
    ${getGroupIdClauseForClickhouse(config, 'user')},
      toHour(created_at) AS hour,
      COUNT() AS count
    FROM gh_events
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY id, time, hour
    ORDER BY hour
  )
  GROUP BY id, time
)
GROUP BY id`;

  const result: any = await clickhouse.query(sql);
  return result.map(row => {
    const [id, name, time_zone] = row;
    return {
      id,
      name,
      time_zone,
    }
  });
};
