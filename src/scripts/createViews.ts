import { query } from "../db/clickhouse";
import { basicActivitySqlComponent } from "../metrics/indices";

(async () => {
  const createUserView = async () => {
    // The user view is used to store the user info for the users
    // The user view is refreshed every 3 hours
    // The user view uses user info from API and location info to generate the user info
    await query(`DROP TABLE IF EXISTS user_info`);
    const createViewQuery = `
CREATE MATERIALIZED VIEW IF NOT EXISTS user_info
REFRESH EVERY 3 HOUR
(
    \`platform\` LowCardinality(String),
    \`id\` UInt64,
    \`login\` String,
    \`bio\` String,
    \`email\` String,
    \`name\` String,
    \`company\` String,
    \`twitter_username\` String,
    \`location\` String,
    \`country_id\` LowCardinality(String),
    \`country\` LowCardinality(String),
    \`country_zh\` LowCardinality(String),
    \`province_id\` LowCardinality(String),
    \`province\` LowCardinality(String),
    \`province_zh\` LowCardinality(String),
    \`city\` String
)
ENGINE = MergeTree()
ORDER BY (id, platform)
POPULATE
AS
WITH 
country_labels AS (
    SELECT 
        id,
        name,
        name_zh,
        data,
        children,
        arrayJoin(arrayDistinct(arrayConcat((CASE 
            WHEN data != '' AND JSONHas(data, 'includes') 
            THEN arrayMap(x -> lower(x), JSONExtract(data, 'includes', 'Array(String)'))
            ELSE []
        END), [lower(name), lower(name_zh)]))) AS includes_lower
    FROM labels 
    WHERE type = 'Division-0'
),
province_labels AS (
    SELECT 
        pl.id,
        pl.name,
        pl.name_zh,
        pl.data,
        cl.id AS parent_country_id,
        arrayJoin(arrayDistinct(arrayConcat((CASE 
            WHEN data != '' AND JSONHas(data, 'includes') 
            THEN arrayMap(x -> lower(x), JSONExtract(data, 'includes', 'Array(String)'))
            ELSE []
        END), [lower(name), lower(name_zh)]))) AS includes_lower
    FROM labels pl
    CROSS JOIN labels cl
    WHERE pl.type = 'Division-1' 
      AND cl.type = 'Division-0'
      AND has(cl.children, pl.id)
)
SELECT 
    'GitHub' AS platform, 
    gu.id AS id,
    argMax(go.actor_login, go.created_at) AS login,
    argMax(gu.bio, gu.updated_at) AS bio,
    argMax(gu.email, gu.updated_at) AS email,
    argMax(gu.name, gu.updated_at) AS name,
    argMax(gu.company, gu.updated_at) AS company,
    argMax(gu.twitter_username, gu.updated_at) AS twitter_username,
    any(l.location) AS location,
    any(l.country_id) AS country_id,
    any(l.country) AS country,
    any(l.country_zh) AS country_zh,
    any(l.province_id) AS province_id,
    any(l.province) AS province,
    any(l.province_zh) AS province_zh,
    any(l.city) AS city
FROM 
    gh_user_info gu
LEFT JOIN 
    global_openrank go ON gu.id = go.actor_id
LEFT JOIN 
    (
  SELECT 
    li.location AS location,
    if(li.country IN ['Macao', 'Hong Kong', 'Taiwan', 'Hong Kong SAR', 'Macao SAR'], 'China', li.country) AS original_country,
    if(li.country IN ['Macao', 'Hong Kong', 'Taiwan', 'Hong Kong SAR', 'Macao SAR'], li.country, li.administrative_area_level_1) AS original_province,
    country_matched.id AS country_id,
    country_matched.name AS country,
    country_matched.name_zh AS country_zh,
    province_matched.id AS province_id,
    COALESCE(province_matched.name, '') AS province,
    COALESCE(province_matched.name_zh, '') AS province_zh,
    li.administrative_area_level_2 AS city
  FROM location_info li
  LEFT JOIN country_labels country_matched ON country_matched.includes_lower = lower(original_country)
  LEFT JOIN province_labels province_matched ON province_matched.parent_country_id = country_matched.id AND original_province !='' AND province_matched.includes_lower = lower(original_province)
  WHERE 
    li.status = 'normal'
  ) l ON gu.location = l.location
  WHERE 
    gu.status = 'normal'
GROUP BY 
    id
  `;
    await query(createViewQuery);
  };

  const createNameView = async () => {
    // The name view is used to store the name info for the repos and orgs
    // The name view is refreshed every 1 day
    // OpenRank is used for sorting the repos and orgs
    await query(`DROP TABLE IF EXISTS name_info`);
    const createViewQuery = `
CREATE MATERIALIZED VIEW IF NOT EXISTS name_info
REFRESH EVERY 1 DAY
ENGINE = MergeTree()
ORDER BY (id, platform)
POPULATE
AS
SELECT
  platform,
  repo_id AS id,
  argMax(repo_name, created_at) AS name,
  SUM(openrank) AS openrank,
  CAST('Repo','Enum8(\\\'Repo\\\'=1, \\\'Org\\\'=2, \\\'User\\\'=3)') AS type
FROM global_openrank g
WHERE g.type='Repo'
GROUP BY repo_id, platform
UNION ALL
SELECT
  platform,
  org_id AS id,
  argMax(org_login, created_at) AS name,
  SUM(openrank) AS openrank,
  CAST('Org','Enum8(\\\'Repo\\\'=1, \\\'Org\\\'=2, \\\'User\\\'=3)') AS type
FROM global_openrank g
WHERE g.type='Repo'
GROUP BY org_id, platform
UNION ALL
SELECT
  platform,
  actor_id AS id,
  argMax(actor_login, created_at) AS name,
  SUM(openrank) AS openrank,
  CAST('User','Enum8(\\\'Repo\\\'=1, \\\'Org\\\'=2, \\\'User\\\'=3)') AS type
FROM global_openrank g
WHERE g.type='User'
GROUP BY actor_id, platform
`;
    await query(createViewQuery);
  };

  const createFlattenLabelView = async () => {
    // The flatten_labels view is used to store the flatten label info for the repos, orgs and users
    // The flatten_labels view is refreshed after label import
    await query(`DROP TABLE IF EXISTS flatten_labels`);
    const createViewQuery = `
CREATE MATERIALIZED VIEW IF NOT EXISTS flatten_labels
REFRESH EVERY 1 DAY
(
  id LowCardinality(String),
  type LowCardinality(String),
  name LowCardinality(String),
  name_zh LowCardinality(String),
  platform LowCardinality(String),
  entity_id UInt64,
  entity_type Enum8('Repo'=1, 'Org'=2, 'User'=3)
)
ENGINE = MergeTree()
ORDER BY (id, platform)
POPULATE
AS
WITH l AS (SELECT id, type, name, name_zh, p.name AS platform, p.repos AS repos, p.orgs AS orgs, p.users AS users FROM labels ARRAY JOIN platforms AS p)
SELECT id, type, name, name_zh, platform, arrayJoin(repos) AS entity_id, 'Repo' AS entity_type FROM l
UNION ALL
SELECT id, type, name, name_zh, platform, arrayJoin(orgs) AS entity_id, 'Org' AS entity_type FROM l
UNION ALL
SELECT id, type, name, name_zh, platform, arrayJoin(users) AS entity_id, 'User' AS entity_type FROM l
`;
    await query(createViewQuery);
  };

  const createPullsWitLabelView = async () => {
    // The pulls_with_label view is used to store the pull requests with label info for the pull requests
    // The pulls_with_label view is refreshed every 1 hour
    await query(`DROP TABLE IF EXISTS pulls_with_label`);
    const createViewQuery = `
CREATE MATERIALIZED VIEW IF NOT EXISTS pulls_with_label
REFRESH EVERY 1 HOUR
(
  id UInt64,
  platform LowCardinality(String)
) ENGINE = MergeTree()
ORDER BY (id, platform)
POPULATE
AS
SELECT
  issue_id AS id,
  platform
FROM events WHERE type = 'PullRequestEvent' AND action = 'opened' AND actor_login NOT LIKE '%[bot]%'
AND toYear(created_at) >= 2025
AND (((platform, repo_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE entity_type = 'Repo'))
   OR ((platform, org_id) IN (SELECT platform, entity_id FROM flatten_labels WHERE entity_type = 'Org')))
GROUP BY issue_id, platform
`;
    await query(createViewQuery);
  };

  const createNormalizedCommunityOpenRankView = async () => {
    // The normalized_community_openrank view is used to store the normalized community openrank info for the all repos
    // The normalized_community_openrank view is refreshed every 1 day
    // The normalized_community_openrank is calculated by the community openrank and the global openrank
    // The normalized_community_openrank uses activity instead of community openrank if it is not calculated
    await query(`DROP TABLE IF EXISTS normalized_community_openrank`);
    const createViewQuery = `
CREATE MATERIALIZED VIEW IF NOT EXISTS normalized_community_openrank
REFRESH EVERY 1 DAY
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
ORDER BY (repo_id, platform)
POPULATE
AS
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
    FROM global_openrank WHERE type = 'Repo' AND legacy = 0) g
  INNER JOIN
  ((SELECT repo_id, platform, SUM(openrank) AS gor, groupArray(tuple(actor_id, actor_login, openrank)) AS gor_details, created_at
    FROM community_openrank WHERE actor_id > 0 AND actor_login NOT LIKE '%[bot]' AND
    (platform, actor_id) NOT IN (SELECT platform, entity_id FROM flatten_labels WHERE id = ':bot' AND entity_type = 'User')
    GROUP BY repo_id, platform, created_at)
    UNION ALL
    (SELECT repo_id, platform, SUM(activity) AS gor, groupArray(tuple(actor_id, actor_login, activity)) AS gor_details, m AS created_at
    FROM (
      SELECT repo_id, platform, ${basicActivitySqlComponent}, toStartOfMonth(created_at) AS m
      FROM events WHERE
      (platform, actor_id) NOT IN (SELECT platform, entity_id FROM flatten_labels WHERE id = ':bot' AND entity_type = 'User')
      AND type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')
      AND (repo_id, platform) NOT IN (SELECT id, platform FROM export_repo)
      GROUP BY repo_id, platform, actor_id, m
      HAVING actor_login NOT LIKE '%[bot]'
    )
    GROUP BY repo_id, platform, created_at)
  ) c
  ON g.repo_id = c.repo_id AND g.created_at = c.created_at AND g.platform = c.platform
)
`;
    await query(createViewQuery);
  };

  await createUserView();
  await createNameView();
  await createFlattenLabelView();
  await createPullsWitLabelView();
  await createNormalizedCommunityOpenRankView();
})();
