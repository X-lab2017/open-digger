from basic import QueryConfig, getMergedConfig, getRepoWhereClauseForNeo4j, getTimeRangeWhereClauseForNeo4j
import db.neo4j_driver as neo4j_driver

def getRelatedUsers(config):
    config = getMergedConfig(config)
    repoWhereClause = getRepoWhereClauseForNeo4j(config)
    timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'a')
    query = 'MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE {} {} RETURN DISTINCT u.login AS user_login {};'.format(repoWhereClause + ' AND ' if repoWhereClause != None else '', timeWhereClause, 'LIMIT {}'.format(config.get('limit')) if config.get('limit') > 0 else '')
    return neo4j_driver.query(query)
