import { merge } from 'lodash';
import { getGitHubData, getLabelData } from '../label_data_utils';

export interface QueryConfig {
  labelUnion?: string[];
  labelIntersect?: string[];
  repoIds?: number[];
  orgIds?: number[];
  repoNames?: string[];
  orgNames?: string[];
  userIds?: number[];
  userLogins?: string[];
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  order: 'DESC' | 'ASC';
  limit: number;
  percision: number;
  groupBy?: 'org' | string;
  groupTimeRange?: 'month' | 'quarter' | 'year';
};

export const getMergedConfig = (config: any): QueryConfig => {
  const defaultConfig: QueryConfig = {
      startYear: 2015,
      startMonth: 1,
      endYear: new Date().getFullYear(),
      endMonth: new Date().getMonth(),
      order: 'DESC',
      limit: 10,
      percision: 2,
  };
  return merge(defaultConfig, config);
}

export const forEveryMonthByConfig = async (config: QueryConfig, func: (y: number, m: number) => Promise<any>) => {
  return forEveryMonth(config.startYear, config.startMonth, config.endYear, config.endMonth, func);
}

export const forEveryMonth = async (startYear: number, startMonth: number, endYear: number, endMonth: number, func: (y: number, m: number) => Promise<any>) => {
  for (let y = startYear; y <= endYear; y++) {
    for (let m = (y === startYear ? startMonth : 1);
              m <= (y === endYear ? endMonth : 12); m++) {
      await func(y, m);
    }
  }
}

// Repo
export const getRepoWhereClauseForNeo4j = (config: QueryConfig): string | null => {
  const repoWhereClauseArray: string[] = [];
  if (config.repoIds) repoWhereClauseArray.push(`r.id IN [${config.repoIds.join(',')}]`);
  if (config.repoNames) repoWhereClauseArray.push(`r.name IN [${config.repoNames.map(n => `'${n}'`)}]`);
  if (config.orgIds) repoWhereClauseArray.push(`r.org_id IN [${config.orgIds.join(',')}]`);
  if (config.orgNames) repoWhereClauseArray.push(`r.org_name IN [${config.orgNames.map(o => `'${o}'`)}]`);
  if (config.labelIntersect) {
    return '(' + config.labelIntersect.map(l => {
      const data = getGitHubData([l]);
      const arr: string[] = [];
      if (data.githubRepos.length > 0) arr.push(`r.id IN [${data.githubRepos.join(',')}]`);
      if (data.githubOrgs.length > 0) arr.push(`r.org_id IN [${data.githubOrgs.join(',')}]`);
      if (arr.length === 0) return null;
      return `(${arr.join(' OR ')})`;
    }).filter(i => i !== null).join(' AND ') + ')';
  }
  if (config.labelUnion) {
    const data = getGitHubData(config.labelUnion);
    if (data.githubRepos.length > 0) repoWhereClauseArray.push(`r.id IN [${data.githubRepos.join(',')}]`);
    if (data.githubOrgs.length > 0) repoWhereClauseArray.push(`r.org_id IN [${data.githubOrgs.join(',')}]`);
  }
  const repoWhereClause = repoWhereClauseArray.length > 0 ? `(${repoWhereClauseArray.join(' OR ')})` : null;
  return repoWhereClause;
}

export const getRepoWhereClauseForClickhouse = (config: QueryConfig): string | null => {
  const repoWhereClauseArray: string[] = [];
  if (config.repoIds) repoWhereClauseArray.push(`repo_id IN [${config.repoIds.join(',')}]`);
  if (config.repoNames) repoWhereClauseArray.push(`repo_name IN [${config.repoNames.map(n => `'${n}'`)}]`);
  if (config.orgIds) repoWhereClauseArray.push(`org_id IN [${config.orgIds.join(',')}]`);
  if (config.orgNames) repoWhereClauseArray.push(`org_name IN [${config.orgNames.map(o => `'${o}'`)}]`);
  if (config.labelIntersect) {
    return '(' + config.labelIntersect.map(l => {
      const data = getGitHubData([l]);
      const arr: string[] = [];
      if (data.githubRepos.length > 0) arr.push(`repo_id IN [${data.githubRepos.join(',')}]`);
      if (data.githubOrgs.length > 0) arr.push(`org_id IN [${data.githubOrgs.join(',')}]`);
      if (arr.length === 0) return null;
      return `(${arr.join(' OR ')})`;
    }).filter(i => i !== null).join(' AND ') + ')';
  }
  if (config.labelUnion) {
    const data = getGitHubData(config.labelUnion);
    if (data.githubRepos.length > 0) repoWhereClauseArray.push(`repo_id IN [${data.githubRepos.join(',')}]`);
    if (data.githubOrgs.length > 0) repoWhereClauseArray.push(`org_id IN [${data.githubOrgs.join(',')}]`);
  }
  const repoWhereClause = repoWhereClauseArray.length > 0 ? `(${repoWhereClauseArray.join(' OR ')})` : null;
  return repoWhereClause;
}

// User
export const getUserWhereClauseForNeo4j = (config: QueryConfig): string | null => {
  const userWhereClauseArray: string[] = [];
  if (config.userIds) userWhereClauseArray.push(`u.id IN [${config.userIds.join(',')}]`);
  if (config.userLogins) userWhereClauseArray.push(`u.login IN [${config.userLogins.map(n => `'${n}'`)}]`);
  if (config.labelIntersect) {
    return '(' + config.labelIntersect.map(l => {
      const data = getGitHubData([l]);
      if (data.githubUsers.length > 0) return `u.id IN [${data.githubRepos.join(',')}]`;
      return null;
    }).filter(i => i !== null).join(' AND ') + ')';
  }
  if (config.labelUnion) {
    const data = getGitHubData(config.labelUnion);
    if (data.githubUsers.length > 0) userWhereClauseArray.push(`u.id IN [${data.githubUsers.join(',')}]`);
  }
  const userWhereClause = userWhereClauseArray.length > 0 ? `(${userWhereClauseArray.join(' OR ')})` : null;
  return userWhereClause;
}

export const getUserWhereClauseForClickhouse = (config: QueryConfig): string | null => {
  const userWhereClauseArray: string[] = [];
  if (config.userIds) userWhereClauseArray.push(`actor_id IN [${config.userIds.join(',')}]`);
  if (config.userLogins) userWhereClauseArray.push(`actor_login IN [${config.userLogins.map(n => `'${n}'`)}]`);
  if (config.labelIntersect) {
    return '(' + config.labelIntersect.map(l => {
      const data = getGitHubData([l]);
      if (data.githubUsers.length > 0) return `actor_id IN [${data.githubUsers.join(',')}]`;
      return null;
    }).filter(i => i !== null).join(' AND ') + ')';
  }
  if (config.labelUnion) {
    const data = getGitHubData(config.labelUnion);
    if (data.githubUsers.length > 0) userWhereClauseArray.push(`actor_id IN [${data.githubUsers.join(',')}]`);
  }
  const userWhereClause = userWhereClauseArray.length > 0 ? `(${userWhereClauseArray.join(' OR ')})` : null;
  return userWhereClause;
}

// Time
export const getTimeRangeWhereClauseForNeo4j = async (config: QueryConfig, type: string): Promise<string> => {
  const timeWhereClauseArray: string[] = [];
  await forEveryMonthByConfig(config, async (y, m) => timeWhereClauseArray.push(`${type}.activity_${y}${m} > 0`));
  if (timeWhereClauseArray.length === 0) throw new Error('Not valid time range.');
  const timeWhereClause = `(${timeWhereClauseArray.join(' OR ')})`;
  return timeWhereClause;
}

export const getTimeRangeSumClauseForNeo4j = async (config: QueryConfig, type: string): Promise<string[]> => {
  const timeRangeSumClauseArray: string[][] = [];
  if (config.groupTimeRange === 'month') {
    // for every month individual, every element belongs to a individual element
    await forEveryMonthByConfig(config, async (y, m) => timeRangeSumClauseArray.push([`COALESCE(${type}_${y}${m}, 0.0)`]));
  } else if (config.groupTimeRange === 'quarter') {
    // for every quarter, need to find out when to push a new element by quarter
    let lastQuarter = 0;
    await forEveryMonthByConfig(config, async (y, m) => {
      const q = Math.ceil(m / 3);
      if (q !== lastQuarter) timeRangeSumClauseArray.push([]);
      timeRangeSumClauseArray[timeRangeSumClauseArray.length - 1].push(`COALESCE(${type}_${y}${m}, 0.0)`);
      lastQuarter = q;
    });
  } else if (config.groupTimeRange === 'year') {
    // for every year, need to find out when to push a new element by the year;
    let lastYear = 0;
    await forEveryMonthByConfig(config, async (y, m) => {
      if (y !== lastYear) timeRangeSumClauseArray.push([]);
      timeRangeSumClauseArray[timeRangeSumClauseArray.length - 1].push(`COALESCE(${type}_${y}${m}, 0.0)`);
      lastYear = y;
    });
  } else {
    // for all to single one, push to the first element
    timeRangeSumClauseArray.push([]);
    await forEveryMonthByConfig(config, async (y, m) => timeRangeSumClauseArray[0].push(`COALESCE(${type}_${y}${m}, 0.0)`));
  }
  if (timeRangeSumClauseArray.length === 0) throw new Error('Not valid time range.');
  const timeRangeSumClause = timeRangeSumClauseArray.map(i => `round(${i.join(' + ')}, ${config.percision})`);
  return timeRangeSumClause;
}

export const getTimeRangeWhereClauseForClickhouse = (config: QueryConfig): string => {
  const endDate = new Date(`${config.endYear}-${config.endMonth}-1`);
  endDate.setMonth(config.endMonth);  // find next month
  return ` created_at >= toDate('${config.startYear}-${config.startMonth}-1') AND created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-1') `;
}

// clickhouse label group condition
export const getLabelGroupConditionClauseForClickhouse = (config: QueryConfig): string => {
  const labelData = getLabelData()?.filter(l => l.type === config.groupBy);
  if (!labelData || labelData.length === 0) throw new Error(`Invalide group by label: ${config.groupBy}`);
  const idLabelRepoMap = new Map<number, string[]>();
  const idLabelOrgMap = new Map<number, string[]>();
  const idLabelUserMap = new Map<number, string[]>();
  const addToMap = (map: Map<number, string[]>, id: number, label: string) => {
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(label);
  };

  labelData.forEach(l => {
    l.githubOrgs.forEach(id => addToMap(idLabelOrgMap, id, l.name));
    l.githubRepos.forEach(id => addToMap(idLabelRepoMap, id, l.name));
    l.githubUsers.forEach(id => addToMap(idLabelUserMap, id, l.name));
  });

  const resultMap = new Map<string, { labels: string[], repoIds: number[], orgIds: number[], userIds: number[] }>();
  const addToResultMap = (map: Map<string, { labels: string[], repoIds: number[], orgIds: number[], userIds: number[] }>, id: number, labels: string[], type: 'repo' | 'org' | 'user') => {
    const key = labels.toString();
    if (!map.has(key)) map.set(key, { labels, repoIds: [], orgIds: [], userIds: [] });
    if (type === 'repo') map.get(key)!.repoIds.push(id);
    else if (type === 'org') map.get(key)!.orgIds.push(id);
    else if (type === 'user') map.get(key)!.userIds.push(id);
  }
  idLabelRepoMap.forEach((labels, id) => addToResultMap(resultMap, id, labels, 'repo'));
  idLabelOrgMap.forEach((labels, id) => addToResultMap(resultMap, id, labels, 'org'));
  idLabelUserMap.forEach((labels, id) => addToResultMap(resultMap, id, labels, 'user'));

  const conditions = Array.from(resultMap.values()).map(v => {
    const c: string[] = [];
    if (v.orgIds.length > 0) c.push(`org_id IN (${v.orgIds.join(',')})`);
    if (v.repoIds.length > 0) c.push(`repo_id IN (${v.repoIds.join(',')})`);
    if (v.userIds.length > 0) c.push(`actor_id IN (${v.userIds.join(',')})`);
    return `(${c.join(' OR ')}),[${v.labels.map(l => `'${l}'`).join(',')}]`;
  }).join(',');

  return `arrayJoin(multiIf(${conditions}, ['Others']))`;
}

export const getGroupArrayInsertAtClauseForClickhouse = (config: QueryConfig, key: string, defaultValue: string = '0'): string => {
  return `groupArrayInsertAt(${defaultValue})(${key}, ${(() => {
    if (!config.groupTimeRange) return '0';
    let startTime = `toDate('${config.startYear}-${config.startMonth}-1')`;
    if (config.groupTimeRange === 'quarter') startTime = `toStartOfQuarter(${startTime})`;
    else if (config.groupTimeRange === 'year') startTime = `toStartOfYear(${startTime})`;
    return `toUInt32(dateDiff('${config.groupTimeRange}', ${startTime}, time))`;
  })()}) AS ${key}`
}

export const getGroupTimeAndIdClauseForClickhouse = (config: QueryConfig, type: string = 'repo'): string => {
  return `${(() => {
    let groupEle = '1'; // no time range, aggregate all data to a single value
    if (config.groupTimeRange === 'month') groupEle = 'month';
    else if (config.groupTimeRange === 'quarter') groupEle = `toStartOfQuarter(month)`;
    else if (config.groupTimeRange === 'year') groupEle = `toStartOfYear(month)`;
    return groupEle;
  })()} AS time, ${(() => {
    if (!config.groupBy) {  // group by repo'
      if (type === 'repo')
        return 'repo_id AS id, argMax(repo_name, month) AS name';
      else
        return `actor_id AS id, argMax(actor_login, month) AS name`;
    } else if (config.groupBy === 'org') {
      return `org_id AS id, argMax(org_login, month) AS name`;
    } else {  // group by label
      return `${getLabelGroupConditionClauseForClickhouse(config)} AS id, id AS name`;
    }
  })()}`;
}
