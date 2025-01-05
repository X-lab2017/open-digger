import { writeFileSync } from 'fs';
import { getLabelData } from '../label_data_utils';
import { QueryConfig } from '../metrics/basic';
import { getRepoActivity, getRepoOpenrank } from '../metrics/indices';
import { countryInfo, countryFlagMap } from '../static/countries';
import { query } from '../db/clickhouse';
import { repoParticipants } from '../metrics/metrics';

(async () => {
  const openDiggerOssUrl = 'https://oss.open-digger.cn/';
  const labels = getLabelData();
  const defaultOption: QueryConfig = {
    startYear: 2024, startMonth: 1, endYear: 2024, endMonth: 12,
    order: 'DESC', limit: 101, limitOption: 'all',
    groupTimeRange: 'year', precision: 2,
  };
  const getLogoUrl = (id: string) => id ? `${openDiggerOssUrl}logos/${id.split(':')[1]}.png` : null;
  // @ts-ignore
  const produceGlobalData = async () => {
    const allCountries: any[] = await query(`
SELECT c, groupArray((p, d, o)) FROM
(SELECT a.c AS c, a.p AS p, COUNT(DISTINCT a.id) AS d, SUM(b.openrank) AS o FROM
(SELECT u.id AS id, l.country AS c, l.province AS p FROM
(SELECT id, location FROM gh_user_info WHERE location != '') u,
(SELECT location, country, administrative_area_level_1 AS province FROM location_info WHERE status = 'normal' AND country != '' AND province != '') l
WHERE u.location=l.location)a
LEFT JOIN
(SELECT actor_id, SUM(openrank) AS openrank FROM global_openrank WHERE toYear(created_at)=2024 AND type='User' AND platform='GitHub' GROUP BY actor_id)b
ON a.id=b.actor_id
GROUP BY c, p)
GROUP BY c`);
    const countryMap = new Map<string, any>();
    const countryTotalMap = new Map<string, number>();
    const countryDataMap = new Map<string, Map<string, number[]>>();
    for (const row of allCountries) {
      const [name, provinces] = row;
      const country = countryInfo.find(c => c.name === name || c.includes?.includes(name))!;
      if (!country) {
        throw new Error(`Country not found, ${name}`);
      }
      if (!country.provinces) {
        console.log(`No provinces found for ${country.name}`);
        country.provinces = [] as any;
      }
      let countryName = country.name;
      if (['香港', '澳门', '台湾'].includes(country.name_zh)) {
        const totalOpenRank = provinces.map(i => +i[2]).reduce((a, c) => a + c, 0);
        console.log(country.name_zh, totalOpenRank);
        continue;
      }
      countryMap.set(country.name, country);
      if (!countryDataMap.has(countryName)) {
        countryDataMap.set(countryName, new Map<string, number[]>());
      }
      const provinceMap = countryDataMap.get(countryName)!;
      if (country.name_zh === '美国') {
        country.provinces!.forEach(p => { if (!p.name_zh.endsWith('州')) p.name_zh += '州' });
      }
      const notFound = provinces.filter(p => !country.provinces!.find((pp: any) => pp.name === p[0] || pp.name_zh === p[0] || pp.alias?.includes(p[0]))).map(p => p[0]);
      if (notFound.length > 0) {
        console.log(`${JSON.stringify(notFound)} 这个数组中是 ${country.name_zh} 的一些省或州，他们的中文名是什么？`);
      }
      for (const p of provinces) {
        const provinceName = country.provinces!.find((pp: any) => pp.name === p[0] || pp.name_zh === p[0] || pp.alias?.includes(p[0]));
        if (!provinceName) continue;
        let key = `${provinceName.name}___${provinceName.name_zh}`;
        if (!provinceMap.has(key)) {
          provinceMap.set(key, [0, 0]);
        }
        provinceMap.get(key)![0] += +p[1];
        provinceMap.get(key)![1] += +p[2];
        countryTotalMap.set(countryName, (countryTotalMap.get(countryName) ?? 0) + (+p[1]));
      }
    }
    let finalArr: any = [{
      country: '🇨🇳China',
      country_zh: '🇨🇳中国',
      province: 'Taiwan',
      province_zh: '台湾省',
      flag: '🇨🇳',
      developerCount: Math.round(1178832 / 100) / 100,
      openrank: 166978.24,
      avgOpenrank: (166978.24 / (1178832 / 10000)).toFixed(2)
    },
    {
      country: '🇨🇳China',
      country_zh: '🇨🇳中国',
      province: 'Hong Kong',
      province_zh: '香港特别行政区',
      flag: '🇨🇳',
      developerCount: Math.round(1977504 / 100) / 100,
      openrank: 3392.56,
      avgOpenrank: (3392.56 / (1977504 / 10000)).toFixed(2)
    },
    {
      country: '🇨🇳China',
      country_zh: '🇨🇳中国',
      province: 'Macao',
      province_zh: '澳门特别行政区',
      flag: '🇨🇳',
      developerCount: Math.round(23633 / 100) / 100,
      openrank: 4351.21,
      avgOpenrank: (4351.21 / (23633 / 10000)).toFixed(2)
    }];

    for (const [countryName, data] of countryDataMap.entries()) {
      const country = countryMap.get(countryName)!;
      if (!country) {
        throw new Error(`No country data found ${countryName}`);
      }
      if (!country.developerCount) continue;
      const mutiple = country.developerCount['2024Q1'] / countryTotalMap.get(countryName)!
      for (const [p, c] of data) {
        finalArr.push({
          country: country.flag + country.name,
          country_zh: country.flag + country.name_zh,
          province: p.split('___')[0],
          province_zh: p.split('___')[1],
          flag: country.flag,
          developerCount: Math.round(c[0] * mutiple / 100) / 100,
          openrank: +(c[1].toFixed(2)),
          avgOpenrank: +(c[1] / (c[0] * mutiple / 10000)).toFixed(2),
        });
      }
    }

    finalArr = finalArr.sort((a, b) => b.openrank - a.openrank);

    console.log(JSON.stringify({
      title: '2024 全球行政区划开发者 OpenRank 排行榜 Top 30',
      data: finalArr.slice(0, 30).map((v, i) => ({
        rank: i + 1,
        ...v
      })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '行政区划', type: 'String', fields: ['province_zh'], width: 250 },
        { name: '所属国家', type: 'String', fields: ['country_zh'], width: 200 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 200 },
        { name: '开发者数量(万)', type: 'String', fields: ['developerCount'], width: 200 },
        { name: '平均 OpenRank(/万人)', type: 'String', fields: ['avgOpenrank'], width: 200 },
      ]
    }));

    console.log(JSON.stringify({
      title: '2024 中国行政区划开发者 OpenRank 排行榜 Top 30',
      data: finalArr.filter(i => i.country.includes('China')).map((v, i) => ({
        rank: i + 1,
        ...v
      })),
      options: [
        { name: '#', type: 'String', fields: ['rank'], width: 40 },
        { name: '行政区划', type: 'String', fields: ['province_zh'], width: 300 },
        { name: 'OpenRank', type: 'String', fields: ['openrank'], width: 200 },
        { name: '开发者数量(万)', type: 'String', fields: ['developerCount'], width: 200 },
        { name: '平均 OpenRank(/万人)', type: 'String', fields: ['avgOpenrank'], width: 200 },
      ]
    }));

    const ret = finalArr.slice(0, 100).map((v, i) => ({
      rank: i + 1,
      ...v
    }));
    writeFileSync('local_files/leaderboards/divisions.json', JSON.stringify({
      data: ret,
    }));
  };

  // @ts-ignore
  const produceProjectData = async () => {
    const data = (await getRepoOpenrank({
      ...defaultOption,
      groupBy: 'Project',
    })).filter(i => i.id !== 'Others');
    const participantsData = (await repoParticipants({
      ...defaultOption,
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
      for (const type of [':companies', ':universities', ':agencies', ':foundations']) {
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
        const countryLabelId = label.parents.find(p => p.startsWith(':regions'));
        if (countryLabelId) {
          const countryLabel = labels.find(l => l.identifier === countryLabelId)!;
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
      const country = findCountry(label.identifier) ?? '';
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
    writeFileSync('local_files/leaderboards/projects.json', JSON.stringify({
      data: ret,
    }));
  };
  // @ts-ignore
  const produceCompanyData = async () => {
    const data = (await getRepoOpenrank({
      ...defaultOption,
      groupBy: 'Company',
    })).filter(i => i.id !== 'Others');
    const activityData = (await getRepoActivity({
      ...defaultOption,
      limit: -1, groupBy: 'Company',
    })).filter(i => i.id !== 'Others');
    const ret: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const id = row.id;
      const openrank = +row.openrank[0];
      const label = labels.find(l => l.identifier === id)!;
      const findCountry = (labelId: string) => {
        const label = labels.find(l => l.identifier === labelId)!;
        const countryLabelId = label.parents.find(p => p.startsWith(':regions'));
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
      const activityItem = activityData.find(row => row.id === id)!;
      ret.push({
        rank: i + 1,
        id,
        name: label.name,
        logo: getLogoUrl(id),
        openrank,
        repoCount: +activityItem.repos[0],
        orgCount: +activityItem.orgs[0],
        developerCount: +activityItem.participants[0],
        platforms: label.platforms.map(p => p.name),
        ...country,
      });
    }
    writeFileSync('local_files/leaderboards/companies.json', JSON.stringify({
      data: ret,
    }));
  };

  await produceGlobalData();
  await produceProjectData();
  await produceCompanyData();
})();
