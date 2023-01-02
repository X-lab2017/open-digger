import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Task } from '..';
import { getRepoActivity, getRepoOpenrank, getUserActivity, getUserOpenrank } from '../../metrics/indices';
import { forEveryMonth } from '../../metrics/basic';
import { rankData } from '../../utils';

const task: Task = {
  cron: '0 0 15 * *',    // runs on the 15th day of every month at 00:00
  enable: true,
  immediate: false,
  callback: async () => {

    console.log(`Start to run open leaderboard task.`);

    const startYear = 2015, startMonth = 1, endYear = new Date().getFullYear(), endMonth = new Date().getMonth();
    const limit = 300;
    const allMonthes: string[] = [];
    await forEveryMonth(startYear, startMonth, endYear, endMonth, async (y, m) => allMonthes.push(`${y}${m}`));
    const allYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => i + startYear);

    const writeData = (dataMap: Map<any, any>, type: string, path: string) => {
      for (const [time, data] of dataMap.entries()) {
        const dir = `./local_files/open_leaderboard/${path}`;
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(`./local_files/open_leaderboard/${path}/${time}.json`, JSON.stringify({
          type, time, data,
        }));
      }
    };

    const exportUserTableName = 'gh_export_user', exportRepoTableName = 'gh_export_repo';

    // get chinese month actor activity
    const chineseUserMonthActivityData = await getUserActivity({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'month', limitOption: 'each',
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
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'year', limitOption: 'each',
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
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'month', whereClause: `actor_id IN (SELECT id FROM ${exportUserTableName})`,
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
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'year', whereClause: `actor_id IN (SELECT id FROM ${exportUserTableName})`,
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
      order: 'DESC', limit: -1, precision: 2,
      groupBy: 'Company', limitOption: 'each',
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
      order: 'DESC', limit: -1, precision: 2,
      groupBy: 'Company', limitOption: 'each',
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
      order: 'DESC', limit: -1, precision: 2,
      groupBy: 'Company', limitOption: 'each',
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
      order: 'DESC', limit: -1, precision: 2,
      groupBy: 'Company', limitOption: 'each',
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
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'month', whereClause: `repo_id IN (SELECT id FROM ${exportRepoTableName})`,
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
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'year', whereClause: `repo_id IN (SELECT id FROM ${exportRepoTableName})`,
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
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'month', limitOption: 'each',
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
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'year', limitOption: 'each',
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
    // by month
    const chineseUserMonthOpenrankData = await getUserOpenrank({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'month', limitOption: 'each',
    });
    console.log(`Get chinese user month openrank data done, count=${chineseUserMonthOpenrankData.length}`);
    const chineseUserMonthOpenrankMap = rankData(chineseUserMonthOpenrankData!, allMonthes, (item, _, index) => item.openrank[index], item => { return { name: item.name, id: item.id }; });
    for (const k of chineseUserMonthOpenrankMap.keys()) {
      chineseUserMonthOpenrankMap.set(k, chineseUserMonthOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseUserMonthOpenrankMap, 'Actor_China_Month', 'open_rank/actor/chinese');
    // by year
    const chineseUserYearOpenrankData = await getUserOpenrank({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'year', limitOption: 'each',
    });
    console.log(`Get chinese user year openrank data done, count=${chineseUserYearOpenrankData.length}`);
    const chineseUserYearOpenrankMap = rankData(chineseUserYearOpenrankData!, allYears, (item, _, index) => item.openrank[index], item => { return { name: item.name, id: item.id }; });
    for (const k of chineseUserYearOpenrankMap.keys()) {
      chineseUserYearOpenrankMap.set(k, chineseUserYearOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseUserYearOpenrankMap, 'Actor_China_Year', 'open_rank/actor/chinese');
    console.log('Chinese actor OpenRank done.');

    // get global actor OpenRank
    // by month
    const globalUserMonthOpenrankData = await getUserOpenrank({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'month', whereClause: `actor_id IN (SELECT id FROM ${exportUserTableName})`,
    });
    console.log(`Get global user month openrank data done, count=${globalUserMonthOpenrankData.length}`);
    const globalUserMonthOpenrankMap = rankData(globalUserMonthOpenrankData!, allMonthes, (item, _, index) => item.openrank[index], item => { return { name: item.name, id: item.id }; });
    for (const k of globalUserMonthOpenrankMap.keys()) {
      globalUserMonthOpenrankMap.set(k, globalUserMonthOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalUserMonthOpenrankMap, 'Actor_Global_Month', 'open_rank/actor/global');
    // by year
    const globalUserYearOpenrankData = await getUserOpenrank({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'year', whereClause: `actor_id IN (SELECT id FROM ${exportUserTableName})`,
    });
    console.log(`Get global user year openrank data done, count=${globalUserYearOpenrankData.length}`);
    const globalUserYearOpenrankMap = rankData(globalUserYearOpenrankData!, allYears, (item, _, index) => item.openrank[index], item => { return { name: item.name, id: item.id }; });
    for (const k of globalUserYearOpenrankMap.keys()) {
      globalUserYearOpenrankMap.set(k, globalUserYearOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalUserYearOpenrankMap, 'Actor_Global_Year', 'open_rank/actor/global');
    console.log('Global actor OpenRank done.');

    // get Chinese repo OpenRank
    // by month
    const chineseRepoMonthOpenrankData = await getRepoOpenrank({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, precision: 2,
      groupTimeRange: 'month', limitOption: 'each',
    });
    console.log(`Get chinese repo month openrank data done, count=${chineseRepoMonthOpenrankData.length}`);
    const chineseRepoMonthOpenrankMap = rankData(chineseRepoMonthOpenrankData!, allMonthes, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of chineseRepoMonthOpenrankMap.keys()) {
      chineseRepoMonthOpenrankMap.set(k, chineseRepoMonthOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseRepoMonthOpenrankMap, 'Repo_China_Month', 'open_rank/repo/chinese');
    // by year
    const chineseRepoYearOpenrankData = await getRepoOpenrank({
      labelUnion: [':regions/China'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2,
      groupTimeRange: 'year', limitOption: 'each',
    });
    console.log(`Get chinese repo year openrank data done, count=${chineseRepoYearOpenrankData.length}`);
    const chineseRepoYearOpenrankMap = rankData(chineseRepoYearOpenrankData!, allYears, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of chineseRepoYearOpenrankMap.keys()) {
      chineseRepoYearOpenrankMap.set(k, chineseRepoYearOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseRepoYearOpenrankMap, 'Repo_China_Year', 'open_rank/repo/chinese');
    console.log('Chinese repo OpenRank done.');

    // get Chinese company
    // by month
    const chineseCompanyRepoMonthOpenrankData = await getRepoOpenrank({
      labelIntersect: [':regions/China', 'Company'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'month', groupBy: 'Company',
    });
    console.log(`Get chinese company repo month openrank data done, count=${chineseCompanyRepoMonthOpenrankData.length}`);
    const chineseCompanyRepoMonthOpenrankMap = rankData(chineseCompanyRepoMonthOpenrankData!, allMonthes, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of chineseCompanyRepoMonthOpenrankMap.keys()) {
      chineseCompanyRepoMonthOpenrankMap.set(k, chineseCompanyRepoMonthOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseCompanyRepoMonthOpenrankMap, 'Company_China_Month', 'open_rank/company/chinese');
    // by year
    const chineseCompanyRepoYearOpenrankData = await getRepoOpenrank({
      labelIntersect: [':regions/China', 'Company'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2, limitOption: 'each',
      groupTimeRange: 'year', groupBy: 'Company',
    });
    console.log(`Get chinese company repo year openrank data done, count=${chineseCompanyRepoYearOpenrankData.length}`);
    const chineseCompanyRepoYearOpenrankMap = rankData(chineseCompanyRepoYearOpenrankData!, allYears, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of chineseCompanyRepoYearOpenrankMap.keys()) {
      chineseCompanyRepoYearOpenrankMap.set(k, chineseCompanyRepoYearOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(chineseCompanyRepoYearOpenrankMap, 'Company_China_Year', 'open_rank/company/chinese');
    console.log('Chinese company OpenRank done.');

    // get global repo OpenRank
    // by month
    const globalRepoMonthOpenrankData = await getRepoOpenrank({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'month', whereClause: `repo_id IN (SELECT id FROM ${exportRepoTableName})`,
    });
    console.log(`Get global repo month openrank data done, count=${globalRepoMonthOpenrankData.length}`);
    const globalRepoMonthOpenrankMap = rankData(globalRepoMonthOpenrankData!, allMonthes, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of globalRepoMonthOpenrankMap.keys()) {
      globalRepoMonthOpenrankMap.set(k, globalRepoMonthOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalRepoMonthOpenrankMap, 'Repo_Global_Month', 'open_rank/repo/global');
    // by year
    const globalRepoYearOpenrankData = await getRepoOpenrank({
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit, precision: 2, limitOption: 'each',
      groupTimeRange: 'year', whereClause: `repo_id IN (SELECT id FROM ${exportRepoTableName})`,
    });
    console.log(`Get global repo year openrank data done, count=${globalRepoYearOpenrankData.length}`);
    const globalRepoYearOpenrankMap = rankData(globalRepoYearOpenrankData!, allYears, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of globalRepoYearOpenrankMap.keys()) {
      globalRepoYearOpenrankMap.set(k, globalRepoYearOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalRepoYearOpenrankMap, 'Repo_Global_Year', 'open_rank/repo/global');
    console.log('Global repo OpenRank done.');

    // get global company
    // by month
    const globalCompanyRepoMonthOpenrankData = await getRepoOpenrank({
      labelUnion: ['Company'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2, limitOption: 'each',
      groupTimeRange: 'month', groupBy: 'Company',
    });
    console.log(`Get global company repo month openrank data done, count=${globalCompanyRepoMonthOpenrankData.length}`);
    const globalCompanyRepoMonthOpenrankMap = rankData(globalCompanyRepoMonthOpenrankData!, allMonthes, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of globalCompanyRepoMonthOpenrankMap.keys()) {
      globalCompanyRepoMonthOpenrankMap.set(k, globalCompanyRepoMonthOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalCompanyRepoMonthOpenrankMap, 'Company_Global_Month', 'open_rank/company/global');
    // by year
    const globalCompanyRepoYearOpenrankData = await getRepoOpenrank({
      labelUnion: ['Company'],
      startYear, startMonth, endYear, endMonth,
      order: 'DESC', limit: -1, precision: 2, limitOption: 'each',
      groupTimeRange: 'year', groupBy: 'Company',
    });
    console.log(`Get global company repo year openrank data done, count=${globalCompanyRepoYearOpenrankData.length}`);
    const globalCompanyRepoYearOpenrankMap = rankData(globalCompanyRepoYearOpenrankData!, allYears, (item, _, index) => item.openrank[index], item => { return { name: item.name }; });
    for (const k of globalCompanyRepoYearOpenrankMap.keys()) {
      globalCompanyRepoYearOpenrankMap.set(k, globalCompanyRepoYearOpenrankMap.get(k)!.filter(i => i.value > 0));
    }
    writeData(globalCompanyRepoYearOpenrankMap, 'Company_Global_Year', 'open_rank/company/global');
    console.log('Global company OpenRank done.');


    writeFileSync('./local_files/open_leaderboard/meta.json', JSON.stringify({ lastUpdatedAt: new Date().getTime() }));
    console.log('Task for open leaderboard done.');
  }
};

module.exports = task;
