import { merge } from 'lodash';
import { getGitHubData } from '../label_data_utils';

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
  groupTimeRange?: 'month' | 'season' | 'year';
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

export const forEveryMonthByConfig = (config: QueryConfig, func: (y: number, m: number) => void) => {
  forEveryMonth(config.startYear, config.startMonth, config.endYear, config.endMonth, func);
}

export const forEveryMonth = (startYear: number, startMonth: number, endYear: number, endMonth: number, func: (y: number, m: number) => void) => {
  for (let y = startYear; y <= endYear; y++) {
    for (let m = (y === startYear ? startMonth : 1);
              m <= (y === endYear ? endMonth : 12); m++) {
      func(y, m);
    }
  }
}

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

export const getTimeRangeWhereClauseForNeo4j = (config: QueryConfig, type: string): string => {
  const timeWhereClauseArray: string[] = [];
  forEveryMonthByConfig(config, (y, m) => timeWhereClauseArray.push(`EXISTS(${type}.activity_${y}${m})`));
  if (timeWhereClauseArray.length === 0) throw new Error('Not valid time range.');
  const timeWhereClause = `(${timeWhereClauseArray.join(' OR ')})`;
  return timeWhereClause;
}

export const getTimeRangeSumClauseForNeo4j = (config: QueryConfig, type: string): string[] => {
  const timeRangeSumClauseArray: string[][] = [];
  if (config.groupTimeRange === 'month') {
    // for every month individual, every element belongs to a individual element
    forEveryMonthByConfig(config, (y, m) => timeRangeSumClauseArray.push([`COALESCE(${type}_${y}${m}, 0.0)`]));
  } else if (config.groupTimeRange === 'season') {
    // for every season, need to find out when to push a new element by the season
    let lastSeason = 0;
    forEveryMonthByConfig(config, (y, m) => {
      const s = Math.ceil(m / 3);
      if (s !== lastSeason) timeRangeSumClauseArray.push([]);
      timeRangeSumClauseArray[timeRangeSumClauseArray.length - 1].push(`COALESCE(${type}_${y}${m}, 0.0)`);
      lastSeason = s;
    });
  } else if (config.groupTimeRange === 'year') {
    // for every year, need to find out when to push a new element by the year;
    let lastYear = 0;
    forEveryMonthByConfig(config, (y, m) => {
      if (y !== lastYear) timeRangeSumClauseArray.push([]);
      timeRangeSumClauseArray[timeRangeSumClauseArray.length - 1].push(`COALESCE(${type}_${y}${m}, 0.0)`);
      lastYear = y;
    });
  } else {
    // for all to single one, push to the first element
    timeRangeSumClauseArray.push([]);
    forEveryMonthByConfig(config, (y, m) => timeRangeSumClauseArray[0].push(`COALESCE(${type}_${y}${m}, 0.0)`));
  }
  if (timeRangeSumClauseArray.length === 0) throw new Error('Not valid time range.');
  const timeRangeSumClause = timeRangeSumClauseArray.map(i => `round(${i.join(' + ')}, ${config.percision})`);
  return timeRangeSumClause;
}
