import { getRepoOpenrank, getUserOpenrank } from "../metrics/indices";
import { countryInfo } from "../static/countries";
import { getLabelData } from "../labelDataUtils";

(async () => {
  const labels = getLabelData();
  const defaultQueryConfig: any = {
    startYear: 2023, startMonth: 12, endYear: 2024, endMonth: 11,
    order: 'DESC', precision: 2,
    limit: -1, limitOption: 'all',
    groupTimeRange: 'month',
  };

  const getUniversityCommunityData = async () => {
    const univData = await getRepoOpenrank({
      ...defaultQueryConfig,
      labelUnion: [':divisions/CN/CN-HB'],
      groupBy: 'Community',
    });
    const result = univData.filter(row => row.name !== 'Others').map(row => {
      const label = labels.find(l => l.identifier === row.id)!;
      return {
        name: label.meta!.name_zh,
        openranks: row.openrank.join('  '),
      }
    });
    console.table(result);
  };

  const getDeveloperData = async () => {
    const p = countryInfo.find(c => c.name === 'China')!.provinces!.find(p => p.name_zh === '湖北省')!;
    const provinceNames = [p.name, p.name_zh, ...(p as any).alias];

    const developerData = await getUserOpenrank({
      ...defaultQueryConfig,
      limit: 30,  // get top 30 developers
      whereClause: `
platform='GitHub' AND actor_id IN (SELECT DISTINCT(u.id) FROM
  (SELECT id, location FROM gh_user_info WHERE location != '') u,
  (SELECT location, country, administrative_area_level_1 AS province FROM location_info WHERE status = 'normal' AND country = 'China' AND province IN (${provinceNames.map(p => `'${p}'`).join(',')})) l
  WHERE u.location=l.location)`
    });
    console.table(developerData.map(row => ({
      id: row.id,
      name: row.name,
      openrank: row.openrank.join('  '),
    })))
  };

  const getCompanyData = async () => {
    const companyData = await getRepoOpenrank({
      ...defaultQueryConfig,
      labelUnion: [':divisions/CN/CN-HB'],
      groupBy: 'Company',
    });
    const result = companyData.filter(row => row.name !== 'Others').map(row => {
      const label = labels.find(l => l.identifier === row.id)!;
      return {
        name: label.meta!.name_zh,
        openranks: row.openrank.join('  '),
      }
    });
    console.table(result);
  };

  await getUniversityCommunityData();
  await getDeveloperData();
  await getCompanyData();
})();
