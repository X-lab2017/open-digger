import { QueryConfig, 
        getMergedConfig, 
        getRepoWhereClauseForNeo4j, 
        getTimeRangeWhereClauseForNeo4j, 
        getTimeRangeSumClauseForNeo4j, 
        getUserWhereClauseForNeo4j } from "./basic";
import * as neo4j from '../db/neo4j'

export const getRepoActivity = (config: QueryConfig) => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'r');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, 'r.activity');
  const query = `MATCH (r:Repo) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.name AS repo_name, ${timeActivityClause} AS activity ORDER BY activity DESC LIMIT ${config?.queryParam.limit};`;
  return neo4j.query(query);
}

export const getUserActivity = (config: QueryConfig) => {
  config = getMergedConfig(config);
  const userWhereClause = getUserWhereClauseForNeo4j(config);
  const timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'u');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, 'u.activity');
  const query = `MATCH (u:User) WHERE ${userWhereClause ? userWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN u.login AS user_login, ${timeActivityClause} AS activity ORDER BY activity DESC LIMIT ${config?.queryParam.limit};`;
  return neo4j.query(query);
}
