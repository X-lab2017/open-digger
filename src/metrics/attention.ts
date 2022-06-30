import {
  getGroupArrayInsertAtClauseForClickhouse,
  getGroupTimeAndIdClauseForClickhouse,
  getMergedConfig,
  getRepoWhereClauseForClickhouse,
  getTimeRangeWhereClauseForClickhouse,
  QueryConfig } from "./basic";
import * as clickhouse from '../db/clickhouse';

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
  ${config.limit > 0 ? `ORDER BY attention DESC LIMIT ${config.limit} BY time` : ''}
)
GROUP BY id
ORDER BY attention[-1] ${config.order}
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
