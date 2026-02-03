import { query } from "../db/clickhouse";
import { getUserCommunityOpenrank } from "../metrics/indices";

const tableName = 'coding_events';
const analysisData = async (year: number) => {
  const rawDataMap = new Map<number, any[]>();
  rawDataMap.set(year, await query<any>(`SELECT * FROM ${tableName} WHERE year=${year} AND event='OSPP'`, { format: 'JSONEachRow' }));
  rawDataMap.set(year - 1, await query<any>(`SELECT * FROM ${tableName} WHERE year=${year - 1} AND event='OSPP'`, { format: 'JSONEachRow' }));

  const overviewRes = await query<any>(`SELECT
    COUNT(),
    countIf(state='Selected' OR state='Finished'),
    countIf(state='Finished'),
    uniqExactIf(student_univ, state='Finished')
  FROM ${tableName} WHERE year=${year}`);
  const lastYearOverviewRes = await query<any>(`SELECT
    COUNT(),
    countIf(state='Selected' OR state='Finished'),
    countIf(state='Finished'),
    uniqExactIf(student_univ, state='Finished')
  FROM ${tableName} WHERE year=${year - 1}`);
  const [totalCount, selectedCount, finishedCount, univCount] = overviewRes[0];
  const [lastYearTotalCount, lastYearSelectedCount, lastYearFinishedCount, lastYearUnivCount] = lastYearOverviewRes[0];
  const finishedRatio = Math.round(finishedCount * 100 / totalCount);
  const lastYearFinishedRatio = Math.round(lastYearFinishedCount * 100 / lastYearTotalCount);
  console.log('项目总数: ', totalCount);
  console.log('中选项目数: ', selectedCount);
  console.log('结项项目数: ', finishedCount);
  console.log('项目率: ', finishedRatio);
  console.log('高校数量: ', univCount);
  console.log(JSON.stringify({
    year,
    totalCount,
    selectedCount,
    finishedCount,
    univCount,
    finishedRatio,
    totalCountDelta: totalCount - lastYearTotalCount,
    selectedCountDelta: selectedCount - lastYearSelectedCount,
    finishedCountDelta: finishedCount - lastYearFinishedCount,
    univCountDelta: univCount - lastYearUnivCount,
    finishedRatioDelta: finishedRatio - lastYearFinishedRatio,
  }));

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
  console.log('高校分布: ',
    JSON.stringify(finishUnivDistributionRes.filter(n => n[1] >= 2).map(n => ({ name: n[0], value: n[1] }))));

  const studentLoginMap = new Map<string, any[]>([['GitHub', []], ['Gitee', []]]);
  const reposMap = new Map<number, Map<string, any[]>>([
    [year, new Map<string, any[]>([['GitHub', []], ['Gitee', []]])],
    [year - 1, new Map<string, any[]>([['GitHub', []], ['Gitee', []]])]
  ]);

  for (const y of [year, year - 1]) {
    rawDataMap.get(y)!.filter(r => r.state === 'Finished')
      .forEach(r => {
        studentLoginMap.get(r.student_platform)?.push(r.student_login);
        for (let i = 0; i < r['repos.platform'].length; i++) {
          reposMap.get(y)!.get(r['repos.platform'][i])?.push(r['repos.name'][i]);
        }
      });
  }

  const getUnivRankingData = async (y: number) => {
    const studentOpenRankRes = await getUserCommunityOpenrank({
      startYear: y, startMonth: 1, endYear: y, endMonth: 12,
      idOrNames: [{
        platform: 'GitHub',
        repoNames: reposMap.get(y)!.get('GitHub')!,
        userLogins: studentLoginMap.get('GitHub')!,
      }, {
        platform: 'Gitee',
        repoNames: reposMap.get(y)!.get('Gitee')!,
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
      const record = rawDataMap.get(y)!.find(r => r.student_login === s.login && r.student_platform === s.platform)!;
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
    return univOpenrankRankingList;
  };

  const univOpenrankRankingList = await getUnivRankingData(year);
  const lastYearUnivOpenrankRankingList = await getUnivRankingData(year - 1);
  const univeData = univOpenrankRankingList.slice(0, 20).map((u, index) => {
    const lastYearUnivOpenrankRanking = lastYearUnivOpenrankRankingList.find(r => r.univ === u.univ);
    return {
      __index__: index + 1,
      name: u.univ,
      openrank: u.openrank,
      openrankDelta: lastYearUnivOpenrankRanking ? +(u.openrank - lastYearUnivOpenrankRanking.openrank).toFixed(2) : '-',
      totalCount: u.count,
      totalCountDelta: lastYearUnivOpenrankRanking ? u.count - lastYearUnivOpenrankRanking.count : '-',
      openrankAverage: +(u.openrank / u.count).toFixed(2),
      openrankAverageDelta: lastYearUnivOpenrankRanking ? +((u.openrank / u.count) - (lastYearUnivOpenrankRanking.openrank / lastYearUnivOpenrankRanking.count)).toFixed(2) : '-',
    };
  });
  console.log(JSON.stringify(univeData));

  const studentOpenRankRes = await getUserCommunityOpenrank({
    startYear: year, startMonth: 1, endYear: year, endMonth: 12,
    idOrNames: [{
      platform: 'GitHub',
      repoNames: reposMap.get(year)!.get('GitHub')!,
      userLogins: studentLoginMap.get('GitHub')!,
    }, {
      platform: 'Gitee',
      repoNames: reposMap.get(year)!.get('Gitee')!,
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
  const studentOpenrankRankingList = studentOpenRankData.map(s => {
    const record = rawDataMap.get(year)!.find(r => r.student_login === s.login && r.student_platform === s.platform)!;
    if (!record) return null;
    return {
      name: record.student_name[0] + '*'.repeat(record.student_name.length - 1),
      openrank: s.openrank,
      univ: record.student_univ,
      community: record.community,
    }
  }).filter(r => r !== null).slice(0, 20).map((r, index) => ({
    ...r,
    __index__: index + 1,
  }));
  console.table(studentOpenrankRankingList);
  console.log(JSON.stringify(studentOpenrankRankingList));

  const studentGlobalOpenRankRes = await getUserCommunityOpenrank({
    startYear: year, startMonth: 1, endYear: year, endMonth: 12,
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
  const studentGlobalOpenrankRankingList = studentGlobalOpenRankRes.map(s => {
    const openrank = s.openrank[0];
    const openrankDetails = s.details[0].map(r => r[2]);
    const record = rawDataMap.get(year)!.find(r => r.student_login === s.name && r.student_platform === s.platform)!;
    if (!record) return null;
    return {
      name: (record.student_name[0] + '*'.repeat(record.student_name.length - 1)).slice(0, 5),
      openrank,
      univ: record.student_univ,
      repos: openrankDetails.slice(0, 3).join('<br />'),
    };
  }).filter(r => r !== null).slice(0, 10).map((r, index) => ({
    ...r,
    __index__: index + 1,
  }));
  console.table(studentGlobalOpenrankRankingList);
  console.log(JSON.stringify(studentGlobalOpenrankRankingList));
};

(async () => {
  await analysisData(2025);
})();
