import { merge } from 'lodash';
import { getGitHubData } from '../label_data_utils';

export interface QueryConfig {
  range: {
    labelTypes?: string[],
    labelIds?: string[],
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
  };
  filter?: {
    labelTypes?: string[];
    labelIds?: string[];
  };
  aggregate?: {
    type?: 'all' | 'repo' | 'org';
    labelType?: string;
  },
  queryParam: {
    orderBy?: string;
    limit: number;
  }
};

export const getMergedConfig = (config: QueryConfig): QueryConfig => {
  const defaultConfig: QueryConfig = {
    range: {
      startYear: 2015,
      startMonth: 1,
      endYear: new Date().getFullYear(),
      endMonth: new Date().getMonth(),
    },
    queryParam: {
      limit: 10,
    },
  };
  return merge(defaultConfig, config);
}

export const forEveryMonth = (config: QueryConfig, func: (y: number, m: number) => void) => {
  for (let y = config.range.startYear; y <= config.range.endYear; y++) {
    for (let m = (y === config.range.startYear ? config.range.startMonth : 1);
              m <= (y === config.range.endYear ? config.range.endMonth : 12); m++) {
      func(y, m);
    }
  }
}

export const getRepoWhereClauseForNeo4j = (config: QueryConfig): string | null => {
  const repoWhereClauseArray: string[] = [];
  if (config.range?.repoIds) repoWhereClauseArray.push(`r.id IN [${config.range.repoIds.join(',')}]`);
  if (config.range?.repoNames) repoWhereClauseArray.push(`r.name IN [${config.range.repoNames.map(n => `'${n}'`)}]`);
  if (config.range?.orgIds) repoWhereClauseArray.push(`r.org_id IN [${config.range.orgIds}]`);
  if (config.range?.orgNames) repoWhereClauseArray.push(`r.org_name IN [${config.range.orgNames.map(o => `'${o}'`)}]`);
  const data = getGitHubData({ids: config.range.labelIds, types: config.range.labelTypes});
  if (data.githubRepos.length > 0) repoWhereClauseArray.push(`r.id IN [${data.githubRepos.join(',')}]`);
  if (data.githubOrgs.length > 0) repoWhereClauseArray.push(`r.org_id IN [${data.githubOrgs.join(',')}]`);
  const repoWhereClause = repoWhereClauseArray.length > 0 ? `(${repoWhereClauseArray.join(' OR ')})` : null;
  return repoWhereClause;
}

export const getUserWhereClauseForNeo4j = (config: QueryConfig): string | null => {
  const userWhereClauseArray: string[] = [];
  if (config.range?.userIds) userWhereClauseArray.push(`u.id IN [${config.range.userIds.join(',')}]`);
  if (config.range?.userLogins) userWhereClauseArray.push(`u.login IN [${config.range.userLogins.map(n => `'${n}'`)}]`);
  const data = getGitHubData({ids: config.range.labelIds, types: config.range.labelTypes});
  if (data.githubRepos.length > 0) userWhereClauseArray.push(`u.id IN [${data.githubUsers.join(',')}]`);
  const userWhereClause = userWhereClauseArray.length > 0 ? `(${userWhereClauseArray.join(' OR ')})` : null;
  return userWhereClause;
}

export const getTimeRangeWhereClauseForNeo4j = (config: QueryConfig, type: string): string => {
  const timeWhereClauseArray: string[] = [];
  forEveryMonth(config, (y, m) => timeWhereClauseArray.push(`EXISTS(${type}.activity_${y}${m})`));
  if (timeWhereClauseArray.length === 0) throw new Error('Not valid time range.');
  const timeWhereClause = `(${timeWhereClauseArray.join(' OR ')})`;
  return timeWhereClause;
}

export const getTimeRangeSumClauseForNeo4j = (config: QueryConfig, type: string): string => {
  const timeRangeSumClauseArray: string[] = [];
  forEveryMonth(config, (y, m) => timeRangeSumClauseArray.push(`COALESCE(${type}_${y}${m}, 0.0)`));
  if (timeRangeSumClauseArray.length === 0) throw new Error('Not valid time range.');
  const timeRangeSumClause = `(${timeRangeSumClauseArray.join(' + ')})`;
  return timeRangeSumClause;
}
