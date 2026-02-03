import { query } from "../db/clickhouse";
import { forEveryMonth } from "../metrics/basic";
import { basicActivitySqlComponent } from "../metrics/indices";
import { getLogger } from "../utils";

const logger = getLogger('ImportNormalizedCommunityOpenrank');
const importNormalizedCommunityOpenrank = async () => {
  // The normalized_community_openrank view is used to store the normalized community openrank info for the all repos
  // The normalized_community_openrank is calculated by the community openrank and the global openrank
  // The normalized_community_openrank uses activity instead of community openrank if it is not calculated
  // await query(`DROP TABLE IF EXISTS normalized_community_openrank`);
  // await query(`DROP TABLE IF EXISTS normalized_community_openrank_with_bot`);
  await query(`CREATE TABLE IF NOT EXISTS normalized_community_openrank
    (
       platform LowCardinality(String),
       repo_id UInt64,
       repo_name LowCardinality(String),
       org_id UInt64,
       org_login LowCardinality(String),
       actor_id UInt64,
       actor_login LowCardinality(String),
       openrank Float,
       yyyymm UInt32,
       created_at DateTime
    )
    ENGINE = MergeTree()
    ORDER BY (repo_id, platform)`);
  await query(`CREATE TABLE IF NOT EXISTS normalized_community_openrank_with_bot
    (
       platform LowCardinality(String),
       repo_id UInt64,
       repo_name LowCardinality(String),
       org_id UInt64,
       org_login LowCardinality(String),
       actor_id UInt64,
       actor_login LowCardinality(String),
       openrank Float,
       is_bot UInt8,
       yyyymm UInt32,
       created_at DateTime
    )
    ENGINE = MergeTree()
    ORDER BY (repo_id, platform)`);
  const maxYyyymm = await query(`SELECT MAX(yyyymm) FROM normalized_community_openrank`);
  let maxYyyymmValue: number = 201012;
  if (maxYyyymm.length > 0 && maxYyyymm[0] !== null && maxYyyymm[0][0] !== null && maxYyyymm[0][0] !== 0) {
    maxYyyymmValue = +maxYyyymm[0][0];
  }
  const minYear = Math.floor(maxYyyymmValue / 100);
  const minMonth = maxYyyymmValue % 100;
  const startDate = new Date(minYear, minMonth - 1, 1);
  startDate.setMonth(startDate.getMonth() + 1);
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const endYear = lastMonth.getFullYear();
  const endMonth = lastMonth.getMonth() + 1;
  logger.info(`Import normalized community openrank from ${startYear}-${startMonth} to ${endYear}-${endMonth}`);
  await forEveryMonth(startYear, startMonth, endYear, endMonth, async (y, m) => {
    const yyyymm = y.toString() + m.toString().padStart(2, '0');
    await query(`INSERT INTO normalized_community_openrank
    SELECT platform, repo_id, repo_name, org_id, org_login, actor_id, actor_login, openrank, yyyymm, created_at FROM
    (
      SELECT
        g.platform,
        g.repo_id,
        g.repo_name,
        g.org_id,
        g.org_login,
        g.created_at,
        arrayJoin(arrayMap(x -> tuple(x.1, x.2, g.openrank * x.3 / gor), c.gor_details)) AS openrank_arr,
        openrank_arr.1 AS actor_id,
        openrank_arr.2 AS actor_login,
        openrank_arr.3 AS openrank,
        toYYYYMM(c.created_at) AS yyyymm
      FROM
      (SELECT platform, repo_id, repo_name, org_id, org_login, openrank, created_at
        FROM global_openrank WHERE type = 'Repo' AND toYYYYMM(created_at) = ${yyyymm}) g
      INNER JOIN
      ((SELECT repo_id, platform, SUM(openrank) AS gor, groupArray(tuple(actor_id, actor_login, openrank)) AS gor_details, created_at
        FROM community_openrank WHERE toYYYYMM(created_at) = ${yyyymm} AND actor_id > 0 AND actor_login NOT LIKE '%[bot]' AND
        (platform, actor_id) NOT IN (SELECT platform, entity_id FROM flatten_labels WHERE id = ':bot' AND entity_type = 'User')
        GROUP BY repo_id, platform, created_at)
        UNION ALL
        (SELECT repo_id, platform, SUM(activity) AS gor, groupArray(tuple(actor_id, actor_login, activity)) AS gor_details, m AS created_at
        FROM (
          SELECT repo_id, platform, ${basicActivitySqlComponent}, toStartOfMonth(created_at) AS m
          FROM events WHERE
          toYYYYMM(created_at) = ${yyyymm} AND
          (platform, actor_id) NOT IN (SELECT platform, entity_id FROM flatten_labels WHERE id = ':bot' AND entity_type = 'User')
          AND type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')
          AND (repo_id, platform) NOT IN (SELECT id, platform FROM export_repo)
          GROUP BY repo_id, platform, actor_id, m
          HAVING actor_login NOT LIKE '%[bot]'
        )
        GROUP BY repo_id, platform, created_at)
      ) c
      ON g.repo_id = c.repo_id AND g.created_at = c.created_at AND g.platform = c.platform
      WHERE openrank > 0
    )`);
    await query(`INSERT INTO normalized_community_openrank_with_bot
    SELECT platform, repo_id, repo_name, org_id, org_login, actor_id, actor_login, openrank, 
    if(actor_login LIKE '%[bot]' OR (platform, actor_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE id = ':bot' AND entity_type = 'User'), 1, 0) AS is_bot,
    yyyymm, created_at FROM
    (
      SELECT
        g.platform,
        g.repo_id,
        g.repo_name,
        g.org_id,
        g.org_login,
        g.created_at,
        arrayJoin(arrayMap(x -> tuple(x.1, x.2, g.openrank * x.3 / gor), c.gor_details)) AS openrank_arr,
        openrank_arr.1 AS actor_id,
        openrank_arr.2 AS actor_login,
        openrank_arr.3 AS openrank,
        toYYYYMM(c.created_at) AS yyyymm
      FROM
      (SELECT platform, repo_id, repo_name, org_id, org_login, openrank, created_at
        FROM global_openrank WHERE type = 'Repo' AND toYYYYMM(created_at) = ${yyyymm}) g
      INNER JOIN
      (SELECT repo_id, platform, SUM(openrank) AS gor, groupArray(tuple(actor_id, actor_login, openrank)) AS gor_details, created_at
        FROM community_openrank WHERE toYYYYMM(created_at) = ${yyyymm} AND actor_id > 0
        GROUP BY repo_id, platform, created_at) c
      ON g.repo_id = c.repo_id AND g.created_at = c.created_at AND g.platform = c.platform
      WHERE openrank > 0
      )`);
    logger.info(`Import normalized community openrank for ${yyyymm} done.`);
  });
  logger.info('Import normalized community openrank done.');
};

(async () => {
  await importNormalizedCommunityOpenrank();
})();
