import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { query } from '../db/clickhouse';
import { getLogger } from '../utils';

/**
 * OpenShare 宏观洞察页面数据生产脚本。
 *
 * 产出五大维度（vitality / contribution / influence / growth）下，
 * 三个平台（all / github / atomgit）、多个地理层级（world / CN / US）的
 * 地图热力、趋势与排行榜 JSON 数据。
 *
 * 注意：labels 表的 `data` 字段直接存储的是 label 的 `meta` 对象本身
 * （见 src/scripts/importLabelToDatabase.ts），因此 JSON 路径为
 * `data,'developers'` / `data,'alpha2'`，而非 `data,'meta',...`。
 */

const logger = getLogger('openshareOverview');

const OUTPUT_DIR = 'local_files/openshare_overview';

// 自然年地图/排行使用的年份（2025 数据完整；如不完整可回退 2024）
const NATURAL_YEAR = 2025;
const PREV_YEAR = NATURAL_YEAR - 1;
// 趋势起始年
const TREND_START_YEAR = 2015;
// 6 月-6 月排行（_hy 后缀）时间窗口：[start, end)
const HY_START = '2024-07-01';
const HY_END = '2025-07-01';
// 排行榜最大条目数
const RANKING_LIMIT = 100;
// 中国特有用户叠加系数（AtomGit 活跃用户折算）
const ATOMGIT_FACTOR = 0.5;

type Platform = 'all' | 'github' | 'atomgit';
type Geo = 'world' | 'CN' | 'US';
type Metric = 'vitality' | 'contribution' | 'influence';

const PLATFORMS: Platform[] = ['all', 'github', 'atomgit'];
const GEOS: Geo[] = ['world', 'CN', 'US'];

// 平台到数据库 platform 字段值的映射（用于 SQL 过滤）
const PLATFORM_DB_NAME: Record<Exclude<Platform, 'all'>, string> = {
  github: 'GitHub',
  atomgit: 'AtomGit',
};

// 下钻国家配置：geo -> { 国家名（user_info.country）, Division-1 标签 id 前缀 }
const DRILL: Record<Exclude<Geo, 'world'>, { country: string; prefix: string }> = {
  CN: { country: 'China', prefix: ':divisions/CN/' },
  US: { country: 'United States', prefix: ':divisions/US/' },
};

interface GeoItem {
  name: string;
  value: number;
  code?: string;
}

// 缓存：cache[metric][platform][geo] = { current, previous }
type GeoCache = Map<string, { current: GeoItem[]; previous: GeoItem[] }>;
const cache: GeoCache = new Map();
const cacheKey = (metric: string, platform: Platform, geo: Geo) => `${metric}|${platform}|${geo}`;

/* --------------------------------------------------------------------------
 * 通用工具
 * ------------------------------------------------------------------------ */

const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

/** 写出 JSON 文件，relPath 相对 OUTPUT_DIR。 */
const writeJSON = (relPath: string, obj: any) => {
  const fullPath = join(OUTPUT_DIR, relPath);
  ensureDir(dirname(fullPath));
  writeFileSync(fullPath, JSON.stringify(obj));
};

/** 自然年时间窗口 [start, end)。 */
const yearRange = (year: number) => ({
  start: `${year}-01-01`,
  end: `${year + 1}-01-01`,
});

/** contribution / influence 的平台过滤子句。 */
const platformFilter = (platform: Platform, alias: string) =>
  platform === 'all' ? '' : ` AND ${alias}.platform = '${PLATFORM_DB_NAME[platform]}'`;

/** 数值保留两位小数。 */
const round2 = (n: number) => +(+n).toFixed(2);

/** 为地理数据附加 alpha2 code（按 name 匹配）。 */
const attachCode = (items: GeoItem[], codeMap: Map<string, string>): GeoItem[] =>
  items.map(i => ({ ...i, code: codeMap.get(i.name) ?? '' }));

/** 生成地图热力文件内容。 */
const toMapData = (items: GeoItem[]) => ({
  data: items.map(i => ({ name: i.name, value: round2(i.value), code: i.code ?? '' })),
});

/** 生成排行榜文件内容（按 value 降序，截断 limit）。 */
const toRankingData = (items: GeoItem[], limit = RANKING_LIMIT) => ({
  data: [...items]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((i, idx) => ({ rank: idx + 1, name: i.name, value: round2(i.value), code: i.code ?? '' })),
});

/** 生成趋势文件内容。 */
const toTrendData = (series: Array<{ year: number; value: number }>) => ({
  labels: series.map(s => `${s.year}`),
  values: series.map(s => round2(s.value)),
});

/* --------------------------------------------------------------------------
 * code 映射表
 * ------------------------------------------------------------------------ */

interface CodeMaps {
  country: Map<string, string>; // 国家名 -> alpha2 (CN/US)
  CN: Map<string, string>; // 中国省名 -> alpha2 (CN-BJ ...)
  US: Map<string, string>; // 美国州名 -> alpha2 (US-CA ...)
}

const loadCodeMaps = async (): Promise<CodeMaps> => {
  const countryRows = await query<[string, string]>(`
SELECT name, JSONExtractString(data, 'alpha2') AS alpha2
FROM labels FINAL
WHERE type = 'Division-0'`);
  const country = new Map<string, string>();
  countryRows.forEach(([name, code]) => name && country.set(name, code));

  const loadDivision1 = async (prefix: string) => {
    const rows = await query<[string, string]>(`
SELECT name, JSONExtractString(data, 'alpha2') AS alpha2
FROM labels FINAL
WHERE type = 'Division-1' AND id LIKE '${prefix}%'`);
    const map = new Map<string, string>();
    rows.forEach(([name, code]) => name && map.set(name, code));
    return map;
  };

  const CN = await loadDivision1(DRILL.CN.prefix);
  const US = await loadDivision1(DRILL.US.prefix);
  logger.info(`Loaded code maps: ${country.size} countries, ${CN.size} CN divisions, ${US.size} US divisions.`);
  return { country, CN, US };
};

/* --------------------------------------------------------------------------
 * Vitality（活力）- 开发者总量
 * ------------------------------------------------------------------------ */

interface DeveloperEntry {
  year: number;
  quarter: number;
  count: number;
}

interface CountryDevelopers {
  name: string;
  alpha2: string;
  entries: DeveloperEntry[];
}

let _countryDevelopersCache: CountryDevelopers[] | null = null;
let _atomgitActiveUsersCache: number | null = null;

/** 读取所有 Division-0 国家的 InnovationGraph developers 序列。 */
const getCountryDevelopers = async (): Promise<CountryDevelopers[]> => {
  if (_countryDevelopersCache) return _countryDevelopersCache;
  const rows = await query<[string, string, string]>(`
SELECT name, JSONExtractString(data, 'alpha2') AS alpha2, data
FROM labels FINAL
WHERE type = 'Division-0' AND notEmpty(JSONExtractArrayRaw(data, 'developers'))`);
  const result: CountryDevelopers[] = [];
  for (const [name, alpha2, data] of rows) {
    let entries: DeveloperEntry[] = [];
    try {
      const meta = JSON.parse(data);
      if (Array.isArray(meta.developers)) {
        entries = meta.developers
          .map((e: any) => ({ year: +e.year, quarter: +e.quarter, count: +e.count }))
          .filter((e: DeveloperEntry) => e.count > 0);
      }
    } catch (e) {
      logger.warn(`Failed to parse developers for ${name}: ${e}`);
    }
    if (entries.length) result.push({ name, alpha2, entries });
  }
  _countryDevelopersCache = result;
  return result;
};

/** AtomGit 活跃用户总数（去重 actor）。 */
const getAtomGitActiveUsers = async (): Promise<number> => {
  if (_atomgitActiveUsersCache !== null) return _atomgitActiveUsersCache;
  try {
    const rows = await query<[string]>(`SELECT COUNT(DISTINCT actor_id) FROM events WHERE platform = 'AtomGit'`);
    _atomgitActiveUsersCache = rows.length ? +rows[0][0] : 0;
  } catch (e) {
    logger.warn(`Failed to query AtomGit active users, fallback to 0: ${e}`);
    _atomgitActiveUsersCache = 0;
  }
  logger.info(`AtomGit active users: ${_atomgitActiveUsersCache}`);
  return _atomgitActiveUsersCache;
};

/** 指定国家在指定年份的开发者总量（取该年最大季度；若该年无数据则取 <= 该年的最近季度）。 */
const developerCountForYear = (entries: DeveloperEntry[], year: number): number => {
  const sameYear = entries.filter(e => e.year === year);
  if (sameYear.length) return Math.max(...sameYear.map(e => e.count));
  const before = entries.filter(e => e.year < year);
  if (!before.length) return 0;
  const latest = before.sort((a, b) => a.year * 10 + a.quarter - (b.year * 10 + b.quarter)).pop()!;
  return latest.count;
};

/** 计算 vitality 国家级数据。 */
const computeVitalityCountries = async (platform: Platform, year: number): Promise<GeoItem[]> => {
  const countries = await getCountryDevelopers();
  const atomgitUsers = await getAtomGitActiveUsers();
  const items: GeoItem[] = [];

  if (platform === 'atomgit') {
    // 仅 AtomGit 活跃用户数（目前仅中国）
    if (atomgitUsers > 0) items.push({ name: DRILL.CN.country, value: atomgitUsers, code: 'CN' });
    return items;
  }

  for (const c of countries) {
    let value = developerCountForYear(c.entries, year);
    if (value <= 0) continue;
    if (platform === 'all' && c.alpha2 === 'CN') {
      // 全平台：中国额外叠加 AtomGit 活跃用户的 50%
      value += atomgitUsers * ATOMGIT_FACTOR;
    }
    items.push({ name: c.name, value, code: c.alpha2 });
  }
  return items.sort((a, b) => b.value - a.value);
};

/** 查询指定国家各省州用户数量比例。 */
const getProvinceRatio = async (countryName: string): Promise<Array<{ name: string; ratio: number }>> => {
  const rows = await query<[string, string]>(`
SELECT province, COUNT(DISTINCT id) AS c
FROM user_info
WHERE country = '${countryName}' AND province != ''
GROUP BY province
ORDER BY c DESC`);
  const counts = rows.map(([name, c]) => ({ name, count: +c }));
  const total = counts.reduce((s, i) => s + i.count, 0);
  if (total <= 0) return [];
  return counts.map(i => ({ name: i.name, ratio: i.count / total }));
};

/** 计算 vitality 省州级数据：国家总量 × 各省比例。 */
const computeVitalityProvinces = async (platform: Platform, geo: Exclude<Geo, 'world'>, year: number): Promise<GeoItem[]> => {
  const countries = await computeVitalityCountries(platform, year);
  const countryItem = countries.find(c => c.name === DRILL[geo].country);
  if (!countryItem || countryItem.value <= 0) return [];
  const ratios = await getProvinceRatio(DRILL[geo].country);
  return ratios.map(r => ({ name: r.name, value: countryItem.value * r.ratio }));
};

/** 计算 vitality 指定地理层级、指定年份数据。 */
const computeVitality = async (platform: Platform, geo: Geo, year: number): Promise<GeoItem[]> => {
  if (geo === 'world') return computeVitalityCountries(platform, year);
  return computeVitalityProvinces(platform, geo, year);
};

/** vitality 全球趋势：所有国家逐年（每年最大季度）求和。atomgit 无历史季度数据，返回空。 */
const computeVitalityTrend = async (platform: Platform): Promise<Array<{ year: number; value: number }>> => {
  if (platform === 'atomgit') return [];
  const countries = await getCountryDevelopers();
  const atomgitUsers = await getAtomGitActiveUsers();
  const series: Array<{ year: number; value: number }> = [];
  for (let year = TREND_START_YEAR; year <= NATURAL_YEAR; year++) {
    let total = 0;
    for (const c of countries) {
      const v = developerCountForYear(c.entries, year);
      if (v > 0) total += v;
    }
    if (platform === 'all' && year === NATURAL_YEAR) total += atomgitUsers * ATOMGIT_FACTOR;
    if (total > 0) series.push({ year, value: total });
  }
  return series;
};

/* --------------------------------------------------------------------------
 * Contribution（贡献度）- normalized_community_openrank JOIN user_info
 * ------------------------------------------------------------------------ */

const computeContribution = async (platform: Platform, geo: Geo, start: string, end: string): Promise<GeoItem[]> => {
  const pf = platformFilter(platform, 'n');
  let sql: string;
  if (geo === 'world') {
    sql = `
SELECT u.country AS name, SUM(n.openrank) AS value
FROM normalized_community_openrank n
INNER JOIN user_info u ON n.platform = u.platform AND n.actor_id = u.id
WHERE u.country != '' AND n.created_at >= '${start}' AND n.created_at < '${end}'${pf}
GROUP BY u.country
ORDER BY value DESC`;
  } else {
    sql = `
SELECT u.province AS name, SUM(n.openrank) AS value
FROM normalized_community_openrank n
INNER JOIN user_info u ON n.platform = u.platform AND n.actor_id = u.id
WHERE u.country = '${DRILL[geo].country}' AND u.province != '' AND n.created_at >= '${start}' AND n.created_at < '${end}'${pf}
GROUP BY u.province
ORDER BY value DESC`;
  }
  const rows = await query<[string, string]>(sql);
  return rows.map(([name, value]) => ({ name, value: +value })).filter(i => i.value > 0);
};

const computeContributionTrend = async (platform: Platform): Promise<Array<{ year: number; value: number }>> => {
  const pf = platformFilter(platform, 'n');
  const rows = await query<[string, string]>(`
SELECT toYear(n.created_at) AS y, SUM(n.openrank) AS value
FROM normalized_community_openrank n
WHERE n.created_at >= '${TREND_START_YEAR}-01-01' AND n.created_at < '${NATURAL_YEAR + 1}-01-01'${pf}
GROUP BY y
ORDER BY y`);
  return rows.map(([y, value]) => ({ year: +y, value: +value })).filter(i => i.value > 0);
};

/* --------------------------------------------------------------------------
 * Influence（影响力）- global_openrank JOIN flatten_labels
 * ------------------------------------------------------------------------ */

/** 合并同名国家/地区的两份数据。 */
const mergeByName = (a: GeoItem[], b: GeoItem[]): GeoItem[] => {
  const map = new Map<string, number>();
  [...a, ...b].forEach(i => map.set(i.name, (map.get(i.name) ?? 0) + i.value));
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((x, y) => y.value - x.value);
};

const computeInfluence = async (platform: Platform, geo: Geo, start: string, end: string): Promise<GeoItem[]> => {
  const pf = platformFilter(platform, 'g');
  if (geo === 'world') {
    const repoRows = await query<[string, string]>(`
SELECT fl.name AS name, SUM(g.openrank) AS value
FROM global_openrank g
INNER JOIN flatten_labels fl ON g.platform = fl.platform AND g.repo_id = fl.entity_id
WHERE fl.type = 'Division-0' AND fl.entity_type = 'Repo'
  AND g.created_at >= '${start}' AND g.created_at < '${end}'${pf}
  AND g.type = 'Repo'
GROUP BY fl.name
ORDER BY value DESC`);
    const orgRows = await query<[string, string]>(`
SELECT fl.name AS name, SUM(g.openrank) AS value
FROM global_openrank g
INNER JOIN flatten_labels fl ON g.platform = fl.platform AND g.org_id = fl.entity_id
WHERE fl.type = 'Division-0' AND fl.entity_type = 'Org'
  AND g.created_at >= '${start}' AND g.created_at < '${end}'${pf}
  AND g.type = 'Repo'
GROUP BY fl.name
ORDER BY value DESC`);
    const repo = repoRows.map(([name, value]) => ({ name, value: +value }));
    const org = orgRows.map(([name, value]) => ({ name, value: +value }));
    return mergeByName(repo, org).filter(i => i.value > 0);
  }
  // 省州级：Division-1
  const rows = await query<[string, string]>(`
SELECT fl.name AS name, SUM(g.openrank) AS value
FROM global_openrank g
INNER JOIN flatten_labels fl ON g.platform = fl.platform AND g.repo_id = fl.entity_id
WHERE fl.type = 'Division-1' AND fl.id LIKE '${DRILL[geo].prefix}%' AND fl.entity_type = 'Repo'
  AND g.created_at >= '${start}' AND g.created_at < '${end}'${pf}
  AND g.type = 'Repo'
GROUP BY fl.name
ORDER BY value DESC`);
  return rows.map(([name, value]) => ({ name, value: +value })).filter(i => i.value > 0);
};

const computeInfluenceTrend = async (platform: Platform): Promise<Array<{ year: number; value: number }>> => {
  const pf = platformFilter(platform, 'g');
  const rows = await query<[string, string]>(`
SELECT toYear(g.created_at) AS y, SUM(g.openrank) AS value
FROM global_openrank g
INNER JOIN flatten_labels fl ON g.platform = fl.platform AND g.repo_id = fl.entity_id
WHERE fl.type = 'Division-0' AND fl.entity_type = 'Repo'
  AND g.created_at >= '${TREND_START_YEAR}-01-01' AND g.created_at < '${NATURAL_YEAR + 1}-01-01'${pf}
  AND g.type = 'Repo'
GROUP BY y
ORDER BY y`);
  return rows.map(([y, value]) => ({ year: +y, value: +value })).filter(i => i.value > 0);
};

/* --------------------------------------------------------------------------
 * 指标分发
 * ------------------------------------------------------------------------ */

const computeMetric = async (metric: Metric, platform: Platform, geo: Geo, start: string, end: string): Promise<GeoItem[]> => {
  switch (metric) {
    case 'vitality': {
      // vitality 使用年份而非日期区间
      const year = start === yearRange(PREV_YEAR).start ? PREV_YEAR : NATURAL_YEAR;
      return computeVitality(platform, geo, year);
    }
    case 'contribution':
      return computeContribution(platform, geo, start, end);
    case 'influence':
      return computeInfluence(platform, geo, start, end);
  }
};

const computeTrend = async (metric: Metric, platform: Platform): Promise<Array<{ year: number; value: number }>> => {
  switch (metric) {
    case 'vitality':
      return computeVitalityTrend(platform);
    case 'contribution':
      return computeContributionTrend(platform);
    case 'influence':
      return computeInfluenceTrend(platform);
  }
};

/** 给指标数据附加 code。 */
const withCode = (geo: Geo, items: GeoItem[], maps: CodeMaps): GeoItem[] => {
  if (geo === 'world') return attachCode(items, maps.country);
  return attachCode(items, maps[geo]);
};

/* --------------------------------------------------------------------------
 * 各指标产出
 * ------------------------------------------------------------------------ */

const produceMetric = async (metric: Metric, maps: CodeMaps) => {
  logger.info(`Producing metric: ${metric}`);
  const cur = yearRange(NATURAL_YEAR);
  const prev = yearRange(PREV_YEAR);

  for (const platform of PLATFORMS) {
    // 趋势（与地理层级无关）
    const trend = await computeTrend(metric, platform);
    writeJSON(`${metric}/${platform}/trend.json`, toTrendData(trend));

    for (const geo of GEOS) {
      // 当前自然年（地图 + 排行）
      const current = withCode(geo, await computeMetric(metric, platform, geo, cur.start, cur.end), maps);
      writeJSON(`${metric}/${platform}/${geo}.json`, toMapData(current));
      writeJSON(`${metric}/${platform}/ranking/${geo}.json`, toRankingData(current));

      // 上一年（供 growth 复用）
      const previous = withCode(geo, await computeMetric(metric, platform, geo, prev.start, prev.end), maps);
      cache.set(cacheKey(metric, platform, geo), { current, previous });

      // 6 月-6 月排行
      const hy = withCode(geo, await computeMetric(metric, platform, geo, HY_START, HY_END), maps);
      writeJSON(`${metric}/${platform}/ranking/${geo}_hy.json`, toRankingData(hy));
    }
  }
};

/* --------------------------------------------------------------------------
 * Growth（增长）- 复用前三指标的 current / previous 计算 YoY
 * ------------------------------------------------------------------------ */

// growth 维度 -> 复用的指标
const GROWTH_DIMS: Array<{ dim: string; metric: Metric }> = [
  { dim: 'developers', metric: 'vitality' },
  { dim: 'contribution', metric: 'contribution' },
  { dim: 'influence', metric: 'influence' },
];

/** 计算同比增长率 (current - previous) / previous * 100，按 name 对齐。 */
const computeGrowth = (current: GeoItem[], previous: GeoItem[]): GeoItem[] => {
  const prevMap = new Map<string, GeoItem>();
  previous.forEach(i => prevMap.set(i.name, i));
  const result: GeoItem[] = [];
  for (const c of current) {
    const p = prevMap.get(c.name);
    if (!p || p.value <= 0) continue;
    result.push({ name: c.name, value: ((c.value - p.value) / p.value) * 100, code: c.code });
  }
  return result.sort((a, b) => b.value - a.value);
};

const produceGrowth = async () => {
  logger.info('Producing metric: growth');
  for (const platform of PLATFORMS) {
    for (const { dim, metric } of GROWTH_DIMS) {
      for (const geo of GEOS) {
        const entry = cache.get(cacheKey(metric, platform, geo));
        if (!entry) continue;
        const growth = computeGrowth(entry.current, entry.previous);
        writeJSON(`growth/${platform}/${dim}/${geo}.json`, toMapData(growth));
        writeJSON(`growth/${platform}/${dim}/ranking/${geo}.json`, toRankingData(growth));
      }
    }
  }
};

/* --------------------------------------------------------------------------
 * meta.json
 * ------------------------------------------------------------------------ */

const produceMeta = async () => {
  let totalRepos = 0;
  let totalDevelopers = 0;
  try {
    const repoRows = await query<[string]>(`SELECT COUNT(DISTINCT entity_id) FROM flatten_labels WHERE entity_type = 'Repo'`);
    if (repoRows.length) totalRepos = +repoRows[0][0];
  } catch (e) {
    logger.warn(`Failed to count total repos: ${e}`);
  }
  try {
    const countries = await getCountryDevelopers();
    const atomgitUsers = await getAtomGitActiveUsers();
    totalDevelopers = countries.reduce((s, c) => s + developerCountForYear(c.entries, NATURAL_YEAR), 0);
    totalDevelopers += atomgitUsers * ATOMGIT_FACTOR;
    totalDevelopers = Math.round(totalDevelopers);
  } catch (e) {
    logger.warn(`Failed to compute total developers: ${e}`);
  }

  writeJSON('meta.json', {
    metrics: ['vitality', 'contribution', 'influence', 'growth'],
    platforms: PLATFORMS,
    drillDownCountries: ['CN', 'US'],
    summary: {
      totalRepos,
      totalDevelopers,
      dataSource: 'OpenDigger',
      updatedAt: new Date().toISOString(),
    },
  });
};

/* --------------------------------------------------------------------------
 * 主流程
 * ------------------------------------------------------------------------ */

(async () => {
  try {
    ensureDir(OUTPUT_DIR);
    logger.info(`Output directory: ${OUTPUT_DIR}`);

    const maps = await loadCodeMaps();

    await produceMetric('vitality', maps);
    await produceMetric('contribution', maps);
    await produceMetric('influence', maps);
    await produceGrowth();
    await produceMeta();

    logger.info('OpenShare overview data production completed.');
  } catch (e) {
    logger.error(`OpenShare overview data production failed: ${e}`);
    process.exit(1);
  }
})();
