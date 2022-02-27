import { QueryConfig, 
        getMergedConfig, 
        getRepoWhereClauseForNeo4j, 
        getTimeRangeWhereClauseForNeo4j, 
        getTimeRangeSumClauseForNeo4j, 
        getUserWhereClauseForNeo4j } from "./basic";
import * as neo4j from '../db/neo4j'
import { getLabelData } from "../label_data_utils";

export const getRepoActivityOrOpenrank = async (config: QueryConfig, type: 'activity' | 'open_rank') => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'r');
  const timeActivityOrOpenrankClause = getTimeRangeSumClauseForNeo4j(config, `r.${type}`);
  if (!config.groupBy) {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.name AS repo_name, r.org_login AS org, [${timeActivityOrOpenrankClause.join(',')}] AS ${type} ORDER BY ${type} ${config.order} LIMIT ${config.limit};`;
    return neo4j.query(query);
  } else if (config.groupBy === 'org') {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.org_login AS org_login, count(r.id) AS repo_count, [${timeActivityOrOpenrankClause.map(i => `round(SUM(${i}), ${config.percision})`)}] AS ${type} ORDER BY ${type} ${config.order} LIMIT ${config.limit};`;
    return neo4j.query(query);
  } else {
    const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.id AS repo_id, r.org_id AS org_id, [${timeActivityOrOpenrankClause.join(',')}] AS ${type};`;
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
    if (config.order === 'ASC') resultArr.sort((a, b) => a[type][0] - b[type][0]);
    if (config.order === 'DESC') resultArr.sort((a, b) => b[type][0] - a[type][0]);
    resultArr.forEach(i => i[type] = i[type].map(v => parseFloat(v.toFixed(config.percision))));
    return resultArr.slice(0, config.limit);
  }
}

export const getUserActivity = (config: QueryConfig) => {
  config = getMergedConfig(config);
  const userWhereClause = getUserWhereClauseForNeo4j(config);
  const timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'u');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, 'u.activity');
  const query = `MATCH (u:User) WHERE ${userWhereClause ? userWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN u.login AS user_login, ${timeActivityClause} AS activity ORDER BY activity ${config.order} LIMIT ${config.limit};`;
  return neo4j.query(query);
}
