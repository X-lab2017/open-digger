from basic import getGroupArrayInsertAtClauseForClickhouse,\
  getGroupTimeAndIdClauseForClickhouse,\
  getMergedConfig,\
  getRepoWhereClauseForClickhouse,\
  getTimeRangeWhereClauseForClickhouse,\
  QueryConfig 
import db.clickhouse as clickhouse

def get_Attention(config: QueryConfig):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    config = getMergedConfig(config)
    whereClauses = ["type IN (\'WatchEvent\', \'ForkEvent\')"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    
    sql = '\
    SELECT\
    id,\
    argMax(name, time) AS name,\
    {}\
    FROM\
    ('.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'attention' })) + \
    'SELECT\
        {},\
        countIf(type=\'WatchEvent\') AS stars,\
        countIf(type=\'ForkEvent\') AS forks,\
        stars + 2 * forks AS attention\
    FROM github_log.year2016\
    WHERE {}\
    GROUP BY id, time\
    {}\
    )\
    GROUP BY id\
    ORDER BY attention[-1] {}\
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config), ' AND '.join(whereClauses), \
                               'ORDER BY attention DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '',\
                               config.get('order'))

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, attention = row
        return [
        id,
        name,
        attention,
        ]
    return list(map(getResult, result))
