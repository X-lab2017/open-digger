import { merge } from 'lodash';
import { query } from '../db/clickhouse';
import { PlatformNames, OptionLabelItem, getPlatformData } from '../labelDataUtils';

export interface QueryConfig<T = any> {
  labelUnion?: string[];
  labelIntersect?: string[];
  label?: OptionLabelItem;
  idOrNames?: {
    platform: PlatformNames;
    repoIds?: number[];
    orgIds?: number[];
    repoNames?: string[];
    orgNames?: string[];
    userIds?: number[];
    userLogins?: string[];
  }[];
  whereClause?: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  order?: 'DESC' | 'ASC';
  orderOption?: 'latest' | 'total',
  limit: number;
  limitOption: 'each' | 'all';
  precision: number;
  groupBy?: 'org' | string;
  groupTimeRange?: 'month' | 'quarter' | 'year';
  injectLabelData?: any[];
  options?: T;
};

export const getMergedConfig = (config: any): QueryConfig => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const defaultConfig: QueryConfig = {
    startYear: 2015,
    startMonth: 1,
    endYear: now.getFullYear(),
    endMonth: now.getMonth() + 1,
    orderOption: 'latest',
    limit: 10,
    limitOption: 'all',
    precision: 2,
  };
  return merge(defaultConfig, config);
};

export interface TimeDurationOption {
  unit: 'week' | 'day' | 'hour' | 'minute';
  thresholds: number[];
  sortBy: 'avg' | 'levels' | 'quantile_0' | 'quantile_1' | 'quantile_2' | 'quantile_3' | 'quantile_4'
};

export const timeDurationConstants = {
  unitArray: ['week', 'day', 'hour', 'minute'],
  sortByArray: ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4'],
  quantileArray: [...Array(5).keys()],
};

export const forEveryMonthByConfig = async (config: QueryConfig, func: (y: number, m: number) => Promise<any>) => {
  return forEveryMonth(config.startYear, config.startMonth, config.endYear, config.endMonth, func);
};

export const forEveryMonth = async (startYear: number, startMonth: number, endYear: number, endMonth: number, func: (y: number, m: number) => Promise<any>) => {
  for (let y = startYear; y <= endYear; y++) {
    for (let m = (y === startYear ? startMonth : 1);
      m <= (y === endYear ? endMonth : 12); m++) {
      await func(y, m);
    }
  }
};

export const forEveryQuarterByConfig = async (config: QueryConfig, func: (y: number, q: number) => Promise<any>) => {
  const quarters: { y: number, q: number }[] = [];
  let lastQuarter = -1;
  await forEveryMonthByConfig(config, async (y, m) => {
    const q = Math.ceil(m / 3);
    if (q !== lastQuarter) {
      quarters.push({ y, q });
      lastQuarter = q;
    }
  });
  for (const i of quarters) {
    await func(i.y, i.q);
  }
};

export const forEveryYearByConfig = async (config: QueryConfig, func: (y: number) => Promise<any>) => {
  const years: number[] = [];
  let lastYear = -1;
  await forEveryMonthByConfig(config, async y => {
    if (y !== lastYear) {
      years.push(y);
      lastYear = y;
    }
  });
  for (const y of years) {
    await func(y);
  }
};

export const getWithClause = (config: QueryConfig): string => {
  if (config.label) {
    return `WITH ${config.label.withParamClause}`;
  }
  return '';
}

// Repo
export const getRepoWhereClause = async (config: QueryConfig): Promise<string | null> => {
  const repoWhereClauseArray: string[] = [];

  // id or names
  if (config.idOrNames && Array.isArray(config.idOrNames) && config.idOrNames.length > 0) {
    for (const p of config.idOrNames) {
      if (p.repoNames && p.repoNames.length > 0) {
        // convert repo name to id
        const sql = `SELECT any(repo_id) AS id FROM global_openrank WHERE repo_name IN [${p.repoNames.map(n => `'${n}'`)}] AND platform='${p.platform}' GROUP BY repo_name`;
        const repoIds = (await query<any>(sql, { format: 'JSONEachRow' })).map(r => r.id);
        repoWhereClauseArray.push(`(events.repo_id IN [${repoIds.join(',')}] AND events.platform='${p.platform}')`);
      }

      if (p.repoIds && p.repoIds.length > 0) repoWhereClauseArray.push(`(events.repo_id IN [${p.repoIds.join(',')}] AND events.platform='${p.platform}')`);

      if (p.orgNames && p.orgNames.length > 0) {
        // convert org name to id
        const sql = `SELECT any(org_id) AS id FROM global_openrank WHERE org_login IN [${p.orgNames.map(n => `'${n}'`)}] AND platform='${p.platform}' GROUP BY org_login`;
        const orgIds = (await query<any>(sql, { format: 'JSONEachRow' })).map(r => r.id);
        repoWhereClauseArray.push(`(events.org_id IN [${orgIds.join(',')}] AND events.platform='${p.platform}')`);
      }

      if (p.orgIds && p.orgIds.length > 0) repoWhereClauseArray.push(`(events.org_id IN [${p.orgIds.join(',')}] AND events.platform='${p.platform}')`);
    }
  }

  // label intersect
  if (config.labelIntersect) {
    const condition = '(' + config.labelIntersect.map(l => {
      const data = getPlatformData([l], config.injectLabelData);
      const arr: string[] = [];
      for (const p of data) {
        if (p.repos.length > 0) arr.push(`(events.repo_id IN [${p.repos.map(r => r.id).join(',')}] AND events.platform='${p.name}')`);
        if (p.orgs.length > 0) arr.push(`(events.org_id IN [${p.orgs.map(o => o.id).join(',')}] AND events.platform='${p.name}')`);
      }
      if (arr.length === 0) return null;
      return `(${arr.join(' OR ')})`;
    }).filter(i => i !== null).join(' AND ') + ')';
    repoWhereClauseArray.push(condition);
  };

  // label union
  if (config.labelUnion) {
    const data = getPlatformData(config.labelUnion, config.injectLabelData);
    for (const p of data) {
      if (p.repos.length > 0) repoWhereClauseArray.push(`(events.repo_id IN [${p.repos.map(r => r.id).join(',')}] AND events.platform='${p.name}')`);
      if (p.orgs.length > 0) repoWhereClauseArray.push(`(events.org_id IN [${p.orgs.map(o => o.id).join(',')}] AND events.platform='${p.name}')`);
    }
  }

  if (config.label) {
    repoWhereClauseArray.push(config.label.repoWhereClause);
  }

  // where clause
  if (config.whereClause) {
    repoWhereClauseArray.push(config.whereClause);
  }

  const repoWhereClause = repoWhereClauseArray.length > 0 ? `(${repoWhereClauseArray.join(' OR ')})` : null;
  return repoWhereClause;
};

// User
export const getUserWhereClause = async (config: QueryConfig, idCol: string = 'actor_id'): Promise<string | null> => {
  const userWhereClauseArray: string[] = [];

  // id or names
  if (config.idOrNames && Array.isArray(config.idOrNames) && config.idOrNames.length > 0) {
    for (const p of config.idOrNames) {
      if (p.userLogins && p.userLogins.length > 0) {
        // convert user login to id
        const sql = `SELECT any(actor_id) AS id FROM global_openrank WHERE actor_login IN [${p.userLogins.map(n => `'${n}'`)}] AND platform='${p.platform}' GROUP BY actor_login`;
        const userIds = (await query<any>(sql, { format: 'JSONEachRow' })).map(r => r.id);
        userWhereClauseArray.push(`(${idCol} IN [${userIds.join(',')}] AND platform='${p.platform}')`);
      }

      if (p.userIds && p.userIds.length > 0) userWhereClauseArray.push(`(${idCol} IN [${p.userIds.join(',')}] AND platform='${p.platform}')`);
    }
  }

  // label intersect
  if (config.labelIntersect) {
    const condition = '(' + config.labelIntersect.map(l => {
      const data = getPlatformData([l], config.injectLabelData);
      const arr: string[] = [];
      for (const p of data) {
        if (p.users.length > 0) arr.push(`(${idCol} IN [${p.users.map(u => u.id).join(',')}] AND platform='${p.name}')`);
      }
      if (arr.length === 0) return null;
      return `(${arr.join(' OR ')})`;
    }).filter(i => i !== null).join(' AND ') + ')';
    userWhereClauseArray.push(condition);
  }

  // label union
  if (config.labelUnion) {
    const data = getPlatformData(config.labelUnion, config.injectLabelData);
    for (const p of data) {
      if (p.users.length > 0) userWhereClauseArray.push(`(${idCol} IN [${p.users.map(u => u.id).join(',')}] AND platform='${p.name}')`);
    }
  }

  if (config.label) {
    userWhereClauseArray.push(config.label.userWhereClause);
  }

  // where clause
  if (config.whereClause) {
    userWhereClauseArray.push(config.whereClause);
  }

  const userWhereClause = userWhereClauseArray.length > 0 ? `(${userWhereClauseArray.join(' OR ')})` : null;
  return userWhereClause;
};

export const getTimeRangeWhereClause = (config: QueryConfig): string => {
  return `events.created_at >= toDate('${config.startYear}-${config.startMonth}-1') AND events.created_at < dateAdd(month, 1, toDate('${config.endYear}-${config.endMonth}-1'))`;
};

export const getGroupArrayInsertAtClause = (config: QueryConfig, option: { key: string; defaultValue?: string; value?: string; noPrecision?: boolean, positionByEndTime?: boolean }): string => {
  let startTime = `toDate('${config.startYear}-${config.startMonth}-1')`;
  let endTime = `toDate('${config.endYear}-${config.endMonth}-1')`;
  return `groupArrayInsertAt(
    ${option.defaultValue ?? 0  // default value
    },
    ${(() => {
      // total length
      if (config.groupTimeRange) {
        return `toUInt32(dateDiff('${config.groupTimeRange}', ${startTime}, ${endTime})) + 1)`;
      } else {
        return '1)';
      }
    })()}(${(() => {
      // group key
      const name = option.value ? option.value : option.key;
      if (config.precision > 0 && !option.noPrecision) return `ROUND(${name}, ${config.precision})`;
      return name;
    })()},
    ${(() => {
      // position
      if (!config.groupTimeRange) return '0';
      if (config.groupTimeRange === 'quarter') startTime = `toStartOfQuarter(${startTime})`;
      else if (config.groupTimeRange === 'year') startTime = `toStartOfYear(${startTime})`;
      return `toUInt32(dateDiff('${config.groupTimeRange}', ${startTime}, time)${option.positionByEndTime ? '-1' : ''})`;
    })()}) AS ${option.key}`
};

export const getGroupTimeClause = (config: QueryConfig, timeCol: string = 'created_at'): string => {
  return `${(() => {
    let groupEle = `dateAdd(month, 1, toDate('${config.endYear}-${config.endMonth}-1'))`; // no time range, aggregate all data to a single value, use next month of end time to make sure time compare works.
    if (config.groupTimeRange === 'month') groupEle = `toStartOfMonth(${timeCol})`;
    else if (config.groupTimeRange === 'quarter') groupEle = `toStartOfQuarter(${timeCol})`;
    else if (config.groupTimeRange === 'year') groupEle = `toStartOfYear(${timeCol})`;
    return groupEle;
  })()} AS time`;
};

export const getGroupIdClause = (config: QueryConfig, type: string = 'repo', timeCol?: string) => {
  return `${(() => {
    const timeColumn = timeCol ?? (config.groupTimeRange ? 'time' : 'events.created_at');
    if (!config.groupBy) {  // group by repo'
      if (type === 'repo')
        return `events.repo_id AS id, events.platform, argMax(events.repo_name, ${timeColumn}) AS name`;
      else
        return `events.actor_id AS id, events.platform, argMax(events.actor_login, ${timeColumn}) AS name`;
    } else if (config.groupBy === 'org') {
      return `events.org_id AS id, events.platform, argMax(events.org_login, ${timeColumn}) AS name`;
    } else {  // group by label
      return `l.id AS id, 'All' AS platform, any(l.name) AS name, 1 AS repos, 1 AS orgs, 1 AS developers`;
    }
  })()}`;
};

export const getInnerOrderAndLimit = (config: QueryConfig, col: string, index?: number) => {
  return `${config.limitOption === 'each' && config.limit > 0 ?
    `${config.order ? `ORDER BY ${col}${index !== undefined ? `[${index}]` : ''} ${config.order}` : ''} LIMIT ${config.limit} BY time` :
    ''}`
};

export const getOutterOrderAndLimit = (config: QueryConfig, col: string, index?: number) => {
  return `${config.order ? `ORDER BY ${config.orderOption === 'latest'
    ? `${col}[-1]${index !== undefined ? `[${index}]` : ''}`
    : `arraySum(${index !== undefined ? `x -> x[${index}],` : ''}${col})`
    } ${config.order}` : ''}
    ${config.limitOption === 'all' && config.limit > 0 ? `LIMIT ${config.limit}` : ''}`;
};

export const getTopLevelPlatform = (config: QueryConfig, noCount = false) => {
  if (!noCount && (config.groupBy && config.groupBy !== 'org' && config.groupBy !== 'repo')) {
    return `'All' AS platform, ${getGroupArrayInsertAtClause(config, { key: 'repos' })}, ${getGroupArrayInsertAtClause(config, { key: 'orgs' })}, ${getGroupArrayInsertAtClause(config, { key: 'developers' })}`;
  } else {
    return 'platform, 1 AS repos, 1 AS orgs, 1 AS developers';
  }
};

export const getLabelJoinClause = (config: QueryConfig, tableName: string = 'events') => {
  if (config.groupBy && config.groupBy !== 'org' && config.groupBy !== 'repo') {
    return `INNER JOIN (SELECT id, platform, name, entity_id, entity_type FROM flatten_labels WHERE type='${config.groupBy}') AS l
    ON (l.entity_id = ${tableName}.repo_id AND l.entity_type = 'Repo' AND l.platform = ${tableName}.platform)
    OR (l.entity_id = ${tableName}.org_id AND l.entity_type = 'Org' AND l.platform = ${tableName}.platform)
    OR (l.entity_id = ${tableName}.actor_id AND l.entity_type = 'User' AND l.platform = ${tableName}.platform)`;
  }
  return '';
};

export const getInnerGroupBy = (config: QueryConfig) => {
  if (config.groupBy && config.groupBy !== 'org' && config.groupBy !== 'repo') {
    return 'GROUP BY id, time';
  } else {
    return 'GROUP BY id, platform, time';
  }
};

export const filterEnumType = (value: any, types: string[], defautlValue: string): string => {
  if (!value || !types.includes(value)) return defautlValue;
  return value;
};

export const processQueryResult = (result: any, customKeys: string[],
  postProcessor?: { [key: string]: (value: any) => any }): any[] => {
  const keys = ['id', 'platform', 'repos', 'orgs', 'developers', 'name', ...customKeys];
  return result.map((r: any) => {
    const obj: any = {};
    keys.forEach((k, i) => {
      obj[k] = postProcessor && postProcessor[k] ? postProcessor[k](r[i]) : r[i];
    });
    return obj;
  });
};
