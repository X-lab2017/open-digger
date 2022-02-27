import { QueryConfig, getMergedConfig, getRepoWhereClauseForNeo4j, getTimeRangeWhereClauseForNeo4j, getTimeRangeSumClauseForNeo4j } from "./basic";
import * as neo4j from '../db/neo4j'

export const getRelatedUsers = (config: QueryConfig) => {
  config = getMergedConfig(config);
  const repoWhereClause = getRepoWhereClauseForNeo4j(config);
  const timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'a');
  const timeActivityClause = getTimeRangeSumClauseForNeo4j(config, 'u.activity');
  const timeOpenrankClause = getTimeRangeSumClauseForNeo4j(config, 'u.open_rank');
  const query = `MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE ${repoWhereClause ? repoWhereClause + ' AND ' : ''} ${timeWhereClause} RETURN r.name AS repo_name, u.login AS user_login, ${timeActivityClause} AS activity, ${timeOpenrankClause} AS openrank ORDER BY activity ${config.order} LIMIT ${config?.limit};`;
  return neo4j.query(query);
}
