import { TupleParam } from "@clickhouse/client";
import { query } from "../db/clickhouse";
import { getLabelData } from "../labelDataUtils";
import { getUserCommunityOpenrank } from "../metrics/indices";
import { countryInfo } from "../static/countries";

(async () => {
  const countryContributionLeaderborad = async (year: number, print: boolean = true, china: boolean = false) => {
    const limit = 20;
    const contributions = await getUserCommunityOpenrank({
      labelIntersect: china ? [':foundations/apache', ':divisions/CN'] : [':foundations/apache'],
      startYear: year, startMonth: 1,
      endYear: year, endMonth: 12,
      limit: -1, limitOption: 'all',
      order: 'DESC', orderOption: 'latest',
      precision: 2,
      options: {
        withBot: false,
        limit: -1,
      },
    });
    console.log(`Got ${contributions.length} contribution data`);
    const countryLabelData = getLabelData().filter(l => l.type === 'Division-0');
    const countryNameArray = countryLabelData.map(l => {
      return new TupleParam([
        l.meta.name_zh ?? l.name, [...l.meta.includes.map(n => n.toLowerCase()), l.name.toLowerCase()]
      ]);
    });
    console.log(`Got ${countryNameArray.length} country data.`);

    const contributionsArray: any[] = [];
    for (const row of contributions) {
      contributionsArray.push(new TupleParam([+row.id, +row.openrank[0], +row.openrankDetails[0].length]));
    }

    const countryContributions = await query(`
WITH
  contributions AS (
    SELECT tupleElement(item, 1) AS id, tupleElement(item, 2) AS openrank, tupleElement(item, 3) AS repo_count
    FROM (SELECT {contributionsArray:Array(Tuple(UInt64,Float64,UInt64))} AS contributionsArray)
    ARRAY JOIN contributionsArray AS item),
  country_names AS (
    SELECT tupleElement(item, 1) AS name, tupleElement(item, 2) AS aliases
    FROM (SELECT {countryNameArray:Array(Tuple(String,Array(String)))} AS countryNameArray)
    ARRAY JOIN countryNameArray AS item )
SELECT country, SUM(openrank) AS openrank, COUNT(id) AS total_dev_count, SUM(repo_count) AS repo_count FROM
  (SELECT u.id AS id, any(repo_count) AS repo_count, any(country_names.name) AS country, any(openrank) AS openrank FROM
    (SELECT id, location FROM gh_user_info WHERE location != '') u,
    (SELECT location, if(country IN ['Macao', 'Hong Kong', 'Taiwan'], 'China', country) AS country
      FROM location_info WHERE status = 'normal' AND country != '') l,
    contributions, country_names
  WHERE u.location=l.location AND has(country_names.aliases, lower(l.country)) AND u.id=contributions.id
  GROUP BY id)
GROUP BY country
ORDER BY openrank DESC
LIMIT ${limit}
  `,
      { query_params: { contributionsArray, countryNameArray } });
    const res = {
      title: `${year} Apache 基金会${china ? '中国项目' : ''}全球各国家开发者贡献度排行榜 Top ${limit}`,
      data: countryContributions.map((r, i) => ({
        rank: i + 1,
        name: (countryInfo.find(c => c.name_zh === r[0])?.flag ?? '') + ' ' + r[0],
        openrank: +r[1].toFixed(2),
        devCount: +r[2],
        repoCount: +r[3],
      })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 100 },
        { name: '国家', type: 'String', fields: ['name'], width: 300 },
        { name: 'OpenRank 贡献度', type: 'String', fields: ['openrank'], width: 300 },
        { name: '开发者总数', type: 'String', fields: ['devCount'], width: 300 },
        { name: '贡献仓库数', type: 'String', fields: ['repoCount'], width: 300 },
      ]
    };
    if (print) {
      console.log(JSON.stringify(res));
    }
    return res;
  };

  const countryContributionTrending = async () => {
    let result = new Map<string, number[]>();
    for (let year = 2025; year >= 2020; year--) {
      const res = await countryContributionLeaderborad(year, false);
      res.data.map(row => {
        if (!result.has(row.name)) result.set(row.name, []);
        result.get(row.name)!.push(row.openrank);
      });
    }
    const arr = Array.from(result.entries()).sort((a, b) => b[1][0] - a[1][0]).map(a => ({
      name: a[0], openrank: a[1].reverse(),
    })).slice(0, 10);

    const option = {
      title: { text: '2020 - 2025 Apache 基金会各国开发者贡献度趋势', left: 'center' },
      legend: { data: arr.map(a => a.name), bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: [2020, 2021, 2022, 2023, 2024, 2025] },
      yAxis: { type: 'value' },
      series: arr.map(a => ({ name: a.name, data: a.openrank, type: 'line' })),
    };

    console.log(JSON.stringify(option));
  };

  const countyContributionLeaderboardOfChina = async () => {
    countryContributionLeaderborad(2025, true, true);
  };

  // 2025 全球各国开发者贡献排行榜
  await countryContributionLeaderborad(2025);
  // 2021 至 2025 全球各国开发者贡献趋势图
  await countryContributionTrending();
  // 2025 中国项目全球各国开发者贡献排行榜
  await countyContributionLeaderboardOfChina();
})();
