import { QueryConfig, 
        getMergedConfig, 
        getRepoWhereClauseForNeo4j, 
        getTimeRangeWhereClauseForNeo4j, 
        getTimeRangeSumClauseForNeo4j, 
        getUserWhereClauseForNeo4j, 
        getRepoWhereClauseForClickhouse,
        forEveryMonthByConfig,
        getUserWhereClauseForClickhouse} from "./basic";
import * as neo4j from '../db/neo4j'
import { getLabelData } from "../label_data_utils";
import * as clickhouse from "../db/clickhouse";

const ISSUE_COMMENT_WEIGHT = 1;
const OPEN_ISSUE_WEIGHT = 2;
const OPEN_PULL_WEIGHT = 3;
const REVIEW_COMMENT_WEIGHT = 4;
const PULL_MERGED_WEIGHT = 5;

export const getRepoActivityOrOpenrank = async (config: QueryConfig, type: 'activity' | 'open_rank') => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = await getTimeRangeWhereClauseForNeo4j(config, 'r');
  const timeActivityOrOpenrankClause = getTimeRangeSumClauseForNeo4j(config, `r.${type}`);
  if (!config.groupBy) {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.name AS repo_name, r.org_login AS org, [${(await timeActivityOrOpenrankClause).join(',')}] AS ${type} ORDER BY reverse(${type}) ${config.order} LIMIT ${config.limit};`;
    return neo4j.query(query);
  } else if (config.groupBy === 'org') {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.org_login AS org_login, count(r.id) AS repo_count, [${(await timeActivityOrOpenrankClause).map(i => `round(SUM(${i}), ${config.percision})`)}] AS ${type} ORDER BY reverse(${type}) ${config.order} LIMIT ${config.limit};`;
    return neo4j.query(query);
  } else {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.id AS repo_id, r.org_id AS org_id, [${(await timeActivityOrOpenrankClause).join(',')}] AS ${type};`;
    const queryResult: any[] = await neo4j.query(query);
    const labelData = getLabelData()?.filter(l => l.type === config.groupBy);
    const result = new Map();
    if (!labelData) return null;
    queryResult.forEach(row => {
      const label = labelData.find(l => l.githubRepos.includes(row.repo_id) || l.githubOrgs.includes(row.org_id));
      if (!label) return;
      let values: any;
      if (!result.get(label.name)) values = row[type];
      else {
        values = result.get(label.name)[type];
        for (let i = 0; i < values.length; i++) {
          values[i] += row[type][i];
        }
      }
      result.set(label.name, {
        label: label.name,
        repo_count: (result.get(label.name)?.repo_count ?? 0) + 1,
        [type]: values,
      });
    });
    const resultArr = Array.from(result.values());
    if (config.order === 'ASC') resultArr.sort((a, b) => a[type][a[type].length - 1] - b[type][b[type].length - 1]);
    if (config.order === 'DESC') resultArr.sort((a, b) => b[type][b[type].length - 1] - a[type][a[type].length - 1]);
    resultArr.forEach(i => i[type] = i[type].map(v => parseFloat(v.toFixed(config.percision))));
    return resultArr.slice(0, config.limit);
  }
}

export const getUserActivityOrOpenrank = async (config: QueryConfig, type: 'activity' | 'open_rank') => {
  config = getMergedConfig(config);
  const userWhereClause = getUserWhereClauseForNeo4j(config);
  const timeWhereClause = await getTimeRangeWhereClauseForNeo4j(config, 'u');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, `u.${type}`);
  const query = `MATCH (u:User) WHERE ${userWhereClause ? userWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN u.login AS user_login, [${(await timeActivityClause).join(',')}] AS ${type} ORDER BY ${type} ${config.order} ${config.limit > 0 ? `LIMIT ${config.limit}` : ''};`;
  return neo4j.query(query);
}

export const getRepoActivityWithDetail = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [];
  const repoWhereClause = getRepoWhereClauseForClickhouse(config);
  if (repoWhereClause) whereClauses.push(repoWhereClause);

  const clickhouseActivityQuery = (whereClauses: string[], percision: number, order: string, limit: number) => {
  return `SELECT repo_id AS id, anyHeavy(rname) AS name, anyHeavy(oid) AS org_id, anyHeavy(ologin) AS org_login, ROUND(SUM(activity),${percision}) AS activity, SUM(issue_comment) AS issue_comment, SUM(open_issue) AS open_issue, SUM(open_pull) AS open_pull, SUM(review_comment) AS review_comment, SUM(merged_pull) AS merged_pull FROM
  (SELECT repo_id,
    argMax(repo_name, created_at) AS rname,
    argMax(org_id, created_at) AS oid,
    argMax(org_login, created_at) AS ologin,
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id,
    countIf(type='IssueCommentEvent' AND action='created') AS issue_comment,
    countIf(type='IssuesEvent' AND action='opened')  AS open_issue,
    countIf(type='PullRequestEvent' AND action='opened') AS open_pull,
    countIf(type='PullRequestReviewCommentEvent' AND action='created') AS review_comment,
    countIf(type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull,
    sqrt(${ISSUE_COMMENT_WEIGHT}*issue_comment + ${OPEN_ISSUE_WEIGHT}*open_issue + ${OPEN_PULL_WEIGHT}*open_pull + ${REVIEW_COMMENT_WEIGHT}*review_comment + ${PULL_MERGED_WEIGHT}*merged_pull) AS activity
  FROM github_log.events
${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
GROUP BY repo_id, actor_id
HAVING activity > 0)
GROUP BY repo_id
ORDER BY activity ${order}
${limit > 0 ? `LIMIT ${limit}` : ''}`;
};

  let processCount = 0;
  const resultMap = new Map<string, { id: number; name: string; org_id: number; org_login: string; activity: number[]; details: any[] }>();
  const processRow = (row: any) => {
    if (!resultMap.has(row.id)) {
      resultMap.set(row.id, { id: row.id, name: row.name, org_id: row.org_id, org_login: row.org_login, activity: [], details: [] });
      for (let i = 0; i < processCount; i++) {
        resultMap.get(row.id)!.activity.push(0);
        resultMap.get(row.id)!.details.push({
          issue_comment: 0,
          open_issue: 0,
          open_pull: 0,
          review_comment: 0,
          merged_pull: 0,
        });
      }
    }
    resultMap.get(row.id)!.activity.push(row.activity);
    resultMap.get(row.id)!.details.push({
      issue_comment: row.issue_comment,
      open_issue: row.open_issue,
      open_pull: row.open_pull,
      review_comment: row.review_comment,
      merged_pull: row.merged_pull,
    });
  };
  const fillResultMap = () => {
    for (const v of resultMap.values()) {
      while (v.activity.length < processCount) {
        v.activity.push(0);
        v.details.push({
          issue_comment:  0,
          open_issue: 0,
          open_pull: 0,
          review_comment: 0,
          merged_pull: 0,
        });
      }
    }
  };

  // handle the groupTimeRange config
  // monthly
  if (config.groupTimeRange == 'month') {
    await forEveryMonthByConfig(config, async (y, m) => {
      const q = clickhouseActivityQuery([...whereClauses, `toYear(created_at) = ${y}`, `toMonth(created_at) = ${m}`], config.percision, config.order, config.limit);
      const monthResult = await clickhouse.query<any[]>(q);
      monthResult.forEach(processRow);
      processCount++;
      fillResultMap();
    });
  }

  // yearly
  if (config.groupTimeRange == 'year') {
    for (let year = config.startYear; year <= config.endYear; year++) {
      let monthWhereClause: string = '';
      if (year === config.startYear) {
        monthWhereClause = `toMonth(created_at) >= ${config.startMonth}`;
      } else if (year === config.endYear) {
        monthWhereClause = `toMonth(created_at) <= ${config.endMonth}`;
      }
      const q = clickhouseActivityQuery([...whereClauses, `toYear(created_at) = ${year}`, monthWhereClause].filter(i => i !== ''), config.percision, config.order, config.limit);
      const yearResult = await clickhouse.query<any[]>(q);
      yearResult.forEach(processRow);
      processCount++;
      fillResultMap();
    }
  }

  // quarterly
  if (config.groupTimeRange == 'quarter') {
    for (let year = config.startYear; year <= config.endYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        let quarterWhereClause: string = `toQuarter(created_at) = ${quarter}`;
        if (year === config.startYear) {
          quarterWhereClause += ` AND toMonth(created_at) >= ${config.startMonth}`;
        } else if (year === config.endYear) {
          quarterWhereClause += ` AND toMonth(created_at) <= ${config.endMonth}`;
        }
        const q = clickhouseActivityQuery([...whereClauses, `toYear(created_at) = ${year}`, quarterWhereClause].filter(i => i !== ''), config.percision, config.order, config.limit);
        const quarterResult = await clickhouse.query<any[]>(q);
        quarterResult.forEach(processRow);
        processCount++;
        fillResultMap();
      }
    }
  }

  // handle the groupBy config
  const addValues = (a, b) => {
    return {
      activity: a.activity.map((v, i) => parseFloat((v + b.activity[i]).toFixed(config.percision))),
      details: a.details.map((v, i) => {
        return {
          issue_comment: parseInt(v.issue_comment) + parseInt(b.details[i].issue_comment),
          open_issue: parseInt(v.open_issue) + parseInt(b.details[i].open_issue),
          open_pull: parseInt(v.open_pull) + parseInt(b.details[i].open_pull),
          review_comment: parseInt(v.review_comment) + parseInt(b.details[i].review_comment),
          merged_pull: parseInt(v.merged_pull) + parseInt(b.details[i].merged_pull),
        };
      }),
    }
  };
  if (!config.groupBy) {    // group by repo
    const result = Array.from(resultMap.values()).sort((a, b) => b.activity[b.activity.length - 1] - a.activity[a.activity.length - 1]);
    return result;
  } else if (config.groupBy === 'org') {    // group by org
    const orgMap = new Map<string, { activity: number[]; details: any[] }>();
    for (const v of resultMap.values()) {
      if (!orgMap.has(v.org_login)) orgMap.set(v.org_login, { activity: [0], details: [{
        issue_comment: 0,
        open_issue: 0,
        open_pull: 0,
        review_comment: 0,
        merged_pull: 0,
      }]});
      orgMap.set(v.org_login, addValues(orgMap.get(v.org_login)!, v)!);
    }
    const result = Array.from(orgMap.entries()).map(i => {
      return {
        name: i[0],
        ...i[1],
      }
    }).sort((a, b) => b.activity[b.activity.length - 1] - a.activity[a.activity.length - 1]);
    return result;
  } else {    // group by label
    const labelData = getLabelData()?.filter(l => l.type === config.groupBy);
    if (!labelData || labelData.length === 0) return null;
    const labelMap = new Map<string, { activity: number[]; details: any[] }>();
    for (const v of resultMap.values()) {
      const label = labelData.find(l => l.githubRepos.includes(parseInt(v.id.toString())) || l.githubOrgs.includes(parseInt(v.org_id.toString())))?.name;
      if (!label) {
        console.log(`Not found label for ${v.id}`);
        continue;
      }
      if (!labelMap.has(label)) labelMap.set(label, {
        activity: v.activity,
        details: v.details,
      });
      else labelMap.set(label, addValues(labelMap.get(label)!, v)!);
    }
    const result = Array.from(labelMap.entries()).map(i => {
      return {
        name: i[0],
        ...i[1],
      }
    }).sort((a, b) => b.activity[b.activity.length - 1] - a.activity[a.activity.length - 1]);
    return result;
  }
}

export const getUserActivityWithDetail = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const whereClauses: string[] = [];
  const userWhereClause = getUserWhereClauseForClickhouse(config);
  if (userWhereClause) whereClauses.push(userWhereClause);

  const clickhouseActivityQuery = (whereClauses: string[], percision: number, order: string, limit: number) => {
  return `SELECT actor_id AS id, anyHeavy(actor_login) AS login, ROUND(SUM(activity),${percision}) AS activity, SUM(issue_comment) AS issue_comment, SUM(open_issue) AS open_issue, SUM(open_pull) AS open_pull, SUM(review_comment) AS review_comment, SUM(merged_pull) AS merged_pull FROM
  (SELECT repo_id,
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id,
    argMax(if(type= 'PullRequestEvent' AND action= 'closed' AND pull_merged= 1, issue_author_login, actor_login), created_at) AS actor_login,
    countIf(type='IssueCommentEvent' AND action='created') AS issue_comment,
    countIf(type='IssuesEvent' AND action='opened')  AS open_issue,
    countIf(type='PullRequestEvent' AND action='opened') AS open_pull,
    countIf(type='PullRequestReviewCommentEvent' AND action='created') AS review_comment,
    countIf(type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull,
    sqrt(${ISSUE_COMMENT_WEIGHT}*issue_comment + ${OPEN_ISSUE_WEIGHT}*open_issue + ${OPEN_PULL_WEIGHT}*open_pull + ${REVIEW_COMMENT_WEIGHT}*review_comment + ${PULL_MERGED_WEIGHT}*merged_pull) AS activity
  FROM github_log.events
${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
GROUP BY repo_id, actor_id
HAVING activity > 0)
GROUP BY actor_id
ORDER BY activity ${order}
${limit > 0 ? `LIMIT ${limit}` : ''}`;
};
  let processCount = 0;
  const resultMap = new Map<string, { id: number; login: string; activity: number[]; details: any[] }>();
  const processRow = (row: any) => {
    if (!resultMap.has(row.id)) {
      resultMap.set(row.id, { id: row.id, login: row.login, activity: [], details: [] });
      for (let i = 0; i < processCount; i++) {
        resultMap.get(row.id)!.activity.push(0);
        resultMap.get(row.id)!.details.push({
          issue_comment: 0,
          open_issue: 0,
          open_pull: 0,
          review_comment: 0,
          merged_pull: 0,
        });
      }
    }
    resultMap.get(row.id)!.login = row.login;
    resultMap.get(row.id)!.activity.push(row.activity);
    resultMap.get(row.id)!.details.push({
      issue_comment: row.issue_comment,
      open_issue: row.open_issue,
      open_pull: row.open_pull,
      review_comment: row.review_comment,
      merged_pull: row.merged_pull,
    });
  };
  const fillResultMap = () => {
    for (const v of resultMap.values()) {
      while (v.activity.length < processCount) {
        v.activity.push(0);
        v.details.push({
          issue_comment:  0,
          open_issue: 0,
          open_pull: 0,
          review_comment: 0,
          merged_pull: 0,
        });
      }
    }
  };

  // handle the groupTimeRange config
  // monthly
  if (config.groupTimeRange == 'month') {
    await forEveryMonthByConfig(config, async (y, m) => {
      const q = clickhouseActivityQuery([...whereClauses, `toYear(created_at) = ${y}`, `toMonth(created_at) = ${m}`], config.percision, config.order, config.limit);
      const monthResult = await clickhouse.query<any[]>(q);
      monthResult.forEach(processRow);
      processCount++;
      fillResultMap();
    });
  }

  // yearly
  if (config.groupTimeRange == 'year') {
    for (let year = config.startYear; year <= config.endYear; year++) {
      let monthWhereClause: string = '';
      if (year === config.startYear) {
        monthWhereClause = `toMonth(created_at) >= ${config.startMonth}`;
      } else if (year === config.endYear) {
        monthWhereClause = `toMonth(created_at) <= ${config.endMonth}`;
      }
      const q = clickhouseActivityQuery([...whereClauses, `toYear(created_at) = ${year}`, monthWhereClause].filter(i => i !== ''), config.percision, config.order, config.limit);
      const yearResult = await clickhouse.query<any[]>(q);
      yearResult.forEach(processRow);
      processCount++;
      fillResultMap();
    }
  }

  // quarterly
  if (config.groupTimeRange == 'quarter') {
    for (let year = config.startYear; year <= config.endYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        let quarterWhereClause: string = `toQuarter(created_at) = ${quarter}`;
        if (year === config.startYear) {
          quarterWhereClause += ` AND toMonth(created_at) >= ${config.startMonth}`;
        } else if (year === config.endYear) {
          quarterWhereClause += ` AND toMonth(created_at) <= ${config.endMonth}`;
        }
        const q = clickhouseActivityQuery([...whereClauses, `toYear(created_at) = ${year}`, quarterWhereClause].filter(i => i !== ''), config.percision, config.order, config.limit);
        const quarterResult = await clickhouse.query<any[]>(q);
        quarterResult.forEach(processRow);
        processCount++;
        fillResultMap();
      }
    }
  }

  const result = Array.from(resultMap.values()).sort((a, b) => b.activity[b.activity.length - 1] - a.activity[a.activity.length - 1]);
  return result;
}
