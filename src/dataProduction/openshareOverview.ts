import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { query } from '../db/clickhouse';
import { getLabelData } from '../labelDataUtils';
import { getLogger } from '../utils';

/**
 * OpenShare 宏观洞察页面数据生产脚本。
 *
 * 仅产出三个指标，每个指标一个 JSON 文件，包含 `leaderboards`（排行榜）
 * 与 `trends`（趋势图）两个字段：
 *   - developers.json   开发者数量
 *   - contribution.json 开发者 OpenRank 贡献度
 *   - influence.json    开源项目 OpenRank 影响力
 *
 * 不再区分平台（AtomGit 无地理位置数据）。排行榜标题、趋势标题、
 * 排行榜每行数据均提供中英文（取标签数据中的 name / name_zh）。
 *
 * 注意：labels 表的 `data` 字段直接存储的是 label 的 `meta` 对象本身
 * （见 src/scripts/importLabelToDatabase.ts），因此 JSON 路径为
 * `data,'developers'` / `data,'alpha2'`，而非 `data,'meta',...`。
 */

const logger = getLogger('openshareOverview');

const OUTPUT_DIR = 'local_files/openshare_overview';
const OSS_URL = 'https://oss.open-digger.cn/';

// 当前完整自然年（如不完整可回退 2024）
const NATURAL_YEAR = 2025;
const PREV_YEAR = NATURAL_YEAR - 1;
// 五年趋势：最近 5 个完整自然年（动态）
const TREND_YEARS: number[] = Array.from({ length: 5 }, (_, i) => NATURAL_YEAR - 4 + i);
const TREND_RANGE = { start: `${TREND_YEARS[0]}-01-01`, end: `${NATURAL_YEAR + 1}-01-01` };

// 活跃开发者修正：自 2025 年起，全球 GitHub 平台活跃开发者数量乘以 1.15（GitHub 口径修正）
const GITHUB_ACTIVE_ADJUST_FROM_YEAR = 2025;
const GITHUB_ACTIVE_ADJUST_FACTOR = 1.15;
// user_info 仅含 GitHub 平台用户，中国活跃开发者需补充 AtomGit 平台活跃用户总量的 80%（Gitee 不计入）
const CN_EXTRA_PLATFORMS = ['AtomGit'];
const CN_EXTRA_PLATFORM_RATIO = 0.8;
// 中国开发者总量需在标签数据（InnovationGraph）基础上叠加 AtomGit、Gitee 平台用户去重总数（累计到年末）
const CN_EXTRA_TOTAL_PLATFORMS = ['AtomGit', 'Gitee'];
// 贡献度与影响力修正：自 2025 年起，排行/趋势数值统一乘以 1.15
const OPENRANK_ADJUST_FROM_YEAR = 2025;
const OPENRANK_ADJUST_FACTOR = 1.15;
// 贡献度/影响力中，AtomGit、Gitee 平台无地理信息，其数据全部计入中国
const CN_OPENRANK_EXTRA_PLATFORMS = ['AtomGit', 'Gitee'];

// 中美下钻配置
const DRILL = {
  CN: { country: 'China', labelId: ':divisions/CN' },
  US: { country: 'United States', labelId: ':divisions/US' },
};

/* --------------------------------------------------------------------------
 * 通用类型
 * ------------------------------------------------------------------------ */

interface ColOption {
  name: string;
  type: string;
  fields: string[];
  width: number;
}

interface Leaderboard {
  title: string;
  title_zh: string;
  options: ColOption[];
  options_zh: ColOption[];
  data: any[];
}

interface Trend {
  title: string;
  title_zh: string;
  labels: string[];
  values: number[];
}

interface MetricOutput {
  leaderboards: Leaderboard[];
  trends: Trend[];
}

// 排行榜单行（计算阶段使用），value 为当年值，change 为同比绝对变化值
interface RankItem {
  identifier: string; // 标签 identifier，用于导航到标签详情页
  name: string;
  name_zh: string;
  value: number;
  change: number;
  code?: string;
  logo?: string;
  country?: string;
  country_zh?: string;
}

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

/** 数值保留两位小数。 */
const round2 = (n: number) => +(+n).toFixed(2);

/** 自 2025 年起 GitHub 平台活跃开发者数量修正：count × 1.15。 */
const adjustGithubActive = (count: number, year: number): number =>
  year >= GITHUB_ACTIVE_ADJUST_FROM_YEAR ? count * GITHUB_ACTIVE_ADJUST_FACTOR : count;

/** 自 2025 年起贡献度/影响力数值修正：value × 1.15。 */
const adjustOpenrank = (value: number, year: number): number =>
  year >= OPENRANK_ADJUST_FROM_YEAR ? value * OPENRANK_ADJUST_FACTOR : value;

/** 将额外总量按各条目当前 value 占比分摊到 map 中（如 AtomGit/Gitee 总量按 GitHub 比例分配到各省）。 */
const distributeByProportion = (map: Map<string, { value: number }>, extra: number) => {
  if (extra <= 0) return;
  const total = [...map.values()].reduce((s, v) => s + v.value, 0);
  if (total <= 0) return;
  for (const v of map.values()) v.value += extra * (v.value / total);
};

const col = (name: string, fields: string[], width = 200, type = 'String'): ColOption => ({ name, type, fields, width });

/** 按 value 降序、附加 rank，并对数值四舍五入（不截断，全量输出）。 */
const rankAndSlice = (items: RankItem[]) =>
  [...items]
    .sort((a, b) => b.value - a.value)
    .map((i, idx) => {
      const row: any = { rank: idx + 1 };
      row.identifier = i.identifier;
      row.name = i.name;
      row.name_zh = i.name_zh;
      if (i.logo) row.logo = i.logo;
      row.value = round2(i.value);
      row.change = round2(i.change);
      if (i.code !== undefined) row.code = i.code;
      if (i.country !== undefined) row.country = i.country;
      if (i.country_zh !== undefined) row.country_zh = i.country_zh;
      return row;
    });

/** 由 year->value 的 map 构造五年趋势。 */
const toTrend = (title: string, title_zh: string, map: Map<number, number>): Trend => ({
  title,
  title_zh,
  labels: TREND_YEARS.map(String),
  values: TREND_YEARS.map(y => round2(map.get(y) ?? 0)),
});

const yearRange = (year: number) => ({ start: `${year}-01-01`, end: `${year + 1}-01-01` });

/* --------------------------------------------------------------------------
 * 国家中英文 / alpha2 映射
 * ------------------------------------------------------------------------ */

interface CountryMeta {
  identifier: string;
  name_zh: string;
  code: string;
}

let _countryMetaCache: Map<string, CountryMeta> | null = null;

/** 国家英文名 -> { identifier, 中文名, alpha2 }。 */
const getCountryMeta = async (): Promise<Map<string, CountryMeta>> => {
  if (_countryMetaCache) return _countryMetaCache;
  const rows = await query<[string, string, string, string]>(`
SELECT id, name, name_zh, JSONExtractString(data, 'alpha2') AS alpha2
FROM labels FINAL
WHERE type = 'Division-0'`);
  const map = new Map<string, CountryMeta>();
  rows.forEach(([id, name, name_zh, code]) => name && map.set(name, { identifier: id, name_zh: name_zh || name, code: code || '' }));
  _countryMetaCache = map;
  return map;
};

/* --------------------------------------------------------------------------
 * 开发者数量（developers）
 * ------------------------------------------------------------------------ */

interface DeveloperEntry {
  year: number;
  quarter: number;
  count: number;
}

interface CountryDevelopers {
  identifier: string;
  name: string;
  name_zh: string;
  alpha2: string;
  entries: DeveloperEntry[];
}

let _countryDevelopersCache: CountryDevelopers[] | null = null;

/** 读取所有 Division-0 国家的 InnovationGraph developers 序列（开发者累计总量）。 */
const getCountryDevelopers = async (): Promise<CountryDevelopers[]> => {
  if (_countryDevelopersCache) return _countryDevelopersCache;
  const rows = await query<[string, string, string, string, string]>(`
SELECT id, name, name_zh, JSONExtractString(data, 'alpha2') AS alpha2, data
FROM labels FINAL
WHERE type = 'Division-0' AND notEmpty(JSONExtractArrayRaw(data, 'developers'))`);
  const result: CountryDevelopers[] = [];
  for (const [id, name, name_zh, alpha2, data] of rows) {
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
    if (entries.length) result.push({ identifier: id, name, name_zh: name_zh || name, alpha2, entries });
  }
  _countryDevelopersCache = result;
  return result;
};

/** 指定年份开发者总量（取该年最大季度；若该年无数据则取 <= 该年的最近季度）。 */
const developerCountForYear = (entries: DeveloperEntry[], year: number): number => {
  const sameYear = entries.filter(e => e.year === year);
  if (sameYear.length) return Math.max(...sameYear.map(e => e.count));
  const before = entries.filter(e => e.year < year);
  if (!before.length) return 0;
  const latest = before.sort((a, b) => a.year * 10 + a.quarter - (b.year * 10 + b.quarter)).pop()!;
  return latest.count;
};

const _cnExtraTotalCache = new Map<number, number>();

/**
 * 贡献度/影响力中 AtomGit + Gitee 平台某年的 openrank 总量（无地理信息，全部计入中国）。
 * table：normalized_community_openrank（贡献度）或 global_openrank（影响力，仅统计 type='Repo'）。
 */
const _cnExtraOpenrankCache = new Map<string, number>();
const cnExtraOpenrankForYear = async (
  table: 'normalized_community_openrank' | 'global_openrank',
  year: number,
): Promise<number> => {
  const cacheKey = `${table}:${year}`;
  if (_cnExtraOpenrankCache.has(cacheKey)) return _cnExtraOpenrankCache.get(cacheKey)!;
  const platformList = CN_OPENRANK_EXTRA_PLATFORMS.map(p => `'${p}'`).join(', ');
  const { start, end } = yearRange(year);
  const typeCond = table === 'global_openrank' ? " AND type = 'Repo'" : '';
  const rows = await query<[string]>(`
SELECT SUM(openrank) AS value
FROM ${table}
WHERE platform IN (${platformList})${typeCond} AND created_at >= '${start}' AND created_at < '${end}'`);
  const v = +(rows[0]?.[0] ?? 0);
  _cnExtraOpenrankCache.set(cacheKey, v);
  return v;
};

/**
 * 中国开发者总量补充：AtomGit + Gitee 平台累计到指定年末的去重用户总数。
 * 两平台用户 ID 体系不同，无法跨平台识别同一人，故各平台内去重后相加，
 * 即 COUNT(DISTINCT (platform, actor_id))。这些平台无地理信息（user_info 仅含
 * GitHub 用户），直接按平台统计全量，仅计入中国。
 */
const cnExtraTotalDevelopersForYear = async (year: number): Promise<number> => {
  if (_cnExtraTotalCache.has(year)) return _cnExtraTotalCache.get(year)!;
  const platformList = CN_EXTRA_TOTAL_PLATFORMS.map(p => `'${p}'`).join(', ');
  const rows = await query<[string]>(`
SELECT COUNT(DISTINCT (platform, actor_id)) AS c
FROM events
WHERE platform IN (${platformList}) AND created_at < '${year + 1}-01-01'`);
  const v = +(rows[0]?.[0] ?? 0);
  _cnExtraTotalCache.set(year, v);
  return v;
};

/** 排行榜 1：各国最新开发者总量（同比绝对变化）。 */
const developerTotalRanking = async (): Promise<RankItem[]> => {
  const countries = await getCountryDevelopers();
  const items: RankItem[] = [];
  for (const c of countries) {
    let cur = developerCountForYear(c.entries, NATURAL_YEAR);
    let prev = developerCountForYear(c.entries, PREV_YEAR);
    // 中国在标签数据基础上叠加 AtomGit + Gitee 平台用户去重总数
    if (c.name === DRILL.CN.country) {
      cur += await cnExtraTotalDevelopersForYear(NATURAL_YEAR);
      prev += await cnExtraTotalDevelopersForYear(PREV_YEAR);
    }
    if (cur <= 0) continue;
    items.push({ identifier: c.identifier, name: c.name, name_zh: c.name_zh, code: c.alpha2, value: cur, change: cur - prev });
  }
  return items;
};

/**
 * AtomGit 平台各年活跃用户总量（events 去重 actor）。
 * 该平台无地理信息，user_info 也仅含 GitHub 用户，故直接按平台统计全量。
 * 返回 year -> 活跃用户数。
 */
const cnExtraActiveByYear = async (start: string, end: string): Promise<Map<number, number>> => {
  const platformList = CN_EXTRA_PLATFORMS.map(p => `'${p}'`).join(', ');
  const rows = await query<[string, string]>(`
SELECT toYear(created_at) AS y, COUNT(DISTINCT actor_id) AS c
FROM events
WHERE platform IN (${platformList}) AND created_at >= '${start}' AND created_at < '${end}'
GROUP BY y`);
  const map = new Map<number, number>();
  rows.forEach(([y, c]) => map.set(+y, +c));
  return map;
};

/** 全球 GitHub 平台各年活跃开发者去重总量（含无国家信息用户）。返回 year -> count。 */
const githubActiveTotalByYear = async (start: string, end: string): Promise<Map<number, number>> => {
  const rows = await query<[string, string]>(`
SELECT toYear(created_at) AS y, COUNT(DISTINCT actor_id) AS c
FROM events
WHERE platform = 'GitHub' AND created_at >= '${start}' AND created_at < '${end}'
GROUP BY y`);
  const map = new Map<number, number>();
  rows.forEach(([y, c]) => map.set(+y, +c));
  return map;
};

/**
 * 排行榜 2：各国当年活跃开发者数量估算（同比绝对变化）。
 *
 * 估算逻辑（user_info 仅含 GitHub 用户，且大量活跃用户无国家信息）：
 *   1. 由 events JOIN user_info 得到各国 GitHub 活跃去重数，计算各国在「有国家信息用户」中的占比；
 *   2. 以全球 GitHub 活跃去重总量为基数（含无国家信息用户，自 2025 年起 ×1.15），
 *      各国估计值 = 占比 × 基数，将未知国家用户按占比分摊；
 *   3. 中国再叠加 AtomGit 平台活跃用户总量的 80%（无地理数据，仅计入中国）。
 */
const developerActiveRanking = async (): Promise<RankItem[]> => {
  const meta = await getCountryMeta();
  const rows = await query<[string, string, string, string]>(`
SELECT u.country AS name, u.country_zh AS name_zh, toYear(e.created_at) AS y, COUNT(DISTINCT e.actor_id) AS c
FROM events e
INNER JOIN user_info u ON e.platform = u.platform AND e.actor_id = u.id
WHERE u.country != '' AND e.created_at >= '${PREV_YEAR}-01-01' AND e.created_at < '${NATURAL_YEAR + 1}-01-01'
GROUP BY u.country, u.country_zh, y`);
  // 各国 GitHub 活跃去重数（仅含有国家信息用户），以及各年度合计用于求占比
  const agg = new Map<string, { name_zh: string; cur: number; prev: number }>();
  let curKnownTotal = 0;
  let prevKnownTotal = 0;
  for (const [name, name_zh, y, c] of rows) {
    if (!name) continue;
    const entry = agg.get(name) ?? { name_zh: name_zh || name, cur: 0, prev: 0 };
    if (+y === NATURAL_YEAR) { entry.cur = +c; curKnownTotal += +c; }
    else if (+y === PREV_YEAR) { entry.prev = +c; prevKnownTotal += +c; }
    agg.set(name, entry);
  }
  // 基数：全球 GitHub 活跃去重总量（含无国家信息用户），自 2025 年起 ×1.15
  const ghTotal = await githubActiveTotalByYear(`${PREV_YEAR}-01-01`, `${NATURAL_YEAR + 1}-01-01`);
  const curBase = adjustGithubActive(ghTotal.get(NATURAL_YEAR) ?? 0, NATURAL_YEAR);
  const prevBase = adjustGithubActive(ghTotal.get(PREV_YEAR) ?? 0, PREV_YEAR);
  // 各国估计值 = 占比 × 基数（将未知国家用户按占比分摊）
  for (const [, v] of agg) {
    v.cur = curKnownTotal > 0 ? (v.cur / curKnownTotal) * curBase : 0;
    v.prev = prevKnownTotal > 0 ? (v.prev / prevKnownTotal) * prevBase : 0;
  }
  // 中国额外补充 AtomGit 平台活跃用户总量的 80%（无地理数据，仅计入中国）
  const cnExtra = await cnExtraActiveByYear(`${PREV_YEAR}-01-01`, `${NATURAL_YEAR + 1}-01-01`);
  const cnEntry = agg.get(DRILL.CN.country);
  if (cnEntry) {
    cnEntry.cur += (cnExtra.get(NATURAL_YEAR) ?? 0) * CN_EXTRA_PLATFORM_RATIO;
    cnEntry.prev += (cnExtra.get(PREV_YEAR) ?? 0) * CN_EXTRA_PLATFORM_RATIO;
  }
  const items: RankItem[] = [];
  for (const [name, v] of agg) {
    if (v.cur <= 0) continue;
    const cm = meta.get(name);
    items.push({ identifier: cm?.identifier ?? '', name, name_zh: v.name_zh, code: cm?.code ?? '', value: v.cur, change: v.cur - v.prev });
  }
  return items;
};

/** 趋势：全球开发者总量五年趋势（InnovationGraph 累计求和）。 */
const developerTotalTrend = async (): Promise<Map<number, number>> => {
  const countries = await getCountryDevelopers();
  const map = new Map<number, number>();
  for (const year of TREND_YEARS) {
    let total = 0;
    for (const c of countries) total += developerCountForYear(c.entries, year);
    // 全球总量中的中国部分叠加 AtomGit + Gitee 平台用户去重总数
    total += await cnExtraTotalDevelopersForYear(year);
    map.set(year, total);
  }
  return map;
};

/**
 * 趋势：活跃开发者五年趋势（events 去重 actor）。countryName 为空时统计全球。
 * 口径修正：
 *   - 全球：跨平台去重总量，仅对 GitHub 部分自 2025 年起加成 15%；
 *   - 国家级（中国）：按“各国 GitHub 活跃占比 × 全球 GitHub 活跃基数”估算，
 *     基数自 2025 年起 ×1.15；再叠加 AtomGit 平台活跃用户总量的 80%。
 */
const developerActiveTrend = async (countryName?: string): Promise<Map<number, number>> => {
  const map = new Map<number, number>();
  if (countryName) {
    // 各国按年 GitHub 活跃去重数（仅含有国家信息用户），用于计算该国逐年占比
    const targetRows = await query<[string, string]>(`
SELECT toYear(e.created_at) AS y, COUNT(DISTINCT e.actor_id) AS c
FROM events e
INNER JOIN user_info u ON e.platform = u.platform AND e.actor_id = u.id
WHERE u.country = '${countryName}' AND e.created_at >= '${TREND_RANGE.start}' AND e.created_at < '${TREND_RANGE.end}'
GROUP BY y`);
    const knownRows = await query<[string, string]>(`
SELECT toYear(e.created_at) AS y, COUNT(DISTINCT e.actor_id) AS c
FROM events e
INNER JOIN user_info u ON e.platform = u.platform AND e.actor_id = u.id
WHERE u.country != '' AND e.created_at >= '${TREND_RANGE.start}' AND e.created_at < '${TREND_RANGE.end}'
GROUP BY y`);
    const targetMap = new Map<number, number>();
    targetRows.forEach(([y, c]) => targetMap.set(+y, +c));
    const knownMap = new Map<number, number>();
    knownRows.forEach(([y, c]) => knownMap.set(+y, +c));
    // 基数：全球 GitHub 活跃去重总量（含无国家信息用户）
    const ghTotal = await githubActiveTotalByYear(TREND_RANGE.start, TREND_RANGE.end);
    for (const year of TREND_YEARS) {
      const known = knownMap.get(year) ?? 0;
      const base = adjustGithubActive(ghTotal.get(year) ?? 0, year);
      const estimate = known > 0 ? ((targetMap.get(year) ?? 0) / known) * base : 0;
      map.set(year, estimate);
    }
    // 中国趋势额外补充 AtomGit 平台活跃用户总量的 80%（所有年份）
    if (countryName === DRILL.CN.country) {
      const cnExtra = await cnExtraActiveByYear(TREND_RANGE.start, TREND_RANGE.end);
      for (const year of TREND_YEARS) {
        const extra = (cnExtra.get(year) ?? 0) * CN_EXTRA_PLATFORM_RATIO;
        if (extra > 0) map.set(year, (map.get(year) ?? 0) + extra);
      }
    }
  } else {
    // 全球：跨平台去重总量 c，另单独统计 GitHub 去重数 gh；仅对 GitHub 部分自 2025 年起加成 15%
    const rows = await query<[string, string, string]>(`
SELECT toYear(created_at) AS y, COUNT(DISTINCT actor_id) AS c, uniqExactIf(actor_id, platform = 'GitHub') AS gh
FROM events
WHERE created_at >= '${TREND_RANGE.start}' AND created_at < '${TREND_RANGE.end}'
GROUP BY y
ORDER BY y`);
    rows.forEach(([y, c, gh]) => {
      const boost = +y >= GITHUB_ACTIVE_ADJUST_FROM_YEAR ? +gh * (GITHUB_ACTIVE_ADJUST_FACTOR - 1) : 0;
      map.set(+y, +c + boost);
    });
  }
  return map;
};

const produceDevelopers = async () => {
  logger.info('Producing metric: developers');
  const total = await developerTotalRanking();
  const active = await developerActiveRanking();

  const totalTrend = await developerTotalTrend();
  const activeGlobalTrend = await developerActiveTrend();
  const activeChinaTrend = await developerActiveTrend(DRILL.CN.country);

  const output: MetricOutput = {
    leaderboards: [
      {
        title: 'Latest Total Developers by Country',
        title_zh: '各国最新开发者总量排行榜',
        options: [
          col('#', ['rank'], 80),
          col('Country', ['name'], 300),
          col('Total Developers', ['value'], 300),
          col('YoY Change', ['change'], 300),
        ],
        options_zh: [
          col('#', ['rank'], 80),
          col('国家', ['name_zh'], 300),
          col('开发者总量', ['value'], 300),
          col('同比变化', ['change'], 300),
        ],
        data: rankAndSlice(total),
      },
      {
        title: `Active Developers by Country (${NATURAL_YEAR})`,
        title_zh: `各国活跃开发者数量排行榜（${NATURAL_YEAR}年）`,
        options: [
          col('#', ['rank'], 80),
          col('Country', ['name'], 300),
          col(`Active Developers (${NATURAL_YEAR})`, ['value'], 300),
          col(`Change vs ${PREV_YEAR}`, ['change'], 300),
        ],
        options_zh: [
          col('#', ['rank'], 80),
          col('国家', ['name_zh'], 300),
          col(`${NATURAL_YEAR}年活跃开发者数`, ['value'], 300),
          col(`较${PREV_YEAR}年变化`, ['change'], 300),
        ],
        data: rankAndSlice(active),
      },
    ],
    trends: [
      toTrend('Global Total Developers (5-Year Trend)', '全球开发者总量五年趋势', totalTrend),
      toTrend('Global Active Developers (5-Year Trend)', '全球活跃开发者总量五年趋势', activeGlobalTrend),
      toTrend('China Active Developers (5-Year Trend)', '中国活跃开发者数量五年趋势', activeChinaTrend),
    ],
  };
  writeJSON('developers.json', output);
};

/* --------------------------------------------------------------------------
 * 开发者 OpenRank 贡献度（contribution）- normalized_community_openrank JOIN user_info
 * ------------------------------------------------------------------------ */

/** GitHub 平台各年贡献度总量（含无国家信息用户）。返回 year -> value。 */
const githubContributionTotalByYear = async (start: string, end: string): Promise<Map<number, number>> => {
  const rows = await query<[string, string]>(`
SELECT toYear(created_at) AS y, SUM(openrank) AS value
FROM normalized_community_openrank
WHERE platform = 'GitHub' AND created_at >= '${start}' AND created_at < '${end}'
GROUP BY y`);
  const map = new Map<number, number>();
  rows.forEach(([y, value]) => map.set(+y, +value));
  return map;
};

/**
 * 指定年份各国贡献度总量（按占比估算，与全球趋势口径一致）。
 *
 * 估算逻辑（与活跃开发者排行榜一致）：
 *   1. 由 normalized_community_openrank JOIN user_info 得到各国 GitHub 贡献度，
 *      计算各国在「有国家信息用户」中的占比；
 *   2. 以 GitHub 平台全量贡献度为基数（含无国家信息用户），
 *      各国估计值 = 占比 × 基数，将未知国家用户按占比分摊；
 *   3. 中国再叠加 AtomGit + Gitee 平台贡献度总量（无地理数据，仅计入中国）；
 *   4. 自 2025 年起所有数值 ×1.15。
 */
const contributionByCountry = async (year: number): Promise<Map<string, { name_zh: string; value: number }>> => {
  const { start, end } = yearRange(year);
  // 各国 GitHub 贡献度（仅含有国家信息的用户）
  const rows = await query<[string, string, string]>(`
SELECT u.country AS name, u.country_zh AS name_zh, SUM(n.openrank) AS value
FROM normalized_community_openrank n
INNER JOIN user_info u ON n.platform = u.platform AND n.actor_id = u.id
WHERE u.country != '' AND n.created_at >= '${start}' AND n.created_at < '${end}'
GROUP BY u.country, u.country_zh
ORDER BY value DESC`);
  let knownTotal = 0;
  const rawMap = new Map<string, { name_zh: string; value: number }>();
  rows.forEach(([name, name_zh, value]) => {
    if (!name) return;
    rawMap.set(name, { name_zh: name_zh || name, value: +value });
    knownTotal += +value;
  });
  // 基数：GitHub 平台全量贡献度（含无国家信息用户）
  const ghTotal = await githubContributionTotalByYear(start, end);
  const base = ghTotal.get(year) ?? 0;
  // 各国估计值 = 占比 × 基数（将未知国家用户按占比分摊）
  const map = new Map<string, { name_zh: string; value: number }>();
  for (const [name, raw] of rawMap) {
    const estimated = knownTotal > 0 ? (raw.value / knownTotal) * base : 0;
    map.set(name, { name_zh: raw.name_zh, value: estimated });
  }
  // 中国叠加 AtomGit + Gitee 平台贡献度总量（无地理信息，全部计入中国）
  const cnEntry = map.get(DRILL.CN.country);
  if (cnEntry) cnEntry.value += await cnExtraOpenrankForYear('normalized_community_openrank', year);
  // 自 2025 年起所有数值 ×1.15
  for (const v of map.values()) v.value = adjustOpenrank(v.value, year);
  return map;
};

/** 排行榜：全球各国当年贡献度总量（同比绝对变化）。 */
const contributionRanking = async (): Promise<RankItem[]> => {
  const meta = await getCountryMeta();
  const cur = await contributionByCountry(NATURAL_YEAR);
  const prev = await contributionByCountry(PREV_YEAR);
  const items: RankItem[] = [];
  for (const [name, c] of cur) {
    if (c.value <= 0) continue;
    const p = prev.get(name)?.value ?? 0;
    const cm = meta.get(name);
    items.push({ identifier: cm?.identifier ?? '', name, name_zh: c.name_zh, code: cm?.code ?? '', value: c.value, change: c.value - p });
  }
  return items;
};

/** 趋势：贡献度总量五年趋势。countryName 为空时统计全球。 */
const contributionTrend = async (countryName?: string): Promise<Map<number, number>> => {
  const map = new Map<number, number>();
  if (countryName) {
    // 该国 GitHub 平台贡献度逐年值（仅含有国家信息用户）
    const targetRows = await query<[string, string]>(`
SELECT toYear(n.created_at) AS y, SUM(n.openrank) AS value
FROM normalized_community_openrank n
INNER JOIN user_info u ON n.platform = u.platform AND n.actor_id = u.id
WHERE u.country = '${countryName}' AND n.created_at >= '${TREND_RANGE.start}' AND n.created_at < '${TREND_RANGE.end}'
GROUP BY y
ORDER BY y`);
    // 所有已知国家用户 GitHub 贡献度逐年总和
    const knownRows = await query<[string, string]>(`
SELECT toYear(n.created_at) AS y, SUM(n.openrank) AS value
FROM normalized_community_openrank n
INNER JOIN user_info u ON n.platform = u.platform AND n.actor_id = u.id
WHERE u.country != '' AND n.created_at >= '${TREND_RANGE.start}' AND n.created_at < '${TREND_RANGE.end}'
GROUP BY y
ORDER BY y`);
    const targetMap = new Map<number, number>();
    targetRows.forEach(([y, value]) => targetMap.set(+y, +value));
    const knownMap = new Map<number, number>();
    knownRows.forEach(([y, value]) => knownMap.set(+y, +value));
    // 基数：GitHub 平台全量贡献度（含无国家信息用户）
    const ghTotal = await githubContributionTotalByYear(TREND_RANGE.start, TREND_RANGE.end);
    for (const year of TREND_YEARS) {
      const known = knownMap.get(year) ?? 0;
      const base = ghTotal.get(year) ?? 0;
      const estimate = known > 0 ? ((targetMap.get(year) ?? 0) / known) * base : 0;
      map.set(year, estimate);
    }
    // 中国趋势额外叠加 AtomGit + Gitee 平台贡献度（无地理信息，全部计入中国）
    if (countryName === DRILL.CN.country) {
      for (const year of TREND_YEARS) {
        const extra = await cnExtraOpenrankForYear('normalized_community_openrank', year);
        if (extra > 0) map.set(year, (map.get(year) ?? 0) + extra);
      }
    }
  } else {
    const rows = await query<[string, string]>(`
SELECT toYear(created_at) AS y, SUM(openrank) AS value
FROM normalized_community_openrank
WHERE created_at >= '${TREND_RANGE.start}' AND created_at < '${TREND_RANGE.end}'
GROUP BY y
ORDER BY y`);
    rows.forEach(([y, value]) => map.set(+y, +value));
  }
  // 自 2025 年起所有年份数值 ×1.15
  for (const [y, v] of map) map.set(y, adjustOpenrank(v, y));
  return map;
};

const produceContribution = async () => {
  logger.info('Producing metric: contribution');
  const ranking = await contributionRanking();
  const globalTrend = await contributionTrend();
  const usTrend = await contributionTrend(DRILL.US.country);
  const cnTrend = await contributionTrend(DRILL.CN.country);

  const output: MetricOutput = {
    leaderboards: [
      {
        title: 'Developer OpenRank Contribution by Country',
        title_zh: '全球各国开发者 OpenRank 贡献度排行榜',
        options: [
          col('#', ['rank'], 80),
          col('Country', ['name'], 300),
          col('Developer OpenRank Contribution', ['value'], 300),
          col('YoY Change', ['change'], 300),
        ],
        options_zh: [
          col('#', ['rank'], 80),
          col('国家', ['name_zh'], 300),
          col('开发者 OpenRank 贡献度', ['value'], 300),
          col('同比变化', ['change'], 300),
        ],
        data: rankAndSlice(ranking),
      },
    ],
    trends: [
      toTrend('Global Developer OpenRank Contribution (5-Year Trend)', '全球开发者 OpenRank 贡献度总量五年趋势', globalTrend),
      toTrend('United States Developer OpenRank Contribution (5-Year Trend)', '美国开发者 OpenRank 贡献度总量五年趋势', usTrend),
      toTrend('China Developer OpenRank Contribution (5-Year Trend)', '中国开发者 OpenRank 贡献度总量五年趋势', cnTrend),
    ],
  };
  writeJSON('contribution.json', output);
};

/* --------------------------------------------------------------------------
 * 开源项目 OpenRank 影响力（influence）- global_openrank JOIN flatten_labels
 * ------------------------------------------------------------------------ */

/**
 * 按标签聚合影响力（repo + org 两类实体合并），返回 key -> { name, name_zh, id, value }。
 * groupById 为 true 时按标签 id 聚合（企业），否则按标签 name 聚合（国家）。
 */
const influenceByLabel = async (
  baseCond: string,
  groupById: boolean,
  start: string,
  end: string,
): Promise<Map<string, { name: string; name_zh: string; id: string; value: number }>> => {
  // 按 id 聚合（企业）时 id 进 GROUP BY；按 name 聚合（国家）时用 any(id) 取任意值，避免非聚合列报错
  const idSelect = groupById ? 'fl.id AS id' : 'any(fl.id) AS id';
  const keyCols = groupById ? 'fl.id, fl.name, fl.name_zh' : 'fl.name, fl.name_zh';
  const buildSql = (idCol: 'repo_id' | 'org_id', entityType: 'Repo' | 'Org') => `
SELECT ${idSelect}, fl.name AS name, fl.name_zh AS name_zh, SUM(g.openrank) AS value
FROM global_openrank g
INNER JOIN flatten_labels fl ON g.platform = fl.platform AND g.${idCol} = fl.entity_id
WHERE ${baseCond} AND fl.entity_type = '${entityType}'
  AND g.type = 'Repo' AND g.created_at >= '${start}' AND g.created_at < '${end}'
GROUP BY ${keyCols}`;

  const repoRows = await query<[string, string, string, string]>(buildSql('repo_id', 'Repo'));
  const orgRows = await query<[string, string, string, string]>(buildSql('org_id', 'Org'));

  const map = new Map<string, { name: string; name_zh: string; id: string; value: number }>();
  for (const [id, name, name_zh, value] of [...repoRows, ...orgRows]) {
    const key = groupById ? id : name;
    if (!key) continue;
    const entry = map.get(key) ?? { name, name_zh: name_zh || name, id, value: 0 };
    entry.value += +value;
    map.set(key, entry);
  }
  return map;
};

/** 排行榜 1：全球各国开源项目影响力（同比绝对变化）。 */
const influenceCountryRanking = async (): Promise<RankItem[]> => {
  const meta = await getCountryMeta();
  const cur = yearRange(NATURAL_YEAR);
  const prev = yearRange(PREV_YEAR);
  const curMap = await influenceByLabel(`fl.type = 'Division-0'`, false, cur.start, cur.end);
  const prevMap = await influenceByLabel(`fl.type = 'Division-0'`, false, prev.start, prev.end);
  // 中国叠加 AtomGit + Gitee 平台影响力总量（无地理信息，全部计入中国）
  const cnCur = curMap.get(DRILL.CN.country);
  if (cnCur) cnCur.value += await cnExtraOpenrankForYear('global_openrank', NATURAL_YEAR);
  const cnPrev = prevMap.get(DRILL.CN.country);
  if (cnPrev) cnPrev.value += await cnExtraOpenrankForYear('global_openrank', PREV_YEAR);
  const items: RankItem[] = [];
  for (const [name, c] of curMap) {
    if (c.value <= 0) continue;
    const p = prevMap.get(name)?.value ?? 0;
    // 自 2025 年起 ×1.15
    const curValue = adjustOpenrank(c.value, NATURAL_YEAR);
    const prevValue = adjustOpenrank(p, PREV_YEAR);
    const cm = meta.get(name);
    items.push({ identifier: cm?.identifier ?? '', name, name_zh: c.name_zh, code: cm?.code ?? '', value: curValue, change: curValue - prevValue });
  }
  return items;
};

/** 排行榜 2：全球各企业开源项目影响力（同比绝对变化，附所属国家）。 */
const influenceCompanyRanking = async (): Promise<RankItem[]> => {
  const cur = yearRange(NATURAL_YEAR);
  const prev = yearRange(PREV_YEAR);
  const curMap = await influenceByLabel(`fl.type = 'Company'`, true, cur.start, cur.end);
  const prevMap = await influenceByLabel(`fl.type = 'Company'`, true, prev.start, prev.end);

  // 企业所属国家：通过 label.parents 向上追溯到 Division-0
  const labels = getLabelData();
  const findCountry = (labelId: string): { country: string; country_zh: string } | null => {
    const label = labels.find(l => l.identifier === labelId);
    if (!label) return null;
    const countryLabelId = (label.parents || []).find((p: string) => p.startsWith(':divisions'));
    if (countryLabelId) {
      const countryLabel = labels.find(l => l.identifier === countryLabelId);
      if (!countryLabel) return null;
      if (countryLabel.type !== 'Division-0') return findCountry(countryLabel.parents[0]);
      return { country: countryLabel.name, country_zh: countryLabel.name_zh || countryLabel.name };
    }
    for (const parent of label.parents || []) {
      const c = findCountry(parent);
      if (c) return c;
    }
    return null;
  };

  const items: RankItem[] = [];
  for (const [id, c] of curMap) {
    if (c.value <= 0) continue;
    const p = prevMap.get(id)?.value ?? 0;
    // 自 2025 年起 ×1.15
    const curValue = adjustOpenrank(c.value, NATURAL_YEAR);
    const prevValue = adjustOpenrank(p, PREV_YEAR);
    const country = findCountry(id) ?? { country: '', country_zh: '' };
    items.push({
      identifier: id,
      name: c.name,
      name_zh: c.name_zh,
      logo: `${OSS_URL}logos/${id.split(':')[1]}.png`,
      value: curValue,
      change: curValue - prevValue,
      country: country.country,
      country_zh: country.country_zh,
    });
  }
  return items;
};

/** 趋势：开源项目影响力五年趋势。labelId 为空时统计全球（所有 Division-0）。 */
const influenceTrend = async (labelId?: string): Promise<Map<number, number>> => {
  const baseCond = labelId ? `fl.id = '${labelId}'` : `fl.type = 'Division-0'`;
  // 全球（含中国）或中国下钻需叠加 AtomGit + Gitee 平台影响力（无地理信息，全部计入中国）
  const addCnExtra = !labelId || labelId === DRILL.CN.labelId;
  const map = new Map<number, number>();
  for (const year of TREND_YEARS) {
    const { start, end } = yearRange(year);
    const yearMap = await influenceByLabel(baseCond, false, start, end);
    let total = 0;
    for (const [, v] of yearMap) total += v.value;
    if (addCnExtra) total += await cnExtraOpenrankForYear('global_openrank', year);
    // 自 2025 年起 ×1.15
    map.set(year, adjustOpenrank(total, year));
  }
  return map;
};

const produceInfluence = async () => {
  logger.info('Producing metric: influence');
  const countryRanking = await influenceCountryRanking();
  const companyRanking = await influenceCompanyRanking();

  const globalTrend = await influenceTrend();
  const usTrend = await influenceTrend(DRILL.US.labelId);
  const cnTrend = await influenceTrend(DRILL.CN.labelId);

  const output: MetricOutput = {
    leaderboards: [
      {
        title: 'Open Source Project OpenRank Influence by Country',
        title_zh: '全球各国开源项目 OpenRank 影响力排行榜',
        options: [
          col('#', ['rank'], 80),
          col('Country', ['name'], 300),
          col('Project OpenRank Influence', ['value'], 300),
          col('YoY Change', ['change'], 300),
        ],
        options_zh: [
          col('#', ['rank'], 80),
          col('国家', ['name_zh'], 300),
          col('开源项目 OpenRank 影响力', ['value'], 300),
          col('同比变化', ['change'], 300),
        ],
        data: rankAndSlice(countryRanking),
      },
      {
        title: 'Open Source Project OpenRank Influence by Company',
        title_zh: '全球各企业开源项目 OpenRank 影响力排行榜',
        options: [
          col('#', ['rank'], 80),
          col('Company', ['name', 'logo'], 300, 'StringWithIcon'),
          col('Project OpenRank Influence', ['value'], 200),
          col('YoY Change', ['change'], 200),
          col('Country', ['country'], 200),
        ],
        options_zh: [
          col('#', ['rank'], 80),
          col('企业名称', ['name_zh', 'logo'], 300, 'StringWithIcon'),
          col('开源项目 OpenRank 影响力', ['value'], 200),
          col('同比变化', ['change'], 200),
          col('所属国家', ['country_zh'], 200),
        ],
        data: rankAndSlice(companyRanking),
      },
    ],
    trends: [
      toTrend('Global Project OpenRank Influence (5-Year Trend)', '全球开源项目 OpenRank 影响力总量五年趋势', globalTrend),
      toTrend('United States Project OpenRank Influence (5-Year Trend)', '美国开源项目 OpenRank 影响力总量五年趋势', usTrend),
      toTrend('China Project OpenRank Influence (5-Year Trend)', '中国开源项目 OpenRank 影响力总量五年趋势', cnTrend),
    ],
  };
  writeJSON('influence.json', output);
};

/* --------------------------------------------------------------------------
 * 国家下钻（省/州级）
 * ------------------------------------------------------------------------ */

interface ProvinceMeta {
  identifier: string;
  name_zh: string;
  code: string;
}

const _provinceMetaCache = new Map<string, Map<string, ProvinceMeta>>();

/** 某国各省/州英文名 -> { identifier, 中文名, alpha2 }（按 Division-1 标签）。 */
const getProvinceMeta = async (countryCode: string): Promise<Map<string, ProvinceMeta>> => {
  const cached = _provinceMetaCache.get(countryCode);
  if (cached) return cached;
  const rows = await query<[string, string, string, string]>(`
SELECT id, name, name_zh, JSONExtractString(data, 'alpha2') AS alpha2
FROM labels FINAL
WHERE type = 'Division-1' AND id LIKE ':divisions/${countryCode}/%'`);
  const map = new Map<string, ProvinceMeta>();
  rows.forEach(([id, name, name_zh, code]) => name && map.set(name, { identifier: id, name_zh: name_zh || name, code: code || '' }));
  _provinceMetaCache.set(countryCode, map);
  return map;
};

/** 下钻排行榜 1：各省/州开发者总量估算（省用户占比 * 国家 InnovationGraph 总量）。 */
const provinceDeveloperEstimateRanking = async (countryName: string, countryCode: string): Promise<RankItem[]> => {
  const provMeta = await getProvinceMeta(countryCode);
  const countries = await getCountryDevelopers();
  const country = countries.find(c => c.name === countryName);
  let curTotal = country ? developerCountForYear(country.entries, NATURAL_YEAR) : 0;
  let prevTotal = country ? developerCountForYear(country.entries, PREV_YEAR) : 0;
  // 中国省级估算基数叠加 AtomGit + Gitee 平台用户去重总数
  if (countryCode === 'CN') {
    curTotal += await cnExtraTotalDevelopersForYear(NATURAL_YEAR);
    prevTotal += await cnExtraTotalDevelopersForYear(PREV_YEAR);
  }
  const rows = await query<[string, string, string]>(`
SELECT province AS name, province_zh AS name_zh, COUNT(DISTINCT id) AS cnt
FROM user_info
WHERE country = '${countryName}' AND province != ''
GROUP BY province, province_zh
ORDER BY cnt DESC`);
  const totalUsers = rows.reduce((s, [, , c]) => s + +c, 0);
  if (totalUsers <= 0) return [];
  const items: RankItem[] = [];
  for (const [name, name_zh, cnt] of rows) {
    if (!name) continue;
    const ratio = +cnt / totalUsers;
    const cur = ratio * curTotal;
    const prev = ratio * prevTotal;
    if (cur <= 0) continue;
    const pm = provMeta.get(name);
    items.push({ identifier: pm?.identifier ?? '', name, name_zh: name_zh || name, code: pm?.code ?? '', value: cur, change: cur - prev });
  }
  return items;
};

/**
 * 下钻排行榜 2：各省/州活跃开发者数量（同比绝对变化）。
 *
 * 口径与国家级活跃趋势（developerActiveTrend）一致：以各省在「有省份信息的
 * 活跃用户」中的占比 × 该国活跃开发者总量估算值（已含 2025 起 ×1.15 与中国
 * AtomGit×80% 补充）。避免原来「直接计数」与国家级趋势口径不一致（趋势上涨、
 * 省级榜却下跌）的问题。
 */
const provinceDeveloperActiveRanking = async (
  countryName: string,
  countryCode: string,
  countryActiveTrend: Map<number, number>,
): Promise<RankItem[]> => {
  const provMeta = await getProvinceMeta(countryCode);
  const rows = await query<[string, string, string, string]>(`
SELECT u.province AS name, u.province_zh AS name_zh, toYear(e.created_at) AS y, COUNT(DISTINCT e.actor_id) AS c
FROM events e
INNER JOIN user_info u ON e.platform = u.platform AND e.actor_id = u.id
WHERE u.country = '${countryName}' AND u.province != ''
  AND e.created_at >= '${PREV_YEAR}-01-01' AND e.created_at < '${NATURAL_YEAR + 1}-01-01'
GROUP BY u.province, u.province_zh, y`);
  const agg = new Map<string, { name_zh: string; cur: number; prev: number }>();
  for (const [name, name_zh, y, c] of rows) {
    if (!name) continue;
    const entry = agg.get(name) ?? { name_zh: name_zh || name, cur: 0, prev: 0 };
    if (+y === NATURAL_YEAR) entry.cur = +c;
    else if (+y === PREV_YEAR) entry.prev = +c;
    agg.set(name, entry);
  }
  // 各省占比 × 国家活跃总量估算值（与国家级趋势同口径）
  const curProvTotal = [...agg.values()].reduce((s, v) => s + v.cur, 0);
  const prevProvTotal = [...agg.values()].reduce((s, v) => s + v.prev, 0);
  const countryCur = countryActiveTrend.get(NATURAL_YEAR) ?? 0;
  const countryPrev = countryActiveTrend.get(PREV_YEAR) ?? 0;
  const items: RankItem[] = [];
  for (const [name, v] of agg) {
    const cur = curProvTotal > 0 ? (v.cur / curProvTotal) * countryCur : 0;
    const prev = prevProvTotal > 0 ? (v.prev / prevProvTotal) * countryPrev : 0;
    if (cur <= 0) continue;
    const pm = provMeta.get(name);
    items.push({ identifier: pm?.identifier ?? '', name, name_zh: v.name_zh, code: pm?.code ?? '', value: cur, change: cur - prev });
  }
  return items;
};

/**
 * 指定年份某国各省/州贡献度总量（按占比估算，与国家口径一致）。
 *
 * 估算逻辑：各省在「有省份信息的已知用户」中的占比 × 该国贡献度估计总量
 * （与 provinceDeveloperActiveRanking 口径一致，避免省级榜与国家级趋势不一致）。
 */
const provinceContributionByYear = async (
  countryName: string,
  year: number,
  countryValue: number,
): Promise<Map<string, { name_zh: string; value: number }>> => {
  const { start, end } = yearRange(year);
  // 各省 GitHub 贡献度（仅含有省份信息的用户）
  const rows = await query<[string, string, string]>(`
SELECT u.province AS name, u.province_zh AS name_zh, SUM(n.openrank) AS value
FROM normalized_community_openrank n
INNER JOIN user_info u ON n.platform = u.platform AND n.actor_id = u.id
WHERE u.country = '${countryName}' AND u.province != ''
  AND n.created_at >= '${start}' AND n.created_at < '${end}'
GROUP BY u.province, u.province_zh
ORDER BY value DESC`);
  let provTotal = 0;
  const rawMap = new Map<string, { name_zh: string; value: number }>();
  rows.forEach(([name, name_zh, value]) => {
    if (!name) return;
    rawMap.set(name, { name_zh: name_zh || name, value: +value });
    provTotal += +value;
  });
  // 各省估计值 = 占比 × 国家贡献度估计总量（将无省份信息的用户按占比分摊）
  const map = new Map<string, { name_zh: string; value: number }>();
  for (const [name, raw] of rawMap) {
    const estimated = provTotal > 0 ? (raw.value / provTotal) * countryValue : 0;
    map.set(name, { name_zh: raw.name_zh, value: estimated });
  }
  return map;
};

/** 下钻排行榜：各省/州开发者 OpenRank 贡献度（同比绝对变化）。 */
const provinceContributionRanking = async (countryName: string, countryCode: string): Promise<RankItem[]> => {
  const provMeta = await getProvinceMeta(countryCode);
  // 获取该国当年和上年的贡献度估计总量（与国家级排行榜同口径）
  const countryMap = await contributionByCountry(NATURAL_YEAR);
  const countryMapPrev = await contributionByCountry(PREV_YEAR);
  const countryCurValue = countryMap.get(countryName)?.value ?? 0;
  const countryPrevValue = countryMapPrev.get(countryName)?.value ?? 0;
  const cur = await provinceContributionByYear(countryName, NATURAL_YEAR, countryCurValue);
  const prev = await provinceContributionByYear(countryName, PREV_YEAR, countryPrevValue);
  const items: RankItem[] = [];
  for (const [name, c] of cur) {
    if (c.value <= 0) continue;
    const p = prev.get(name)?.value ?? 0;
    const pm = provMeta.get(name);
    items.push({ identifier: pm?.identifier ?? '', name, name_zh: c.name_zh, code: pm?.code ?? '', value: c.value, change: c.value - p });
  }
  return items;
};

/** 下钻排行榜：各省/州开源项目影响力（Division-1 标签，限定国家前缀，同比绝对变化）。 */
const provinceInfluenceRanking = async (countryCode: string): Promise<RankItem[]> => {
  const provMeta = await getProvinceMeta(countryCode);
  const cur = yearRange(NATURAL_YEAR);
  const prev = yearRange(PREV_YEAR);
  const cond = `fl.type = 'Division-1' AND fl.id LIKE ':divisions/${countryCode}/%'`;
  const curMap = await influenceByLabel(cond, false, cur.start, cur.end);
  const prevMap = await influenceByLabel(cond, false, prev.start, prev.end);
  // 中国：将 AtomGit + Gitee 平台影响力总量按各省 GitHub 占比分配到各省
  if (countryCode === 'CN') {
    distributeByProportion(curMap, await cnExtraOpenrankForYear('global_openrank', NATURAL_YEAR));
    distributeByProportion(prevMap, await cnExtraOpenrankForYear('global_openrank', PREV_YEAR));
  }
  const items: RankItem[] = [];
  for (const [name, c] of curMap) {
    if (c.value <= 0) continue;
    const p = prevMap.get(name)?.value ?? 0;
    // 自 2025 年起 ×1.15
    const curValue = adjustOpenrank(c.value, NATURAL_YEAR);
    const prevValue = adjustOpenrank(p, PREV_YEAR);
    const pm = provMeta.get(name);
    items.push({ identifier: pm?.identifier ?? c.id, name, name_zh: c.name_zh, code: pm?.code ?? '', value: curValue, change: curValue - prevValue });
  }
  return items;
};

/** 为单个国家生成省/州级下钻的三个指标文件。 */
const produceDrillDown = async (code: string, drill: { country: string; labelId: string }) => {
  logger.info(`Producing drill-down for ${code} (${drill.country})`);
  const countryMeta = await getCountryMeta();
  const enName = drill.country;
  const zhName = countryMeta.get(drill.country)?.name_zh ?? drill.country;
  // 行政区命名：中国用 Province/省份，其它（美国）用 State/州
  const regionEn = code === 'CN' ? 'Province' : 'State';
  const regionZh = code === 'CN' ? '省份' : '州';
  const regionZhUnit = code === 'CN' ? '省' : '州';

  // developers.json
  try {
    const estimate = await provinceDeveloperEstimateRanking(enName, code);
    const activeTrend = await developerActiveTrend(enName);
    const active = await provinceDeveloperActiveRanking(enName, code, activeTrend);
    const output: MetricOutput = {
      leaderboards: [
        {
          title: `${enName} ${regionEn} Developer Distribution`,
          title_zh: `${zhName}各${regionZhUnit}开发者分布排行榜`,
          options: [
            col('#', ['rank'], 80),
            col(regionEn, ['name'], 300),
            col('Estimated Developers', ['value'], 300),
            col('YoY Change', ['change'], 300),
          ],
          options_zh: [
            col('#', ['rank'], 80),
            col(regionZh, ['name_zh'], 300),
            col('估计开发者数', ['value'], 300),
            col('同比变化', ['change'], 300),
          ],
          data: rankAndSlice(estimate),
        },
        {
          title: `Active Developers by ${regionEn} (${enName}, ${NATURAL_YEAR})`,
          title_zh: `${zhName}各${regionZhUnit}活跃开发者数量排行榜（${NATURAL_YEAR}年）`,
          options: [
            col('#', ['rank'], 80),
            col(regionEn, ['name'], 300),
            col(`Active Developers (${NATURAL_YEAR})`, ['value'], 300),
            col(`Change vs ${PREV_YEAR}`, ['change'], 300),
          ],
          options_zh: [
            col('#', ['rank'], 80),
            col(regionZh, ['name_zh'], 300),
            col(`${NATURAL_YEAR}年活跃开发者数`, ['value'], 300),
            col(`较${PREV_YEAR}年变化`, ['change'], 300),
          ],
          data: rankAndSlice(active),
        },
      ],
      trends: [
        toTrend(`${enName} Active Developers (5-Year Trend)`, `${zhName}活跃开发者数量五年趋势`, activeTrend),
      ],
    };
    writeJSON(`${code}/developers.json`, output);
  } catch (e) {
    logger.warn(`Failed to produce drill-down developers for ${code}: ${e}`);
  }

  // contribution.json
  try {
    const ranking = await provinceContributionRanking(enName, code);
    const trend = await contributionTrend(enName);
    const output: MetricOutput = {
      leaderboards: [
        {
          title: `Developer OpenRank Contribution by ${regionEn} (${enName})`,
          title_zh: `${zhName}各${regionZhUnit}开发者 OpenRank 贡献度排行榜`,
          options: [
            col('#', ['rank'], 80),
            col(regionEn, ['name'], 300),
            col('Developer OpenRank Contribution', ['value'], 300),
            col('YoY Change', ['change'], 300),
          ],
          options_zh: [
            col('#', ['rank'], 80),
            col(regionZh, ['name_zh'], 300),
            col('开发者 OpenRank 贡献度', ['value'], 300),
            col('同比变化', ['change'], 300),
          ],
          data: rankAndSlice(ranking),
        },
      ],
      trends: [
        toTrend(`${enName} Developer OpenRank Contribution (5-Year Trend)`, `${zhName}开发者 OpenRank 贡献度总量五年趋势`, trend),
      ],
    };
    writeJSON(`${code}/contribution.json`, output);
  } catch (e) {
    logger.warn(`Failed to produce drill-down contribution for ${code}: ${e}`);
  }

  // influence.json
  try {
    const ranking = await provinceInfluenceRanking(code);
    const trend = await influenceTrend(drill.labelId);
    const output: MetricOutput = {
      leaderboards: [
        {
          title: `Open Source Project OpenRank Influence by ${regionEn} (${enName})`,
          title_zh: `${zhName}各${regionZhUnit}开源项目 OpenRank 影响力排行榜`,
          options: [
            col('#', ['rank'], 80),
            col(regionEn, ['name'], 300),
            col('Project OpenRank Influence', ['value'], 300),
            col('YoY Change', ['change'], 300),
          ],
          options_zh: [
            col('#', ['rank'], 80),
            col(regionZh, ['name_zh'], 300),
            col('开源项目 OpenRank 影响力', ['value'], 300),
            col('同比变化', ['change'], 300),
          ],
          data: rankAndSlice(ranking),
        },
      ],
      trends: [
        toTrend(`${enName} Project OpenRank Influence (5-Year Trend)`, `${zhName}开源项目 OpenRank 影响力总量五年趋势`, trend),
      ],
    };
    writeJSON(`${code}/influence.json`, output);
  } catch (e) {
    logger.warn(`Failed to produce drill-down influence for ${code}: ${e}`);
  }
};

/* --------------------------------------------------------------------------
 * 元数据（meta）
 * ------------------------------------------------------------------------ */

/** 生成 meta.json：指标列表、下钻国家配置与全局概览统计。 */
const produceMeta = async () => {
  logger.info('Producing metric: meta');
  const { start, end } = yearRange(NATURAL_YEAR);

  // totalRecords：events 全表原始数据总量；totalRepos：全表去重仓库数（均不限年份）
  let totalRecords = 0;
  let totalRepos = 0;
  try {
    const rows = await query<[string, string]>(`
SELECT COUNT() AS records, COUNT(DISTINCT repo_id) AS repos
FROM events`);
    totalRecords = +(rows[0]?.[0] ?? 0);
    totalRepos = +(rows[0]?.[1] ?? 0);
  } catch (e) {
    logger.warn(`Failed to query totalRecords/totalRepos: ${e}`);
  }

  // totalDevelopers：汇总所有国家最新开发者总量（标签数据 InnovationGraph developers 口径）
  let totalDevelopers = 0;
  try {
    const countries = await getCountryDevelopers();
    for (const c of countries) {
      totalDevelopers += developerCountForYear(c.entries, NATURAL_YEAR);
    }
    // 中国开发者总量叠加 AtomGit + Gitee 平台用户去重总数
    totalDevelopers += await cnExtraTotalDevelopersForYear(NATURAL_YEAR);
  } catch (e) {
    logger.warn(`Failed to compute totalDevelopers: ${e}`);
  }

  // activeDevelopers：当年全球 events 去重 actor 数（GitHub 口径自 2025 年起加成 15%）
  let activeDevelopers = 0;
  try {
    const rows = await query<[string, string]>(`
SELECT COUNT(DISTINCT actor_id) AS c, uniqExactIf(actor_id, platform = 'GitHub') AS gh
FROM events
WHERE created_at >= '${start}' AND created_at < '${end}'`);
    const c = +(rows[0]?.[0] ?? 0);
    const gh = +(rows[0]?.[1] ?? 0);
    const boost = NATURAL_YEAR >= GITHUB_ACTIVE_ADJUST_FROM_YEAR ? gh * (GITHUB_ACTIVE_ADJUST_FACTOR - 1) : 0;
    activeDevelopers = Math.round(c + boost);
  } catch (e) {
    logger.warn(`Failed to query activeDevelopers: ${e}`);
  }

  // totalCountries：Division-0 标签总数
  let totalCountries = 0;
  try {
    const rows = await query<[string]>(`
SELECT COUNT(*) FROM labels FINAL WHERE type = 'Division-0'`);
    totalCountries = +(rows[0]?.[0] ?? 0);
  } catch (e) {
    logger.warn(`Failed to query totalCountries: ${e}`);
  }

  const output = {
    metrics: ['developers', 'contribution', 'influence'],
    drillDownCountries: {
      CN: { name: 'China', name_zh: '中国' },
      US: { name: 'United States', name_zh: '美国' },
    },
    summary: {
      totalRecords,
      totalRepos,
      totalDevelopers,
      activeDevelopers,
      totalCountries,
      dataSource: 'OpenDigger',
      updatedAt: new Date().toISOString(),
    },
  };
  writeJSON('meta.json', output);
};

/* --------------------------------------------------------------------------
 * 主流程
 * ------------------------------------------------------------------------ */

(async () => {
  try {
    ensureDir(OUTPUT_DIR);
    logger.info(`Output directory: ${OUTPUT_DIR}`);

    await produceMeta();
    await produceDevelopers();
    await produceContribution();
    await produceInfluence();

    // 生成中美省/州级下钻数据
    for (const [code, drill] of Object.entries(DRILL)) {
      await produceDrillDown(code, drill);
    }

    logger.info('OpenShare overview data production completed.');
  } catch (e) {
    logger.error(`OpenShare overview data production failed: ${e}`);
    process.exit(1);
  }
})();
