import { query } from "../db/clickhouse";
import { getLabelData } from "../labelDataUtils";
import { getLogger } from "../utils";

(async () => {
  const logger = getLogger('GlobalDeveloperAnalysis');
  const endYear = 2024;
  const years: number[] = [];
  for (let y = 2015; y <= endYear; y++) {
    years.push(y);
  }

  const pullAndCodeStats = async () => {
    // how many prs merged with how many code line changes per hour in 2025.3
    const res = await query<number[]>(`
    SELECT avg(c), avg(cc) FROM
    (
      SELECT COUNT() AS c,
        SUM(pull_deletions + pull_additions) AS cc ,
        ROUND(toYYYYMMDDhhmmss(created_at) / 10000) AS t
      FROM events
      WHERE toYYYYMM(created_at) = 202503 AND type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1
      GROUP BY t
    )`);
    const [pr, codeChange] = res[0].map(i => Math.round(i));
    logger.info(`In average, ${pr} PRs with ${codeChange} code line changes merged on GitHub/Gitee per hour.`);
  };

  const ossDeveloperOverview = async () => {
    const githubTotalUsers = [
      { "year": 2020, "count": 53248431 },
      { "year": 2021, "count": 68834671 },
      { "year": 2022, "count": 87669771 },
      { "year": 2023, "count": 109933535 },
      { "year": 2024, "count": 133336845 }
    ];

    const githubCountryUsers = new Map([
      ['US', [{ "year": 2020, "count": 11086139 }, { "year": 2021, "count": 13515151 }, { "year": 2022, "count": 16686238 }, { "year": 2023, "count": 20226711 }, { "year": 2024, "count": 23845773 }]],
      ['IN', [{ "year": 2020, "count": 5206926 }, { "year": 2021, "count": 7243683 }, { "year": 2022, "count": 9796437 }, { "year": 2023, "count": 13326416 }, { "year": 2024, "count": 17114921 }]],
      ['CN', [{ "year": 2020, "count": 7576250 }, { "year": 2021, "count": 9092544 }, { "year": 2022, "count": 10521274 }, { "year": 2023, "count": 11898754 }, { "year": 2024, "count": 13469081 }]],
      ['GB', [{ "year": 2020, "count": 1843208 }, { "year": 2021, "count": 2272740 }, { "year": 2022, "count": 2805910 }, { "year": 2023, "count": 3422806 }, { "year": 2024, "count": 4080458 }]],
    ]);

    const countries = [...githubCountryUsers.keys(), 'Others'];
    const githubUserYears = githubTotalUsers.map(i => i.year);
    logger.info(JSON.stringify({
      title: { text: '全球 GitHub 注册用户发展趋势', left: 'center', top: 'bottom' },
      xAxis: { type: 'category', data: githubUserYears.map(i => `${i}`) },
      yAxis: { type: 'value' },
      legend: { data: countries },
      series: countries.map(c => ({
        name: c,
        data: githubCountryUsers.get(c)?.map(i => i.count) ??
          githubUserYears.map(y => githubTotalUsers.find(i => i.year == y)!.count - Array.from(githubCountryUsers.values()).map(i => i.find(j => j.year == y)!.count).reduce((p, c) => p + c)),
        type: 'line',
        smooth: true,
        stack: 'Total',
        areaStyle: {},
      })),
    }));

    // how many open source developers on GitHub
    const totalOssDeveloperCountRes = await query(
      `SELECT COUNT(DISTINCT actor_id) FROM global_openrank WHERE platform='GitHub'`);
    const totalOssDeveloperCount = totalOssDeveloperCountRes[0][0];
    logger.info(`${totalOssDeveloperCount} open source developers on GitHub in total.`);

    // how many open source developers has valid country information
    const ossDevelopersWithCountryRes = await query(`
    SELECT COUNT(DISTINCT actor_id) FROM global_openrank WHERE platform ='GitHub' AND actor_id IN
    (SELECT id FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location
    )`);
    const ossDevelopersWithCountry = ossDevelopersWithCountryRes[0][0];
    logger.info(`${ossDevelopersWithCountry} open source developers has valid country info.`);

    logger.info(`Open source developers with valid country info ratio: ${Math.round(ossDevelopersWithCountry * 10000 / totalOssDeveloperCount) / 100}%.`);

    // For OpenRank top developers in 2024, how many of them has valid country info
    const topNum = 100000;
    const totalOssDevelopersSingleYearRes = await query(`
    SELECT COUNT(DISTINCT actor_id)
    FROM global_openrank
    WHERE type='User' AND toYear(created_at)=2024 AND legacy=0 AND platform='GitHub'`);
    const totalOssDevelopersSingleYear = totalOssDevelopersSingleYearRes[0][0];
    logger.info(`Total open source developers in 2024 is ${totalOssDevelopersSingleYear}`);
    const topDevelopersTotalOpenRankRes = await query(`
    SELECT SUM(o) FROM
    (
      SELECT SUM(openrank) AS o
      FROM global_openrank
      WHERE type='User' AND toYear(created_at)=2024 AND legacy=0 AND platform='GitHub'
      GROUP BY actor_id
      ORDER BY o DESC LIMIT ${topNum}
    )`);
    const topDevelopersTotalOpenRank = topDevelopersTotalOpenRankRes[0][0];
    const totalDeveloperOpenRankRes = await query(`
      SELECT SUM(openrank)
      FROM global_openrank
      WHERE type='User' AND toYear(created_at)=2024 AND legacy=0 AND platform='GitHub'`);
    const totalDeveloperOpenRank = totalDeveloperOpenRankRes[0][0];
    logger.info(`Top developers OpenRank ratio is ${Math.round((topDevelopersTotalOpenRank * 10000 / totalDeveloperOpenRank) / 100)}%.`);
    const topDevelopersWithValidCountryRes = await query(`
    SELECT COUNT() FROM
    (
      SELECT actor_id
      FROM global_openrank
      WHERE type='User' AND toYear(created_at)=2024 AND legacy=0 AND platform='GitHub'
      GROUP BY actor_id
      ORDER BY SUM(openrank) DESC LIMIT ${topNum}
    )
    WHERE actor_id IN
    (
      SELECT id FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location
    )`);
    const topDevelopersWithValidCountry = topDevelopersWithValidCountryRes[0][0];
    logger.info(`${topDevelopersWithValidCountry} developers has valid country info for top ${topNum} developers.`);
  };

  const ossDeveloperCountyStat = async () => {
    // how many open source developers on GitHub
    const totalOssDeveloperCountRes = await query(
      `SELECT COUNT(DISTINCT actor_id) FROM global_openrank WHERE type='User' AND legacy=0 AND platform='GitHub'`);
    const totalOssDeveloperCount = totalOssDeveloperCountRes[0][0];

    // how many open source developers on Gitee GVP projects
    const totalOssDevelopersGiteeRes = await query(
      `SELECT COUNT(DISTINCT actor_id) FROM global_openrank WHERE type='User' AND legacy=0 AND platform='Gitee'`);
    const totalOssDevelopersGitee = totalOssDevelopersGiteeRes[0][0];
    logger.info(`Gitee open source developers: ${totalOssDevelopersGitee}`);

    // how many open source developers has valid country information
    const ossDevelopersWithCountryRes = await query(`
    SELECT COUNT(DISTINCT actor_id) FROM global_openrank
    WHERE type='User' AND legacy=0 AND platform ='GitHub' AND actor_id IN
    (SELECT id FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location
    )`);
    const ossDevelopersWithCountry = ossDevelopersWithCountryRes[0][0];

    const ossDeveloperCountryRes = await query<[string, number]>(`
    SELECT country, COUNT() FROM
    (SELECT u.id AS id, l.country AS country FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location)
    GROUP BY country
    ORDER BY COUNT() DESC`);

    logger.info(`Top countries are: ${ossDeveloperCountryRes.map(i => i[0]).slice(0, 20).join(',')}`);
    logger.info(`Top 3 countries are: ${ossDeveloperCountryRes.slice(0, 3).map(i => `${i[0]}:${i[1]}`).join(',')}`);

    const estimateNumber = ossDeveloperCountryRes.map(i => ({
      name: i[0],
      value: +(i[1] * totalOssDeveloperCount / (ossDevelopersWithCountry * 10000)).toFixed(2),
    })).filter(i => i.value > 0);

    logger.info(JSON.stringify(estimateNumber));
  };

  const ossDeveloperTrending = async () => {
    // active open source developers each year
    const ossTotalDeveloperEachYearRes = await query(`
    SELECT toYear(created_at) AS year, COUNT(DISTINCT actor_id) FROM global_openrank
    WHERE type='User' AND legacy=0 AND platform='GitHub' AND year <= ${endYear}
    GROUP BY year ORDER BY year
    `);
    const ossTotalDeveloperEachYearMap = new Map<number, number>(ossTotalDeveloperEachYearRes.map(row => [+row[0], +row[1]]));
    // active open source developers with location each year
    const ossTotalDeveloperWithCountryEachYearRes = await query(`
    SELECT toYear(created_at) AS year, COUNT(DISTINCT actor_id) FROM global_openrank
    WHERE type='User' AND legacy=0 AND platform='GitHub' AND year <= ${endYear} AND actor_id IN
    (SELECT u.id AS id FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location)
    GROUP BY year ORDER BY year
    `);
    const ossTotalDeveloperWithCountryEachYearMap = new Map<number, number>(ossTotalDeveloperWithCountryEachYearRes.map(row => [+row[0], +row[1]]));
    // active open source developers on Gitee each year
    const ossDevelopersEachYearGiteeRes = await query(`
    SELECT toYear(created_at) AS year, COUNT(DISTINCT actor_id) FROM global_openrank
    WHERE type='User' AND legacy=0 AND platform='Gitee' AND year<=${endYear}
    GROUP BY year ORDER BY year
    `);
    // active open source developers from each country with location each year
    const ossDevelopersWithCountryRes = await query(`
    SELECT a.year AS year, b.country AS country, COUNT(), SUM(o) FROM
    (SELECT toYear(created_at) AS year, actor_id, SUM(openrank) AS o FROM global_openrank
    WHERE type='User' AND legacy=0 AND platform='GitHub' AND year <= ${endYear}
    GROUP BY actor_id, year
    ORDER BY year) a,
    (SELECT u.id AS id, l.country AS country FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location) b
    WHERE a.actor_id=b.id
    GROUP BY country, year
    `);
    const ossDevelopersWithCountryMap = new Map<number, { name: string, count: number, openrank: number }[]>();
    ossDevelopersWithCountryRes.forEach(row => {
      let [year, country, count, openrank] = row;
      if (['Macao', 'Hong Kong', 'Taiwan'].includes(country)) {
        country = 'China';
      }
      if (!ossDevelopersWithCountryMap.has(year)) {
        ossDevelopersWithCountryMap.set(year, []);
      }
      const arr = ossDevelopersWithCountryMap.get(year)!;
      const index = arr.findIndex(i => i.name === country);
      if (index >= 0) {
        arr[index].count += +count;
        arr[index].openrank += +openrank;
      } else {
        arr.push({ name: country, count: +count, openrank: +openrank });
      }
    });
    for (const [year, c] of ossDevelopersWithCountryMap.entries()) {
      c.forEach(i => i.count = Math.round(i.count * ossTotalDeveloperEachYearMap.get(year)! / ossTotalDeveloperWithCountryEachYearMap.get(year)!));
    }
    logger.info(`Last 10 years open source developers change with Gitee:`);
    for (const year of years) {
      ossDevelopersWithCountryMap.get(year)!.find(i => i.name === 'China')!.count += +ossDevelopersEachYearGiteeRes.find(i => +i[0] === year)![1];
      const countries = ossDevelopersWithCountryMap.get(year)!.sort((a, b) => b.count - a.count).slice(0, 5);
      logger.info(`Year ${year}: ${countries.map(i => `${i.name}:${i.count}(${Math.round(i.count * 10000 / ossTotalDeveloperEachYearMap.get(year)!) / 100}%)`).join(',')}`)
    }
    const recentTop10DeveloperCountries = ossDevelopersWithCountryMap.get(endYear)!.sort((a, b) => b.count - a.count).slice(0, 10);
    const recentTop10DeveloperCountRes: any[] = [];
    for (const c of recentTop10DeveloperCountries) {
      recentTop10DeveloperCountRes.push({
        name: c.name,
        data: years.map(y => ossDevelopersWithCountryMap.get(y)!.find(i => i.name === c.name)!.count),
      });
    }
    logger.info(JSON.stringify({
      title: { text: '各国活跃开源开发者十年变化', left: 'center', top: 'bottom' },
      xAxis: { type: 'category', data: years.map(y => `${y}`) },
      yAxis: { type: 'value' },
      legend: {},
      series: recentTop10DeveloperCountRes.map(i => ({ ...i, type: 'line', smooth: true })),
    }));
    // gitee developers OpenRank each year
    const giteeDevelopersOpenRankEachYearRes = await query(`
    SELECT toYear(created_at) AS year, SUM(openrank) FROM global_openrank
    WHERE year <= ${endYear} AND year >= 2015 AND type='User' AND legacy=0 AND platform='Gitee'
    GROUP BY year
    `);
    logger.info(`Last 10 years open source developers OpenRank change with Gitee:`);
    for (const year of years) {
      ossDevelopersWithCountryMap.get(year)!.find(i => i.name === 'China')!.openrank += giteeDevelopersOpenRankEachYearRes.find(i => +i[0] === year)![1];
      const countries = ossDevelopersWithCountryMap.get(year)!.sort((a, b) => b.openrank - a.openrank);
      const openrank = ossDevelopersWithCountryMap.get(year)!.map(i => i.openrank).reduce((p, c) => p + c);
      logger.info(`Year ${year}: ${countries.slice(0, 5).map(i => `${i.name}:${i.openrank.toFixed(2)}(${Math.round(i.openrank * 10000 / openrank) / 100}%)`).join(',')}`);
    }
    const recentTop10OpenRankCountries = ossDevelopersWithCountryMap.get(endYear)!.sort((a, b) => b.openrank - a.openrank).slice(0, 10);
    const recentTop10DeveloperOpenRankRes: any[] = [];
    for (const c of recentTop10OpenRankCountries) {
      recentTop10DeveloperOpenRankRes.push({
        name: c.name,
        data: years.map(y => Math.round(ossDevelopersWithCountryMap.get(y)!.find(i => i.name === c.name)!.openrank)),
      });
    }
    logger.info(JSON.stringify({
      title: { text: '各国开源开发者 OpenRank 影响力十年变化', left: 'center', top: 'bottom' },
      xAxis: { type: 'category', data: years.map(y => `${y}`) },
      yAxis: { type: 'value' },
      legend: {},
      series: recentTop10DeveloperOpenRankRes.map(i => ({ ...i, type: 'line', smooth: true })),
    }));
    logger.info(recentTop10DeveloperOpenRankRes.map(i => `${i.name}:${((i.data[years.length - 1] - i.data[years.length - 2]) * 100 / i.data[years.length - 2]).toFixed(2)}%`).join(','));
  };

  const ossDeveloperContribution = async () => {
    const githubContributionRes = await query(`
    SELECT b.country AS country, a.year AS year, SUM(a.openrank) AS openrank FROM
    (SELECT
        toYear(g.created_at) AS year,
        g.platform AS platform,
        g.repo_id AS repo_id,
        argMax(g.repo_name, g.created_at) AS repo_name,
        argMax(g.org_id, g.created_at) AS org_id,
        argMax(g.org_login, g.created_at) AS org_login,
        c.actor_id AS actor_id,
        argMax(c.actor_login, c.created_at) AS actor_login,
        SUM(c.openrank * g.openrank / r.openrank) AS openrank
      FROM
        (SELECT * FROM community_openrank WHERE repo_id IN (SELECT id FROM export_repo)) c,
        (SELECT * FROM global_openrank WHERE repo_id IN (SELECT id FROM export_repo)) g,
        (SELECT repo_id, platform, created_at, SUM(openrank) AS openrank FROM community_openrank WHERE actor_id > 0 AND repo_id IN (SELECT id FROM export_repo) GROUP BY repo_id, platform, created_at) r
      WHERE
        c.actor_id > 0
        AND c.repo_id = g.repo_id
        AND c.platform = g.platform
        AND c.created_at = g.created_at
        AND g.repo_id = r.repo_id
        AND g.platform = r.platform
        AND g.created_at = r.created_at
      GROUP BY
        platform, repo_id, actor_id, year) a,
      (SELECT u.id AS id, l.country AS country FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location) b
      WHERE a.actor_id=b.id
      GROUP BY country, year
      ORDER BY openrank DESC
        `);
    const giteeContributionRes = await query(`
    SELECT year, SUM(openrank) FROM
    (SELECT
        toYear(g.created_at) AS year,
        g.platform AS platform,
        g.repo_id AS repo_id,
        argMax(g.repo_name, g.created_at) AS repo_name,
        argMax(g.org_id, g.created_at) AS org_id,
        argMax(g.org_login, g.created_at) AS org_login,
        c.actor_id AS actor_id,
        argMax(c.actor_login, c.created_at) AS actor_login,
        SUM(c.openrank * g.openrank / r.openrank) AS openrank
      FROM
        (SELECT * FROM community_openrank WHERE platform='Gitee') c,
        (SELECT * FROM global_openrank WHERE platform='Gitee') g,
        (SELECT repo_id, platform, created_at, SUM(openrank) AS openrank FROM community_openrank WHERE actor_id > 0 AND platform='Gitee' GROUP BY repo_id, platform, created_at) r
      WHERE
        c.actor_id > 0
        AND c.repo_id = g.repo_id
        AND c.platform = g.platform
        AND c.created_at = g.created_at
        AND g.repo_id = r.repo_id
        AND g.platform = r.platform
        AND g.created_at = r.created_at
      GROUP BY
        platform, repo_id, actor_id, year)
      GROUP BY year
    `);

    const countries = githubContributionRes.filter(i => i[1] === endYear).sort((a, b) => b[2] - a[2]).slice(0, 10).map(i => i[0]);
    let data: any[] = [];
    for (const c of countries) {
      const cs = [c];
      const openrankValues: number[] = [];
      if (c === 'China') cs.push('Macao', 'Hong Kong', 'Taiwan');
      for (const y of years) {
        let openrank = githubContributionRes.filter(i => cs.includes(i[0]) && i[1] === y).map(i => i[2]).reduce((p, c) => p + c);
        if (c === 'China') openrank += giteeContributionRes.find(i => i[0] === y)![1];
        openrankValues.push(Math.round(openrank));
      }
      data.push({
        name: c,
        data: openrankValues,
      });
    }
    data = data.sort((a, b) => b.data[b.data.length - 1] - a.data[a.data.length - 1]);
    logger.info(JSON.stringify({
      title: { text: '各国开源开发者 OpenRank 贡献度十年变化', left: 'center', top: 'bottom' },
      xAxis: { type: 'category', data: years.map(y => `${y}`) },
      yAxis: { type: 'value' },
      legend: {},
      series: data.map(i => ({ ...i, type: 'line', smooth: true })),
    }));
    logger.info(data.map(i => `${i.name}:${((i.data[years.length - 1] - i.data[years.length - 2]) * 100 / i.data[years.length - 2]).toFixed(2)}%`).join(','));
  };

  const ossContributionToChinaAndUSAProjects = async () => {
    const years = [endYear];
    const githubContributionRes = await query(`
    SELECT b.country AS country, a.year AS year, repo_id, any(org_id) AS org_id, SUM(a.openrank) AS openrank FROM
    (SELECT
        toYear(g.created_at) AS year,
        g.platform AS platform,
        g.repo_id AS repo_id,
        argMax(g.repo_name, g.created_at) AS repo_name,
        argMax(g.org_id, g.created_at) AS org_id,
        argMax(g.org_login, g.created_at) AS org_login,
        c.actor_id AS actor_id,
        argMax(c.actor_login, c.created_at) AS actor_login,
        SUM(c.openrank * g.openrank / r.openrank) AS openrank
      FROM
        (SELECT * FROM community_openrank WHERE repo_id IN (SELECT id FROM export_repo)) c,
        (SELECT * FROM global_openrank WHERE repo_id IN (SELECT id FROM export_repo)) g,
        (SELECT repo_id, platform, created_at, SUM(openrank) AS openrank FROM community_openrank WHERE actor_id > 0 AND repo_id IN (SELECT id FROM export_repo) GROUP BY repo_id, platform, created_at) r
      WHERE
        c.actor_id > 0
        AND c.repo_id = g.repo_id
        AND c.platform = g.platform
        AND c.created_at = g.created_at
        AND g.repo_id = r.repo_id
        AND g.platform = r.platform
        AND g.created_at = r.created_at
      GROUP BY
        platform, repo_id, actor_id, year) a,
      (SELECT u.id AS id, l.country AS country FROM
      (SELECT DISTINCT(id) AS id, location FROM gh_user_info WHERE location != '') u,
      (SELECT location, country FROM location_info WHERE status = 'normal' AND country != '') l
      WHERE u.location=l.location) b
      WHERE a.actor_id=b.id
      GROUP BY country, year, repo_id
      HAVING year IN (${years.join(',')})
        `);
    logger.info(`Got ${githubContributionRes.length} contribution records.`);
    const labels = getLabelData();
    const contributionMap = new Map<string, Map<number, { name: string; value: number; ratio: number }[]>>();
    const findContributions = (id: string) => {
      const l = labels.find(i => i.identifier === id)!.platforms.find(p => p.name === 'GitHub')!;
      const contributions = githubContributionRes.filter(row => l.orgs.map(r => r.id).includes(+row[3]) || l.repos.map(r => r.id).includes(+row[2]));
      logger.info(`Got ${contributions.length} contributions records for ${id}`);
      const map = new Map<number, { name: string; value: number; ratio: number }[]>();
      contributionMap.set(id, map);
      const totalOpenRank = new Map<number, number>();
      for (const y of years) {
        totalOpenRank.set(y, contributions.filter(row => row[1] === y).map(row => row[4]).reduce((p, c) => p + c));
      }
      for (const row of contributions) {
        let [c, year, _repoId, _orgId, openrank] = row;

        if (!map.has(+year)) {
          map.set(+year, []);
        }
        const arr = map.get(+year)!;
        if (['Macao', 'Hong Kong', 'Taiwan'].includes(c)) {
          c = 'China';
        }
        const idx = arr.findIndex(i => i.name === c);
        if (idx >= 0) {
          arr[idx].value += openrank;
          arr[idx].ratio += openrank / totalOpenRank.get(year)!;
        } else {
          arr.push({ name: c, value: openrank, ratio: openrank / totalOpenRank.get(year)! });
        }
      }

      return map.get(endYear)!.sort((a, b) => b.value - a.value).filter(i => i.ratio > 0.01);
    };
    const ids = [':regions/CN', ':regions/US'];

    ids.forEach(findContributions);

    const outputNumber = 10;
    ids.forEach(id => {
      years.forEach(y => {
        logger.info(JSON.stringify({
          title: `${y} ${id} 自主开源项目全球贡献分布 Top ${outputNumber}`,
          data: contributionMap.get(id)!.get(y)!.sort((a, b) => b.value - a.value).slice(0, outputNumber).map((r, i) => ({ rank: i + 1, ...r, value: r.value.toFixed(2), ratio: (r.ratio * 100).toFixed(2) + '%' })),
          options: [
            { name: '#', type: 'String', fields: ['rank'], width: 80 },
            { name: '国家', type: 'String', fields: ['name'], width: 400 },
            { name: 'OpenRank 贡献度', type: 'String', fields: ['value'], width: 400 },
            { name: '贡献度占比', type: 'String', fields: ['ratio'], width: 400 },
          ]
        }));
      });
    });
  };

  await pullAndCodeStats();
  await ossDeveloperOverview();
  await ossDeveloperCountyStat();
  await ossDeveloperTrending();
  await ossDeveloperContribution();
  await ossContributionToChinaAndUSAProjects();
})();
