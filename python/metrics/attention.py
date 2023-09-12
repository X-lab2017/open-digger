from basic import getGroupArrayInsertAtClauseForClickhouse,\
  getGroupTimeAndIdClauseForClickhouse,\
  getMergedConfig,\
  getRepoWhereClauseForClickhouse,\
  getTimeRangeWhereClauseForClickhouse,\
  QueryConfig 
import db.clickhouse as clickhouse

def getAttention(config: QueryConfig):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    config = getMergedConfig(config)
    whereClauses = ["type IN (\'WatchEvent\', \'ForkEvent\')"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    
    sql = ' \
    SELECT \
    id, \
    argMax(name, time) AS name, \
    {} \
    FROM \
    ('.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'attention' })) + \
    'SELECT \
        {}, \
        countIf(type=\'WatchEvent\') AS stars, \
        countIf(type=\'ForkEvent\') AS forks, \
        stars + 2 * forks AS attention \
    FROM opensource.gh_events \
    WHERE {} \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY attention[-1] {} \
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config), ' AND '.join(whereClauses), 
                               'ORDER BY attention DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '', 
                               config.get('order'))

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, attention = row
        return {
        'id':id,
        'name':name,
        'attention':attention,
        }
    return list(map(getResult, result))
