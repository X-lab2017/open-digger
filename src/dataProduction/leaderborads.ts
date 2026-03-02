import { writeFileSync } from 'fs';
import { getLabelData } from '../labelDataUtils';
import { QueryConfig } from '../metrics/basic';
import { getBasicRepoStats, getRepoOpenrank } from '../metrics/indices';
import { countryInfo, countryFlagMap } from '../static/countries';
import { query } from '../db/clickhouse';
import { repoParticipants } from '../metrics/metrics';

(async () => {
  const openDiggerOssUrl = 'https://oss.open-digger.cn/';
  const labels = getLabelData();
  const startYear = 2025, startMonth = 1, endYear = 2025, endMonth = 12;
  const defaultOption: QueryConfig = {
    startYear, startMonth, endYear, endMonth,
    order: 'DESC', limit: 101, limitOption: 'all', precision: 2,
  };
  const getLogoUrl = (id: string) => id ? `${openDiggerOssUrl}logos/${id.split(':')[1]}.png` : null;

  const produceDivisionsData = async () => {
    const countryMultipleRes = await query(`
SELECT
  name,
  toUInt64OrNull(JSONExtractString(data, 'developers', -1, 'count')) / u.c
FROM
  labels l,
  (SELECT
    country,
    COUNT(DISTINCT id) AS c
  FROM
    user_info
  WHERE
    country != '' AND
    province != ''
  GROUP BY country) u
WHERE
  type = 'Division-0' AND
  notEmpty(JSONExtractArrayRaw(data, 'developers')) AND
  u.country = l.name
    `);
    const countryMultipleMap = new Map<string, number>();
    countryMultipleRes.forEach(row => {
      countryMultipleMap.set(row[0], +row[1]);
    });

    const data = await query(`
SELECT
    country,
    country_zh,
    province,
    province_zh,
    COUNT(DISTINCT id) AS user_count,
    SUM(ifNull(openrank, 0)) AS openrank
FROM
    (SELECT
        u.id AS id,
        u.platform AS platform,
        u.country AS country,
        u.country_zh AS country_zh,
        u.province AS province,
        u.province_zh AS province_zh,
        ifNull(argMax(g.openrank, g.created_at), 0) AS openrank
    FROM
        user_info u
    LEFT JOIN
        global_openrank g
    ON
        u.id = g.actor_id AND u.platform = g.platform AND g.type = 'User'
        AND toYYYYMM(g.created_at) >= ${startYear}${startMonth.toString().padStart(2, '0')} AND
        toYYYYMM(g.created_at) <= ${endYear}${endMonth.toString().padStart(2, '0')}
    WHERE
        u.country != '' AND u.province != ''
    GROUP BY
        id, platform, country, country_zh, province, province_zh
    )
GROUP BY
    country, country_zh, province, province_zh
ORDER BY
    openrank DESC;
    `);

    const ret = data.map((row, i) => ({
      rank: i + 1,
      country: row[0],
      country_zh: row[1],
      province: row[2],
      province_zh: row[3],
      developerCount: +(countryMultipleMap.get(row[0])! * +row[4] / 10000).toFixed(2),
      openrank: +(+row[5]).toFixed(2),
    })).filter(i => i.developerCount);

    writeFileSync('local_files/leaderboards/divisions.json', JSON.stringify({
      title: 'Global Administrative Divisions Developer OpenRank Top 100',
      title_zh: '全球各国行政区划开发者 OpenRank 排行榜 Top 100',
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: 'Administrative Division', type: 'String', fields: ['province'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 300 },
        { name: 'Developer Count (10k)', type: 'String', fields: ['developerCount'], width: 300 },
        { name: 'Country', type: 'String', fields: ['country'], width: 300 },
      ],
      options_zh: [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: '行政区划', type: 'String', fields: ['province_zh'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 300 },
        { name: '开发者数量(万)', type: 'String', fields: ['developerCount'], width: 300 },
        { name: '所属国家', type: 'String', fields: ['country_zh'], width: 300 },
      ],
      data: ret.slice(0, 100),
    }));

    writeFileSync('local_files/leaderboards/divisions-cn.json', JSON.stringify({
      title: 'Chinese Administrative Divisions Developer OpenRank',
      title_zh: '中国各行政区划开发者 OpenRank 排行榜',
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: 'Administrative Division', type: 'String', fields: ['province'], width: 400 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 400 },
        { name: 'Developer Count (10k)', type: 'String', fields: ['developerCount'], width: 400 },
      ],
      options_zh: [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: '行政区划', type: 'String', fields: ['province_zh'], width: 400 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 400 },
        { name: '开发者数量(万)', type: 'String', fields: ['developerCount'], width: 400 },
      ],
      data: ret.filter(i => i.country === 'China').map((i, index) => ({ ...i, rank: index + 1 })),
    }));

  };

  const produceProjectData = async (isChinese: boolean = false) => {
    const data = (await getRepoOpenrank({
      ...defaultOption,
      labelIntersect: isChinese ? [':divisions/CN'] : undefined,
      groupBy: 'Project',
    })).filter(i => i.id !== 'Others');
    const participantsData = (await repoParticipants({
      ...defaultOption,
      labelIntersect: isChinese ? [':divisions/CN'] : undefined,
      limit: -1, groupBy: 'Project',
    })).filter(i => i.id !== 'Others');
    const ret: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const id = row.id;
      const openrank = +row.openrank[0];
      const label = labels.find(l => l.identifier === id);
      if (!label) {
        throw new Error(`Label not found: ${id}`);
      }
      let initiator = '';
      let initiatorId = '';
      for (const type of [':foundations', ':companies', ':universities', ':agencies']) {
        const parent = label.parents.find(p => p.startsWith(type));
        if (parent) {
          const parentLabel = labels.find(l => l.identifier === parent);
          initiator = parentLabel!.name;
          initiatorId = parent;
          break;
        }
      }
      const findCountry = (labelId: string) => {
        const label = labels.find(l => l.identifier === labelId)!;
        const countryLabelId = label.parents.find(p => p.startsWith(':divisions'));
        if (countryLabelId) {
          const countryLabel = labels.find(l => l.identifier === countryLabelId)!;
          if (countryLabel.type !== 'Division-0') {
            return findCountry(countryLabel.parents[0]);
          }
          if (!countryFlagMap.has(countryLabel.name)) {
            throw new Error(`Country flag not found: ${countryLabel.name}`);
          }
          return countryFlagMap.get(countryLabel!.name);
        }
        for (const parent of label.parents) {
          const c = findCountry(parent);
          if (c) return c;
        }
        return null;
      };
      const country = findCountry(initiatorId || label.identifier) ?? '';
      ret.push({
        rank: i + 1,
        id,
        name: label.name,
        logo: getLogoUrl(id),
        openrank,
        developerCount: +participantsData.find(row => row.id === id).count[0],
        platforms: label.platforms.map(p => p.name),
        initiator,
        initiatorId,
        initiatorLogo: getLogoUrl(initiatorId),
        country,
      });
    }

    const result: any = {
      data: ret,
    };
    if (isChinese) {
      result.title = 'Chinese Project OpenRank Leaderboard Top 100';
      result.title_zh = '中国开源项目 OpenRank 排行榜 Top 100';
      result.options = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: 'Project', type: 'StringWithIcon', fields: ['name', 'logo'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 300 },
        { name: 'Developer Count', type: 'String', fields: ['developerCount'], width: 300 },
        { name: 'Initiator', type: 'StringWithIcon', fields: ['initiator', 'initiatorLogo'], width: 300 },
      ];
      result.options_zh = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: '项目名称', type: 'StringWithIcon', fields: ['name', 'logo'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 300 },
        { name: '开发者规模', type: 'String', fields: ['developerCount'], width: 300 },
        { name: '发起组织', type: 'StringWithIcon', fields: ['initiator', 'initiatorLogo'], width: 300 },
      ];
    } else {
      result.title = 'Global Project OpenRank Leaderboard Top 100';
      result.title_zh = '全球开源项目 OpenRank 排行榜 Top 100';
      result.options = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: 'Project', type: 'StringWithIcon', fields: ['name', 'logo'], width: 200 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 180 },
        { name: 'Developer Count', type: 'String', fields: ['developerCount'], width: 180 },
        { name: 'Initiator', type: 'StringWithIcon', fields: ['initiator', 'initiatorLogo'], width: 250 },
        { name: 'Initiator Country', type: 'String', fields: ['country'], width: 150 },
      ];
      result.options_zh = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: '项目名称', type: 'StringWithIcon', fields: ['name', 'logo'], width: 200 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 180 },
        { name: '开发者规模', type: 'String', fields: ['developerCount'], width: 180 },
        { name: '发起组织', type: 'StringWithIcon', fields: ['initiator', 'initiatorLogo'], width: 250 },
        { name: '发起组织所在国家', type: 'String', fields: ['country'], width: 150 },
      ];
    }
    writeFileSync(`local_files/leaderboards/projects${isChinese ? '-cn' : ''}.json`, JSON.stringify(result));
  };

  const produceCompanyData = async (isChinese: boolean = false) => {
    const data = (await getRepoOpenrank({
      ...defaultOption,
      labelIntersect: isChinese ? [':divisions/CN'] : undefined,
      groupBy: 'Company',
    })).filter(i => i.id !== 'Others');
    const basicStatsData = (await getBasicRepoStats({
      ...defaultOption,
      labelIntersect: isChinese ? [':divisions/CN'] : undefined,
      limit: -1, groupBy: 'Company',
    })).filter(i => i.id !== 'Others');
    const ret: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const id = row.id;
      const openrank = +row.openrank[0];
      const label = labels.find(l => l.identifier === id)!;
      const findCountry = (labelId: string) => {
        if (isChinese) return null;
        const label = labels.find(l => l.identifier === labelId)!;
        const countryLabelId = label.parents.find(p => p.startsWith(':divisions'));
        if (countryLabelId) {
          const countryLabel = labels.find(l => l.identifier === countryLabelId)!;
          const countryItem = countryInfo.find(c => c.name === countryLabel.name);
          if (!countryItem) {
            throw new Error(`Country flag not found: ${countryLabel.name}`);
          }
          return {
            country: `${countryItem.flag}${countryItem.name}`,
            country_zh: `${countryItem.flag}${countryItem.name_zh}`,
          };
        }
        for (const parent of label.parents) {
          const c = findCountry(parent);
          if (c) return c;
        }
        return null;
      };
      const country = findCountry(label.identifier) ?? '';
      const basicStatsItem = basicStatsData.find(row => row.id === id)!;
      ret.push({
        rank: i + 1,
        id,
        name: label.name,
        logo: getLogoUrl(id),
        openrank,
        repoCount: +basicStatsItem.repo_count[0],
        orgCount: +basicStatsItem.org_count[0],
        developerCount: +basicStatsItem.participants[0],
        platforms: label.platforms.map(p => p.name),
        ...country,
      });
    }
    const result: any = {
      data: ret,
    };
    if (isChinese) {
      result.title = 'Chinese Company OpenRank Leaderboard Top 100';
      result.title_zh = '中国开源企业 OpenRank 排行榜 Top 100';
      result.options = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: 'Company', type: 'StringWithIcon', fields: ['name', 'logo'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 300 },
        { name: 'Repo Count', type: 'String', fields: ['repoCount'], width: 250 },
        { name: 'Developer Count', type: 'String', fields: ['developerCount'], width: 250 },
      ];
      result.options_zh = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: '企业名称', type: 'StringWithIcon', fields: ['name', 'logo'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 300 },
        { name: '活跃仓库数', type: 'String', fields: ['repoCount'], width: 250 },
        { name: '活跃开发者数', type: 'String', fields: ['developerCount'], width: 250 },
      ];
    } else {
      result.title = 'Global Company OpenRank Leaderboard Top 100';
      result.title_zh = '全球开源企业 OpenRank 排行榜 Top 100';
      result.options = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: 'Company', type: 'StringWithIcon', fields: ['name', 'logo'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 200 },
        { name: 'Repo Count', type: 'String', fields: ['repoCount'], width: 200 },
        { name: 'Developer Count', type: 'String', fields: ['developerCount'], width: 200 },
        { name: 'Country', type: 'String', fields: ['country'], width: 200 },
      ];
      result.options_zh = [
        { name: '#', type: 'String', fields: ['rank'], width: 80 },
        { name: '企业名称', type: 'StringWithIcon', fields: ['name', 'logo'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 200 },
        { name: '活跃仓库数', type: 'String', fields: ['repoCount'], width: 200 },
        { name: '活跃开发者数', type: 'String', fields: ['developerCount'], width: 200 },
        { name: '所属国家', type: 'String', fields: ['country'], width: 200 },
      ];
    }
    writeFileSync(`local_files/leaderboards/companies${isChinese ? '-cn' : ''}.json`, JSON.stringify(result));
  };

  await produceDivisionsData();
  await produceProjectData(true);
  await produceProjectData(false);
  await produceCompanyData(true);
  await produceCompanyData(false);
})();
