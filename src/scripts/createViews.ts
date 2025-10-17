import { query } from "../db/clickhouse";

(async () => {
  const createUserView = async () => {
    await query(`DROP TABLE IF EXISTS user_info`);
    const createViewQuery = `
CREATE MATERIALIZED VIEW IF NOT EXISTS user_info
REFRESH EVERY 3 HOUR
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
    CAST('GitHub', 'Enum8(\\\'GitHub\\\' = 1, \\\'Gitee\\\' = 2, \\\'AtomGit\\\' = 3, \\\'GitLab.com\\\' = 4, \\\'Gitea\\\' = 5, \\\'GitLab.cn\\\' = 6)') AS platform, 
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

  await createUserView();
  await createNameView();
})();