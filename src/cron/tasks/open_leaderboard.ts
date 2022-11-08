import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Task } from '..';
import { query } from '../../db/neo4j';
import { getGitHubData, getLabelData } from '../../label_data_utils';
import { getRepoActivity, getUserActivity } from '../../metrics/indices';
import { forEveryMonth } from '../../metrics/basic';
import { rankData } from '../../utils';

const task: Task = {
  cron: '0 0 15 * *',    // runs on the 15th day of every month at 00:00
  enable: true,
  immediate: false,
  callback: async () => {

    console.log(`Start to run open leaderboard task.`);

    const labelData = getLabelData();
    const startYear = 2015, startMonth = 1, endYear = new Date().getFullYear(), endMonth = new Date().getMonth();
    const limit = 300;
    const allMonthes: string[] = [];
    await forEveryMonth(startYear, startMonth, endYear, endMonth, async (y, m) => allMonthes.push(`${y}${m}`));
    const allYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => i + startYear);
    const monthInAYear = Array.from({ length: 12 }, (_, i) => i + 1 );

    const writeData = (dataMap: Map<any, any>, type: string, path: string) => {
      for (const [ time, data ] of dataMap.entries()) {
        const dir = `./local_files/open_leaderboard/${path}`;
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(`./local_files/open_leaderboard/${path}/${time}.json`, JSON.stringify({
          type, time, data,
        }));
      }
    };

    const defaultReducer = (a: number, b: number) => a + b;
    const openRankProp = (time: any) => `open_rank_${time}`;
    const getOpenRank = (item: any, time: string) => item[openRankProp(time)] ?? 0;
    const chineseLabel = getGitHubData([':regions/China']);

    // get chinese month actor activity
    const chineseUserMonthActivityData = await getUserActivity({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupTimeRange: 'month',
    });
    console.log(`Get chinese user month activity data done, count=${chineseUserMonthActivityData.length}`);
    const chineseUserMonthActivityMap = rankData(chineseUserMonthActivityData!, allMonthes, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        id: item.id,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of chineseUserMonthActivityMap.keys()) {
      chineseUserMonthActivityMap.set(k, chineseUserMonthActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseUserMonthActivityMap, 'Actor_China_Month', 'activity/actor/chinese');

    // get chinese actor year acitivity
    const chineseUserYearActivityData = await getUserActivity({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupTimeRange: 'year',
    });
    console.log(`Get chinese user year activity data done, count=${chineseUserYearActivityData.length}`);
    const chineseUserYearActivityMap = rankData(chineseUserYearActivityData!, allYears, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        id: item.id,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of chineseUserYearActivityMap.keys()) {
      chineseUserYearActivityMap.set(k, chineseUserYearActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseUserYearActivityMap, 'Actor_China_Year', 'activity/actor/chinese');
    console.log('Chinese actor activity done.');

    // get global actor activity
    const globalUserMonthActivityData = await getUserActivity({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, percision: 2,
      groupTimeRange: 'month',
    }, false);
    console.log(`Get global user month activity data done, count=${globalUserMonthActivityData.length}`);
    const globalUserMonthActivityMap = rankData(globalUserMonthActivityData!, allMonthes, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        id: item.id,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of globalUserMonthActivityMap.keys()) {
      globalUserMonthActivityMap.set(k, globalUserMonthActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalUserMonthActivityMap, 'Actor_Global_Month', 'activity/actor/global');

    const globalUserYearActivityData = await getUserActivity({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, percision: 2,
      groupTimeRange: 'year',
    }, false);
    console.log(`Get global user year activity data done, count=${globalUserYearActivityData.length}`);
    const globalUserYearActivityMap = rankData(globalUserYearActivityData!, allYears, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        id: item.id,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of globalUserYearActivityMap.keys()) {
      globalUserYearActivityMap.set(k, globalUserYearActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalUserYearActivityMap, 'Actor_Global_Year', 'activity/actor/global');
    console.log('Global actor activity done.');

    // get chinese company activity
    // by month
    const chineseCompanyMonthActivityData = await getRepoActivity({
      labelIntersect: ['Company', ':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupBy: 'Company',
      groupTimeRange: 'month',
    });
    console.log(`Get chinese company month activity data done, count=${chineseCompanyMonthActivityData?.length}`);
    const chineseCompanyMonthActivityMap = rankData(chineseCompanyMonthActivityData!, allMonthes, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of chineseCompanyMonthActivityMap.keys()) {
      chineseCompanyMonthActivityMap.set(k, chineseCompanyMonthActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseCompanyMonthActivityMap, 'Company_China_Month', 'activity/company/chinese');
    
    // by year
    const chineseCompanyYearActivityData = await getRepoActivity({
      labelIntersect: ['Company', ':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupBy: 'Company',
      groupTimeRange: 'year',
    });
    console.log(`Get chinese company year activity data done, count=${chineseCompanyYearActivityData?.length}`);
    const chineseCompanyYearActivityMap = rankData(chineseCompanyYearActivityData!, allYears, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of chineseCompanyYearActivityMap.keys()) {
      chineseCompanyYearActivityMap.set(k, chineseCompanyYearActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseCompanyYearActivityMap, 'Repo_China_Year', 'activity/company/chinese');
    console.log('Chinese company activity done.');

    // get global company activity
    // by month
    const globalCompanyMonthActivityData = await getRepoActivity({
      labelUnion: ['Company'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupBy: 'Company',
      groupTimeRange: 'month',
    });
    console.log(`Get global company month activity data done, count=${globalCompanyMonthActivityData?.length}`);
    const globalCompanyMonthActivityMap = rankData(globalCompanyMonthActivityData!, allMonthes, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of globalCompanyMonthActivityMap.keys()) {
      globalCompanyMonthActivityMap.set(k, globalCompanyMonthActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalCompanyMonthActivityMap, 'Company_Global_Month', 'activity/company/global');
    
    // by year
    const globalCompanyYearActivityData = await getRepoActivity({
      labelUnion: ['Company'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupBy: 'Company',
      groupTimeRange: 'year',
    });
    console.log(`Get global company year activity data done, count=${globalCompanyYearActivityData?.length}`);
    const globalCompanyYearActivityMap = rankData(globalCompanyYearActivityData!, allYears, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of globalCompanyYearActivityMap.keys()) {
      globalCompanyYearActivityMap.set(k, globalCompanyYearActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalCompanyYearActivityMap, 'Repo_Global_Year', 'activity/company/global');
    console.log('Global company activity done.');

    // get global repo activity
    // by month
    const globalRepoMonthActivityData = await getRepoActivity({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, percision: 2,
      groupTimeRange: 'month',
    });
    console.log(`Get global repo month activity data done, count=${globalRepoMonthActivityData?.length}`);
    const globalRepoMonthActivityMap = rankData(globalRepoMonthActivityData!, allMonthes, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of globalRepoMonthActivityMap.keys()) {
      globalRepoMonthActivityMap.set(k, globalRepoMonthActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalRepoMonthActivityMap, 'Repo_Global_Month', 'activity/repo/global');
    // by year
    const globalRepoYearActivityData = await getRepoActivity({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, percision: 2,
      groupTimeRange: 'year',
    });
    console.log(`Get global repo year activity data done, count=${globalRepoYearActivityData?.length}`);
    const globalRepoYearActivityMap = rankData(globalRepoYearActivityData!, allYears, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of globalRepoYearActivityMap.keys()) {
      globalRepoYearActivityMap.set(k, globalRepoYearActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalRepoYearActivityMap, 'Repo_Global_Year', 'activity/repo/global');
    console.log('Global repo activity done.');

    // get Chinese repo activity
    // by month
    const chineseRepoMonthActivityData = await getRepoActivity({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupTimeRange: 'month',
    });
    console.log(`Get chinese repo month activity data done, count=${chineseRepoMonthActivityData?.length}`);
    const chineseRepoMonthActivityMap = rankData(chineseRepoMonthActivityData!, allMonthes, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of chineseRepoMonthActivityMap.keys()) {
      chineseRepoMonthActivityMap.set(k, chineseRepoMonthActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseRepoMonthActivityMap, 'Repo_China_Month', 'activity/repo/chinese');
    // by year
    const chineseRepoYearActivityData = await getRepoActivity({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, percision: 2,
      groupTimeRange: 'year',
    });
    console.log(`Get chinese repo year activity data done, count=${chineseRepoYearActivityData?.length}`);
    const chineseRepoYearActivityMap = rankData(chineseRepoYearActivityData!, allYears, (item, _, index) => item.activity[index], (item, index) => {
      return {
        name: item.name,
        issue_comment: item.issue_comment[index],
        open_issue: item.open_issue[index],
        open_pull: item.open_pull[index],
        review_comment: item.review_comment[index],
        merged_pull: item.merged_pull[index],
      }
    });
    for (const k of chineseRepoYearActivityMap.keys()) {
      chineseRepoYearActivityMap.set(k, chineseRepoYearActivityMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseRepoYearActivityMap, 'Repo_China_Year', 'activity/repo/chinese');
    console.log('Chinese repo activity done.');

    // get Chinese actor OpenRank
    const chineseActorData = await query(`MATCH (u:User) WHERE u.id IN [${chineseLabel.githubUsers.join(',')}] RETURN u;`);
    // by month
    writeData(rankData(chineseActorData, allMonthes, getOpenRank, item => {
      return {
        name: item.login,
        id: item.id,
      }
    }), 'Actor_China_Month', 'open_rank/actor/chinese');
    // by year
    writeData(rankData(chineseActorData,
      allYears,
      (item, year) => monthInAYear.map(m => getOpenRank(item, `${year}${m}`)).reduce(defaultReducer),
      item => {
        return {
          name: item.login,
          id: item.id,
        }
      }), 'Actor_China_Year', 'open_rank/actor/chinese');
    console.log('Chinese actor OpenRank done.');

    // get global actor OpenRank
    const globalActorDataMap = new Map<any, any>();
    await forEveryMonth(startYear, startMonth, endYear, endMonth, async (y, m) => {
      const globalMonthData = await query(`MATCH (u:User) WHERE u.${openRankProp(`${y}${m}`)} > 0 RETURN u ORDER BY u.${openRankProp(`${y}${m}`)} DESC LIMIT ${limit};`);
      globalMonthData.forEach(r => globalActorDataMap.set(r.id, r));
    });
    const globalActorData = Array.from(globalActorDataMap.values());
    // by month
    writeData(rankData(globalActorData, allMonthes, getOpenRank, item => {
      return {
        name: item.login,
        id: item.id,
      }
    }), 'Actor_Global_Month', 'open_rank/actor/global');
    // by year
    writeData(rankData(globalActorData,
      allYears, 
      (item, year) => monthInAYear.map(m => getOpenRank(item, `${year}${m}`)).reduce(defaultReducer),
      item => {
        return {
          name: item.login,
          id: item.id,
        }
      }), 'Actor_Global_Year', 'open_rank/actor/global');
    console.log('Global actor OpenRank done.');

    // get Chinese repo OpenRank
    const chineseRepoData = await query(`MATCH (r:Repo) WHERE r.id IN [${chineseLabel.githubRepos.join(',')}] OR r.org_id IN [${chineseLabel.githubOrgs.join(',')}] RETURN r;`);
    // by month
    writeData(rankData(chineseRepoData, allMonthes, getOpenRank, item => { return {name: item.name}}), 'Repo_China_Month', 'open_rank/repo/chinese');
    // by year
    writeData(rankData(chineseRepoData,
      allYears, 
      (item, year) => monthInAYear.map(m => getOpenRank(item, `${year}${m}`)).reduce(defaultReducer),
      item => { return {name: item.name}}), 'Repo_China_Year', 'open_rank/repo/chinese');
    console.log('Chinese repo OpenRank done.');
    
    // get Chinese company
    const chineseCompanyDataMap = new Map<string, any>();
    const companyLabelArr = labelData.filter(l => l.type === 'Company');
    chineseRepoData.forEach(r => {
      const companyName = companyLabelArr.find(l => l.githubRepos.includes(r.id) || l.githubOrgs.includes(r.org_id))?.name;
      if (!companyName) return; // not a company repo
      if (!chineseCompanyDataMap.has(companyName)) chineseCompanyDataMap.set(companyName, {});
      const companyInfo =chineseCompanyDataMap.get(companyName)!;
      allMonthes.forEach(time => companyInfo[openRankProp(time)] = getOpenRank(companyInfo, time) + getOpenRank(r, time));
      allYears.forEach(year => companyInfo[openRankProp(year)] = getOpenRank(companyInfo, year.toString()) + monthInAYear.map(m => getOpenRank(r, `${year}${m}`)).reduce(defaultReducer));
    });
    const chineseCompanyData = Array.from(chineseCompanyDataMap.entries()).map(v => {
      return {
        name: v[0],
        ...v[1],
      }
    });
    // by month
    writeData(rankData(chineseCompanyData, allMonthes, getOpenRank, item => { return {name: item.name}}), 'Company_China_Month', 'open_rank/company/chinese');
    // by year
    writeData(rankData(chineseCompanyData, allYears, getOpenRank, item => { return {name: item.name}}), 'Company_China_Year', 'open_rank/company/chinese');
    console.log('Chinese company OpenRank done.');

    // get global repo OpenRank
    const globalRepoDataMap = new Map<any, any>();
    await forEveryMonth(startYear, startMonth, endYear, endMonth, async (y, m) => {
      const globalMonthData = await query(`MATCH (r:Repo) WHERE r.${openRankProp(`${y}${m}`)} > 0 RETURN r ORDER BY r.${openRankProp(`${y}${m}`)} DESC LIMIT ${limit};`);
      globalMonthData.forEach(r => globalRepoDataMap.set(r.id, r));
    });
    const globalRepoData = Array.from(globalRepoDataMap.values());
    // by month
    writeData(rankData(globalRepoData, allMonthes, getOpenRank, item => { return {name: item.name}}), 'Repo_Global_Month', 'open_rank/repo/global');
    // by year
    writeData(rankData(globalRepoData,
      allYears, 
      (item, year) => monthInAYear.map(m => getOpenRank(item, `${year}${m}`)).reduce(defaultReducer),
      item => { return {name: item.name}}), 'Repo_Global_Year', 'open_rank/repo/global');
    console.log('Global repo OpenRank done.');

    // get global company
    const globalCompanyDataMap = new Map<string, any>();
    const companyLabel = getGitHubData(['Company']);
    const globalCompanyRepoData = await query(`MATCH (r:Repo) WHERE r.id IN [${companyLabel.githubRepos.join(',')}] OR r.org_id IN [${companyLabel.githubOrgs.join(',')}] RETURN r;`)
    globalCompanyRepoData.forEach(r => {
      const companyName = companyLabelArr.find(l => l.githubRepos.includes(r.id) || l.githubOrgs.includes(r.org_id))?.name;
      if (!companyName) return; // not a company repo
      if (!globalCompanyDataMap.has(companyName)) globalCompanyDataMap.set(companyName, {});
      const companyInfo = globalCompanyDataMap.get(companyName)!;
      allMonthes.forEach(time => companyInfo[openRankProp(time)] = getOpenRank(companyInfo, time) + getOpenRank(r, time));
      allYears.forEach(year => companyInfo[openRankProp(year)] = getOpenRank(companyInfo, year.toString()) + monthInAYear.map(m => getOpenRank(r, `${year}${m}`)).reduce(defaultReducer));
    });
    const globalCompanyData = Array.from(globalCompanyDataMap.entries()).map(v => {
      return {
        name: v[0],
        ...v[1],
      }
    });
    // by month
    writeData(rankData(globalCompanyData, allMonthes, getOpenRank, item => { return {name: item.name}}), 'Company_Global_Month', 'open_rank/company/global');
    // by year
    writeData(rankData(globalCompanyData, allYears, getOpenRank, item => { return {name: item.name}}), 'Company_Global_Year', 'open_rank/company/global');
    console.log('Global company OpenRank done.');


    writeFileSync('./local_files/open_leaderboard/meta.json', JSON.stringify({ lastUpdatedAt: new Date().getTime() }));
    console.log('Task for open leaderboard done.');
  }
};

module.exports = task;
