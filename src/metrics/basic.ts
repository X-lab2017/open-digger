import { merge } from 'lodash';
import { query } from '../db/clickhouse';
import { getPlatformData, getLabelData, PlatformNames } from '../labelDataUtils';

export interface QueryConfig<T = any> {
  labelUnion?: string[];
  labelIntersect?: string[];
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
        repoWhereClauseArray.push(`(repo_id IN [${repoIds.join(',')}] AND platform='${p.platform}')`);
      }

      if (p.repoIds && p.repoIds.length > 0) repoWhereClauseArray.push(`(repo_id IN [${p.repoIds.join(',')}] AND platform='${p.platform}')`);

      if (p.orgNames && p.orgNames.length > 0) {
        // convert org name to id
        const sql = `SELECT any(org_id) AS id FROM global_openrank WHERE org_login IN [${p.orgNames.map(n => `'${n}'`)}] AND platform='${p.platform}' GROUP BY org_login`;
        const orgIds = (await query<any>(sql, { format: 'JSONEachRow' })).map(r => r.id);
        repoWhereClauseArray.push(`(org_id IN [${orgIds.join(',')}] AND platform='${p.platform}')`);
      }

      if (p.orgIds && p.orgIds.length > 0) repoWhereClauseArray.push(`(org_id IN [${p.orgIds.join(',')}] AND platform='${p.platform}')`);
    }
  }

  // label intersect
  if (config.labelIntersect) {
    const condition = '(' + config.labelIntersect.map(l => {
      const data = getPlatformData([l], config.injectLabelData);
      const arr: string[] = [];
      for (const p of data) {
        if (p.repos.length > 0) arr.push(`(repo_id IN [${p.repos.map(r => r.id).join(',')}] AND platform='${p.name}')`);
        if (p.orgs.length > 0) arr.push(`(org_id IN [${p.orgs.map(o => o.id).join(',')}] AND platform='${p.name}')`);
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
      if (p.repos.length > 0) repoWhereClauseArray.push(`(repo_id IN [${p.repos.map(r => r.id).join(',')}] AND platform='${p.name}')`);
      if (p.orgs.length > 0) repoWhereClauseArray.push(`(org_id IN [${p.orgs.map(o => o.id).join(',')}] AND platform='${p.name}')`);
    }
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

  // where clause
  if (config.whereClause) {
    userWhereClauseArray.push(config.whereClause);
  }

  const userWhereClause = userWhereClauseArray.length > 0 ? `(${userWhereClauseArray.join(' OR ')})` : null;
  return userWhereClause;
};

export const getTimeRangeWhereClause = (config: QueryConfig): string => {
  return ` created_at >= toDate('${config.startYear}-${config.startMonth}-1') AND created_at < dateAdd(month, 1, toDate('${config.endYear}-${config.endMonth}-1'))`;
};

// clickhouse label group condition
export const getLabelGroupConditionClause = (config: QueryConfig): string => {
  const labelData = getLabelData(config.injectLabelData)?.filter(l => l.type === config.groupBy);
  if (!labelData || labelData.length === 0) throw new Error(`Invalide group by label: ${config.groupBy}`);
  const idLabelRepoMap = new Map<string, string[][]>();
  const idLabelOrgMap = new Map<string, string[][]>();
  const idLabelUserMap = new Map<string, string[][]>();
  const addToMap = (map: Map<string, string[][]>, id: string, label: string[]) => {
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(label);
  };

  labelData.forEach(l => {
    l.platforms.forEach(p => {
      p.repos.forEach(r => addToMap(idLabelRepoMap, `${p.name}_${r.id}`, [l.identifier, l.name]));
      p.orgs.forEach(o => addToMap(idLabelOrgMap, `${p.name}_${o.id}`, [l.identifier, l.name]));
      p.users.forEach(u => addToMap(idLabelUserMap, `${p.name}_${u.id}`, [l.identifier, l.name]));
    });
  });

  type resultMapType = Map<string, { labels: string[][], platforms: Map<string, { repoIds: number[], orgIds: number[], userIds: number[] }> }>;
  const resultMap: resultMapType = new Map();
  const addToResultMap = (id: string, labels: string[][], type: 'repo' | 'org' | 'user') => {
    const key = labels.map(l => l.join(':')).sort().join(',');
    if (!resultMap.has(key)) resultMap.set(key, { labels, platforms: new Map<string, { repoIds: number[], orgIds: number[], userIds: number[] }>() });
    const [platform, entryId] = id.split('_');
    if (!resultMap.get(key)!.platforms.has(platform)) resultMap.get(key)!.platforms.set(platform, { repoIds: [], orgIds: [], userIds: [] });
    if (type === 'repo') resultMap.get(key)!.platforms.get(platform)!.repoIds.push(+entryId);
    else if (type === 'org') resultMap.get(key)!.platforms.get(platform)!.orgIds.push(+entryId);
    else if (type === 'user') resultMap.get(key)!.platforms.get(platform)!.userIds.push(+entryId);
  }
  idLabelRepoMap.forEach((labels, id) => addToResultMap(id, labels, 'repo'));
  idLabelOrgMap.forEach((labels, id) => addToResultMap(id, labels, 'org'));
  idLabelUserMap.forEach((labels, id) => addToResultMap(id, labels, 'user'));

  const idConditions = Array.from(resultMap.values()).map(v => {
    const c: string[] = [];
    for (const [name, p] of v.platforms) {
      if (p.repoIds.length > 0) c.push(`(repo_id IN (${p.repoIds.join(',')}) AND platform='${name}')`);
      if (p.orgIds.length > 0) c.push(`(org_id IN (${p.orgIds.join(',')}) AND platform='${name}')`);
      if (p.userIds.length > 0) c.push(`(actor_id IN (${p.userIds.join(',')}) AND platform='${name}')`);
    }
    return `(${c.join(' OR ')}),[${v.labels.map(l => `tuple('${l[0]}','${l[1]}')`).join(',')}]`;
  }).join(',');

  return `(arrayJoin(multiIf(${idConditions}, [tuple('Others', 'Others')])) AS items).1 AS id, any(items.2) AS name, COUNT(DISTINCT repo_id) AS repos, COUNT(DISTINCT org_id) AS orgs, COUNT(DISTINCT actor_id) AS developers`;
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
    const timeColumn = timeCol ?? (config.groupTimeRange ? 'time' : 'created_at');
    if (!config.groupBy) {  // group by repo'
      if (type === 'repo')
        return `repo_id AS id, platform, argMax(repo_name, ${timeColumn}) AS name`;
      else
        return `actor_id AS id, platform, argMax(actor_login, ${timeColumn}) AS name`;
    } else if (config.groupBy === 'org') {
      return `org_id AS id, platform, argMax(org_login, ${timeColumn}) AS name`;
    } else {  // group by label
      return getLabelGroupConditionClause(config);
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
