import { QueryConfig, getMergedConfig, getRepoWhereClauseForNeo4j, getTimeRangeWhereClauseForNeo4j } from './basic';
import * as neo4j from '../db/neo4j'

export const getRelatedUsers = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = await getTimeRangeWhereClauseForNeo4j(config, 'a');
  const query = `MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN DISTINCT u.login AS user_login ${config.limit > 0 ? `LIMIT ${config.limit}` : ''};`;
  return neo4j.query(query);
}
