from .basic import getMergedConfig, getRepoWhereClauseForNeo4j, getTimeRangeWhereClauseForNeo4j
from db.neo4j_wrapper import Neo4jWrapper 
neo4j = Neo4jWrapper()

class Relation():
    def getRelatedUsers(config):
        config = getMergedConfig(config)
        repoWhereClause = getRepoWhereClauseForNeo4j(config)
        timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'a')
        query = 'MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE {} {} RETURN DISTINCT u.login AS user_login {};'.format(repoWhereClause + ' AND ' if repoWhereClause != None else '', timeWhereClause, 'LIMIT {}'.format(config.get('limit')) if config.get('limit') > 0 else '')
        return neo4j.query(query)
