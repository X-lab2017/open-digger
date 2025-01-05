import { query } from "../db/clickhouse";
import { getUserCommunityOpenrank } from "../metrics/indices";

const tableName = 'coding_events';
const analysisData = async (year: number) => {
  const rawData = await query<any>(`SELECT * FROM ${tableName} WHERE year=${year} AND event='OSPP'`, { format: 'JSONEachRow' });

  const overviewRes = await query<any>(`SELECT
    COUNT(),
    countIf(state='Selected' OR state='Finished'),
    countIf(state='Finished'),
    uniqExactIf(student_univ, state='Finished')
  FROM ${tableName} WHERE year=${year}`);
  const [totalCount, selectedCount, finishedCount, univCount] = overviewRes[0];
  const finishedRatio = Math.round(finishedCount * 100 / totalCount);
  console.log('项目总数: ', totalCount);
  console.log('中选项目数: ', selectedCount);
  console.log('结项项目数: ', finishedCount);
  console.log('项目率: ', finishedRatio);
  console.log('高校数量: ', univCount);

  const platformDistributionRes = await query<any>(`SELECT
    repos.platform[1] AS platform,
    COUNT()
  FROM ${tableName} WHERE year=${year} AND state='Finished' GROUP BY platform ORDER BY COUNT() DESC`);
  console.log('平台分布: ', platformDistributionRes.map(row => `${row[0]}:${row[1]}`).join(','));

  const finishUnivDistributionRes = await query<any>(`SELECT 
    student_univ AS univ,
    COUNT()
  FROM ${tableName} WHERE year=${year} AND state='Finished' GROUP BY univ ORDER BY COUNT() DESC`);
  console.log('高校分布: ', finishUnivDistributionRes.slice(0, 10).map(row => `${row[0]}:${row[1]}`).join(','));

  const studentLoginMap = new Map<string, any[]>([['GitHub', []], ['Gitee', []]]);
  const reposMap = new Map<string, any[]>([['GitHub', []], ['Gitee', []]]);

  rawData.filter(r => r.state === 'Finished')
    .forEach(r => {
      studentLoginMap.get(r.student_platform)?.push(r.student_login);
      for (let i = 0; i < r['repos.platform'].length; i++) {
        reposMap.get(r['repos.platform'][i])?.push(r['repos.name'][i]);
      }
    });

  const studentOpenRankRes = await getUserCommunityOpenrank({
    startYear: 2024, startMonth: 1, endYear: 2024, endMonth: 12,
    idOrNames: [{
      platform: 'GitHub',
      repoNames: reposMap.get('GitHub')!,
      userLogins: studentLoginMap.get('GitHub')!,
    }, {
      platform: 'Gitee',
      repoNames: reposMap.get('Gitee')!,
      userLogins: studentLoginMap.get('Gitee')!,
    }],
    groupTimeRange: 'year',
    order: 'DESC', orderOption: 'latest',
    limit: -1, limitOption: 'all', precision: 2,
  });

  const studentOpenRankData = studentOpenRankRes.map(row => ({
    login: row.name,
    openrank: row.openrank[0],
    platform: row.platform,
  }));

  const univOpenrankRankingMap = new Map<string, { count: number; openrank: number }>();
  for (const s of studentOpenRankData) {
    const record = rawData.find(r => r.student_login === s.login && r.student_platform === s.platform)!;
    if (!record) continue;
    const univ = record.student_univ;
    if (!univOpenrankRankingMap.has(univ)) univOpenrankRankingMap.set(univ, { count: 0, openrank: 0 });
    univOpenrankRankingMap.get(univ)!.count++;
    univOpenrankRankingMap.get(univ)!.openrank += s.openrank;
  }
  const univOpenrankRankingList = Array.from(univOpenrankRankingMap.entries()).map(r => ({
    univ: r[0],
    count: r[1].count,
    openrank: +(r[1].openrank.toFixed(2)),
  })).sort((a, b) => b.openrank - a.openrank);
  console.table(univOpenrankRankingList.slice(0, 20));

  const studentOpenrankRankingList = studentOpenRankData.slice(0, 20).map(s => {
    const record = rawData.find(r => r.student_login === s.login && r.student_platform === s.platform)!;
    if (!record) return {};
    return {
      name: record.student_name[0] + '*'.repeat(record.student_name.length - 1),
      openrank: s.openrank,
      univ: record.student_univ,
      community: record.community,
    }
  });
  console.table(studentOpenrankRankingList);

  const studentGlobalOpenRankRes = await getUserCommunityOpenrank({
    startYear: 2024, startMonth: 1, endYear: 2024, endMonth: 12,
    idOrNames: [{
      platform: 'GitHub',
      userLogins: studentLoginMap.get('GitHub')!,
    }, {
      platform: 'Gitee',
      userLogins: studentLoginMap.get('Gitee')!,
    }],
    groupTimeRange: 'year',
    order: 'DESC', orderOption: 'latest',
    limit: -1, limitOption: 'all', precision: 2,
  });
  const studentGlobalOpenrankRankingList = studentGlobalOpenRankRes.slice(0, 10).map(s => {
    const openrank = s.openrank[0];
    const openrankDetails = s.openrankDetails[0].map(r => r[2]);
    const record = rawData.find(r => r.student_login === s.name && r.student_platform === s.platform)!;
    if (!record) return {};
    return {
      name: record.student_name[0] + '*'.repeat(record.student_name.length - 1),
      openrank,
      univ: record.student_univ,
      projects: openrankDetails.slice(0, 3).join(','),
    };
  });
  console.table(studentGlobalOpenrankRankingList);

};

(async () => {
  await analysisData(2024);
})();
