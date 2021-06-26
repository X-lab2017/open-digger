import { globalConfig } from "./config";
import * as Clickhouse from './db/clickhouse';
import dateFormat=require("dateformat");
export function constrainMetric(num: number) {
  const units = ['', 'K', 'M', 'B'];
  let unitIndex = 0;
  while (num > 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  let times = 1;
  while (num > 10) {
    num /= 10;
    times *= 10;
  }
  return {
    unit: units[unitIndex],
    divTimes: Math.pow(1000, unitIndex),
    max: Math.ceil(num) * times,
  };
}

export function constrainMetrics(nums: number[]) {
  const max = Math.max(...nums);
  const constrain = constrainMetric(max);
  return {
    unit: constrain.unit,
    max: constrain.max,
    nums: nums.map(n => n / constrain.divTimes),
  }
}

export async function queryGitHubEventLog(q: string): Promise<any> {
  try {
    const result: any = await Clickhouse.query(globalConfig.db['githubEventLog'], q);
    return result;
  } catch (e) {
    console.log(`Request data error, e=${e}`);
    return null;
  }
}

interface genTableConfig {
  keys: string[];
  header: any[];
  data: any[];
  tableClass: string;
}

export function genTable(config: genTableConfig): string {
  const tableRow: string[] = [];
  let h = '<td>#</td>';
  for (const k of config.keys) {
    h += `<td>${(config.header && config.header[k]) ? config.header[k] : k}</td>`;
  }
  tableRow.push(h);
  if (config.data && config.data.length > 0) {
    config.data.forEach((r, i) => {
      let s = `<td>${i+1}</td>`;
      for (const k of config.keys) {
        s += `<td>${r[k]}</td>`;
      }
      tableRow.push(s);
    });
  }
  return `<table class="${config.tableClass ?? 'table table-striped'}">
      ${tableRow.map((r, i) => `<tr ${i % 2 === 1 ? 'style="background-color: rgba(30, 161, 255, 0.1)"' : ''}>${r}</tr>\n`).join('')}
    </table>`
}

export function genComponentTitle(title: string): string {
  return `<div class="component-title-text">
  <text>${title}</text>
  </div>`;
}

export function genComponentContent(content: string): string {
  return `<div class="component-content-text">
  <text>${content}</text>
  </div>`;
}

export function genFigure(content: string): string {
  return `<div class="figure-text">
  <text>${content}</text>
  </div>`;
}

export function convertSecondToReadableDuration(s: number): string {
  const arr = [s];
  const divides = [60, 60, 24];
  for (let i = 0; i < divides.length; i++) {
    const val = arr[i];
    arr[i] = val % divides[i];
    arr.push(Math.floor(val / divides[i]));
    if (arr[i + 1] < divides[i + 1]) break;
  }
  const units = ['s', 'm', 'h', 'd'];
  let str = '';
  for (let i = arr.length - 1; i >= 0 && i >= arr.length - 2; i--) {
    if (arr[i] !== 0) {
      str += `${arr[i]}${units[i]}`;
    }
  }
  return str;
}

export function getSelectDataSql(repos: string[], orgs: string[], conditions: string = '') {
  const sqls: string[] = [conditions];
  if (repos) {
    sqls.push(`(repo_id IN [${repos.join(',')}])`);
  }
  if (orgs) {
    sqls.push(`(org_id IN [${orgs.join(',')}])`);
  }
  let cond = '';
  if (sqls.length > 0) {
    cond = `WHERE ${sqls.join(' AND ')}`;
  }
  return `
(SELECT * FROM github_log.year2015 ${cond}
UNION ALL
SELECT * FROM github_log.year2016 ${cond}
UNION ALL
SELECT * FROM github_log.year2017 ${cond}
UNION ALL
SELECT * FROM github_log.year2018 ${cond}
UNION ALL
SELECT * FROM github_log.year2019 ${cond}
UNION ALL
SELECT * FROM github_log.year2020 ${cond}
UNION ALL
SELECT * FROM github_log.year2021 ${cond}
)`;
}

export function issueCommentCount(table:string){
  return `
  SELECT repo_id, actor_id,
  anyHeavy(repo_name) AS repo_name, anyHeavy(actor_login) AS actor_login, 
  COUNT(*) AS count 
  FROM ${table} WHERE type='IssueCommentEvent' AND action='created' 
  GROUP BY repo_id, actor_id
  `
}
export function openIssueCount(table:string){
  return `
  SELECT repo_id, actor_id,
  anyHeavy(repo_name) AS repo_name,anyHeavy(actor_login) AS actor_login,
  COUNT(*) AS count 
  FROM ${table} WHERE type='IssuesEvent' AND action='opened' 
  GROUP BY repo_id, actor_id
  `
}
export function openPullRequestCount(table:string){
  return `
  SELECT repo_id, actor_id, 
  anyHeavy(repo_name) AS repo_name,anyHeavy(actor_login) AS actor_login,
  COUNT(*) AS count 
  FROM ${table} WHERE type='PullRequestEvent' AND action='opened' 
  GROUP BY repo_id, actor_id
  `
}
export function reviewCommentCount(table:string){
  return `
  SELECT repo_id, actor_id,
  anyHeavy(repo_name) AS repo_name,anyHeavy(actor_login) AS actor_login,
  COUNT(*) AS count 
  FROM ${table} 
  WHERE type='PullRequestReviewCommentEvent' AND action='created' 
  GROUP BY repo_id, actor_id
  `
}
export function mergePullCount(table:string){
  return `
  SELECT repo_id, issue_author_id AS actor_id,
  anyHeavy(repo_name) AS repo_name,anyHeavy(issue_author_login) AS actor_login,
  COUNT(*) AS count, 
  SUM(pull_commits) AS commits, 
  SUM(pull_additions) AS additions, 
  SUM(pull_deletions) AS deletions,
  MAX(repo_language) AS repo_language
  FROM ${table} 
  WHERE type='PullRequestEvent' AND action='closed' AND pull_merged=1 
  GROUP BY repo_id, actor_id
  `
}
export function starCount(table:string){
  return `
  SELECT repo_id,actor_id,
  anyHeavy(repo_name) AS repo_name,anyHeavy(actor_login) AS actor_login,
  COUNT(*) AS count 
  FROM ${table} 
  WHERE type='WatchEvent' 
  GROUP BY repo_id,actor_id
  `
}
export function forkCount(table:string){
  return `
  SELECT repo_id,actor_id,
  anyHeavy(repo_name) AS repo_name,anyHeavy(actor_login) AS actor_login,
  COUNT(*) AS count 
  FROM ${table} 
  WHERE type='ForkEvent' 
  GROUP BY repo_id,actor_id
  `
}
export function getColumn(column:string){
  let tbs=['oic','opc','rcc','mpc','wc','fc'];
  let cmp=`icc.${column}`;
  for (const tb of tbs) {
    cmp=`if(${cmp}>${tb}.${column},${cmp},${tb}.${column})`;
  }
  return cmp;
}
interface Weight{
  issueCommentWeight: number
  openIssueWeight: number
  openPullWeight: number
  pullReviewWeight: number
  mergePullWeight: number
}
export function getScore(weight:Weight){
  return `
  SQRT(issue_comment*${weight.issueCommentWeight}+open_issue*${weight.openIssueWeight}+open_pull*${weight.openPullWeight}+pull_review_comment*${weight.pullReviewWeight}+merge_pull*${weight.mergePullWeight})
  `
}
export function periodRepoActorActivity(table:string,weight:Weight){
  return `
  SELECT 
  ${getColumn('repo_id')} AS repo_id,${getColumn('repo_name')} AS repo_name,
  ${getColumn('actor_id')} AS actor_id,${getColumn('actor_login')} AS actor_login,
  wc.count AS star_count,fc.count AS fork_count,
  icc.count AS issue_comment,oic.count AS open_issue,
  opc.count AS open_pull,rcc.count AS pull_review_comment, 
  mpc.count AS merge_pull,mpc.commits AS commits, mpc.additions AS additions,mpc.deletions AS deletions,mpc.repo_language AS repo_language,
  ${getScore(weight)} AS score
  FROM 
  (${issueCommentCount(table)}) AS icc 
  FULL JOIN
  (${openIssueCount(table)}) AS oic
  ON icc.repo_id=oic.repo_id AND icc.actor_id=oic.actor_id
  FULL JOIN
  (${openPullRequestCount(table)}) AS opc
  ON icc.repo_id=opc.repo_id AND icc.actor_id=opc.actor_id
  FULL JOIN
  (${reviewCommentCount(table)}) AS rcc
  ON icc.repo_id=rcc.repo_id AND icc.actor_id=rcc.actor_id
  FULL JOIN
  (${mergePullCount(table)}) AS mpc
  ON icc.repo_id=mpc.repo_id AND icc.actor_id=mpc.actor_id
  FULL JOIN
  (${starCount(table)}) AS wc
  ON icc.repo_id=wc.repo_id AND icc.actor_id=wc.actor_id
  FULL JOIN
  (${forkCount(table)}) AS fc
  ON icc.repo_id=fc.repo_id AND icc.actor_id=fc.actor_id
  `;
}
export function getPeriodTable(startDate:Date,endDate:Date,conditions:string){
  let startYear=startDate.getFullYear();
  let endYear=endDate.getFullYear();
  let startDateFormat=dateFormat(startDate,'yyyy-mm-dd');
  let endDateFormat=dateFormat(endDate,'yyyy-mm-dd');
  if (startYear>endYear)return ``;
  if(startYear===endYear){
    return `
    (SELECT * FROM github_log.year${endYear} 
    WHERE toDate(created_at)>='${startDateFormat}' 
    AND toDate(created_at)<='${endDateFormat}'
    AND ${conditions}
    )
    `;
  }
  if(startYear+1===endYear){
    return `
    (SELECT * FROM github_log.year${startYear} WHERE toDate(created_at)>='${startDateFormat}' AND ${conditions}
    UNION ALL
    SELECT * FROM github_log.year${endYear} WHERE toDate(created_at)<='${endDateFormat}' AND ${conditions})
    `;
  }
  let baseTable=``;
  for (let year = startYear+1; year < endYear; year++) {
    baseTable+=`
    UNION ALL
    SELECT * FROM github_log.year${year} WHERE ${conditions}
    `;     
  }
  return `
  (SELECT * FROM github_log.year${startYear} WHERE toDate(created_at)>='${startDateFormat}' AND ${conditions}
  `+baseTable+`
  UNION ALL
  SELECT * FROM github_log.year${endYear} WHERE toDate(created_at)<='${endDateFormat}' AND ${conditions}) 
  `;
}
export function periodRepoActivity(periodRepoActorActivity:string){
  return `
  SELECT anyHeavy(repo_name) AS repo_name,ROUND(SUM(score),2) AS activity,
  COUNT(DISTINCT actor_id) AS developer_count,
  SUM(issue_comment) AS issue_comment,SUM(open_issue) AS open_issue,
  SUM(open_pull) AS open_pull,SUM(pull_review_comment) AS pull_review_comment, 
  SUM(merge_pull) AS merge_pull,SUM(commits) AS commits,SUM(additions) AS additions,SUM(deletions) AS deletions,
  SUM(star_count) AS star_count,SUM(fork_count) AS fork_count,
  MAX(repo_language) AS repo_language
  FROM (${periodRepoActorActivity})
  GROUP BY repo_id
  ORDER BY activity DESC
  `;
}