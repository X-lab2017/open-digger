import { QueryConfig, getMergedConfig, getRepoWhereClauseForNeo4j, getTimeRangeWhereClauseForNeo4j, getTimeRangeSumClauseForNeo4j } from "./basic";
import * as neo4j from '../db/neo4j'

export const getRelatedUsers = async (config: QueryConfig) => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = await getTimeRangeWhereClauseForNeo4j(config, 'a');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, 'a.activity');
  const query = `MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN u.login AS user_login, [${(await timeActivityClause).map(i => `round(SUM(${i}), ${config.percision})`).join(',')}] AS activity ORDER BY activity[0] ${config.order} LIMIT ${config?.limit};`;
  return neo4j.query(query);
}
