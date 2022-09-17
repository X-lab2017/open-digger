import datetime
from basic import filterEnumType,\
                  getGroupArrayInsertAtClauseForClickhouse,\
                  getGroupTimeAndIdClauseForClickhouse,\
                  getMergedConfig,\
                  getRepoWhereClauseForClickhouse,\
                  getTimeRangeWhereClauseForClickhouse,\
                  QueryConfig
import db.clickhouse as clickhouse
from activity_openrank import basicActivitySqlComponent

CodeChangeCommitsOptions= {
    # a filter regular expression for commit message
    'messageFilter': '^(build:|chore:|ci:|docs:|feat:|fix:|perf:|refactor:|revert:|style:|test:).*'
}

def chaossCodeChangeCommits(config):
    """_summary_

    Args:
        config (QueryConfig<CodeChangeCommitsOptions>): _description_
    """
    config = getMergedConfig(config)
    whereClauses = ["type = \'PushEvent\' "]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))

    sql = ' \
    SELECT \
    id, \
    argMax(name, time) AS name, \
    {} \
    FROM '.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'commits_count', 'value':'count' })) + \
    '( \
    SELECT \
        {}, \
        COUNT(arrayJoin({})) AS count \
    FROM github_log.events '.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo'), 'arrayFilter(x -> match(x, \'{}\'), push_commits.message)'.format(config.get('options').get('messageFilter')) if config.get('options') and config.get('options').get('messageFilter') else 'push_commits.message' )+ \
    'WHERE {} \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY commits_count[-1] {} \
    FORMAT JSONCompact'.format(' AND '.join(whereClauses), 'ORDER BY count DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '', config.get('order'))
    result = clickhouse.query(sql)
    def getResult(row):
        id, name, count = row
        return {
        'id':id,
        'name':name,
        'count':count,
        }
    return list(map(getResult, result))

def chaossIssuesNew(config):
    """_summary_

    Args:
        config (dict): QueryConfig
    """
    config = getMergedConfig(config)
    whereClauses = ["type = \'IssuesEvent\' AND action = \'opened\'"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))

    sql = '\
    SELECT \
    id, \
    argMax(name, time) AS name, \
    SUM(count) AS total_count, \
    {} \
    FROM \
    ('.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'issues_new_count', 'value': 'count' })) + \
    'SELECT \
        {}, \
        COUNT() AS count \
    FROM github_log.events '.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo')) + \
    'WHERE {} \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY issues_new_count[-1] {} \
    FORMAT JSONCompact'.format(' AND '.join(whereClauses), 'ORDER BY count DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '', config.get('order'))
    result = clickhouse.query(sql)
    def process(row):
        id, name, total_count, count = row
        ratio = list(map(lambda v: '{}%'.format(str(format((v*100/total_count), '.2f'))), count))
        return {
        'id':id,
        'name':name,
        'total_count':total_count,
        'count':count,
        'ratio':ratio,
        }
    return list(map(process, result))
        
def chaossIssuesClosed(config):
    config = getMergedConfig(config)
    whereClauses = ["type = \'IssuesEvent\' AND action = \'closed\'"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))

    sql = ' \
    SELECT \
    id, \
    argMax(name, time) AS name, \
    SUM(count) AS total_count, \
    {} \
    FROM \
    ('.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'issues_close_count', 'value': 'count' })) + \
    'SELECT \
        {}, \
        COUNT() AS count \
    FROM github_log.events \
    WHERE {} \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY issues_close_count[-1] {} \
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo'), ' AND '.join(whereClauses), 'ORDER BY count DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '', config.get('order'))
    result = clickhouse.query(sql)  
    def process(row):
        id, name, total_count, count = row
        ratio = list(map(lambda v: '{}%'.format(str(format((v*100/total_count), '.2f'))), count))
        return {
        'id':id,
        'name':name,
        'total_count':total_count,
        'count':count,
        'ratio':ratio,
        }
    return list(map(process, result))

BusFactorOptions = {
    # calculate bus factor by change request or git commit, or activity index. default: activity  ('commit' | 'change request' | 'activity')
    'by': 'activity',
    # the bus factor percentage thredhold, default: 0.5
    'percentage': 0.5,
    # include GitHub Apps account, default: false
    'withBot': False,
}

def chaossBusFactor(config):
    """_summary_

    Args:
        config (QueryConfig<BusFactorOptions>): QueryConfig<BusFactorOptions>

    Returns:
        _type_: _description_
    """
    config = getMergedConfig(config)
    by = filterEnumType(config.get('options').get('by') if config.get('options') != None else None, ['commit', 'change request', 'activity'], 'activity')
    byCommit = config.get('options').get('byCommit') if config.get('options') != None else None
    whereClauses = []
    if by == 'commit':
        whereClauses.append("type = \'PushEvent\'")
    elif by == 'change request':
        whereClauses.append("type = \'PullRequestEvent\' AND action = \'closed\' AND pull_merged = 1")
    elif by == 'activity':
        whereClauses.append("type IN (\'IssuesEvent\', \'IssueCommentEvent\', \'PullRequestEvent\', \'PullRequestReviewCommentEvent\')")
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    def process(by = by):
        if by == 'commit':
          return '\
          arrayJoin(push_commits.name) AS author, \
          COUNT() AS count'
        elif by == 'change request':
          return ' \
          issue_author_id AS actor_id, \
          argMax(issue_author_login, created_at) AS author, \
          COUNT() AS count'
        elif by == 'activity':
          return '\
          {}, \
          toUInt32(ceil(activity)) AS count \
          '.format(basicActivitySqlComponent)
    sql = '\
    SELECT \
    id, \
    argMax(name, time) AS name, \
    {}, \
    {}, \
    {} \
    FROM \
    ('.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'bus_factor', }), getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'detail' }), getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'total_contributions' })) + \
    'SELECT \
        time, \
        id, \
        any(name) AS name, \
        SUM(count) AS total_contributions, \
        length(detail) AS bus_factor, \
        arrayFilter(x -> tupleElement(x, 2) >= quantileExactWeighted({})(count, count), arrayMap((x, y) -> (x, y), groupArray({}), groupArray(count))) AS detail \
    FROM \
    ('.format(str(1 - config.get('options').get('percentage')) if config.get('options')!=None and config.get('options').get('percentage')!=None else '0.5', 'actor_login' if by == 'activity' else 'author') \
    +\
        'SELECT \
        {}, \
        {} \
        FROM github_log.events \
        WHERE {} \
        GROUP BY id, time, {} \
        {} \
        ORDER BY count DESC \
    ) \
    GROUP BY id, time \
    ) \
    GROUP BY id \
    ORDER BY bus_factor[-1] {} \
    {} \
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo'), 
                                process(),
                                ' AND '.join(whereClauses),
                                'author' if by == 'commit' else 'actor_id',
                                '' if (config.get('options') != None and config.get('options').get('withBot')!=None and by != 'commit') else "HAVING author NOT LIKE \'%[bot]\'",
                                config.get('order'),
                                'LIMIT {}'.format(config.get('limit')) if config.get('limit') > 0 else ''
                                )

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, bus_factor, detail, total_contributions = row
        return {
        'id':id,
        'name':name,
        'bus_factor':bus_factor,
        'detail':detail,
        'total_contributions':total_contributions,
        }
    return list(map(getResult, result))

def chaossChangeRequestsAccepted(config: QueryConfig):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    config = getMergedConfig(config)
    whereClauses = ["type = \'PullRequestEvent\' AND action = \'closed\' AND pull_merged = 1"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))

    sql = ' \
    SELECT \
    id, \
    argMax(name, time) AS name, \
    SUM(count) AS total_count, \
    {} \
    FROM '.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'change_requests_accepted', 'value': 'count' })) + \
    '( \
    SELECT \
        {}, \
        COUNT() AS count \
    FROM github_log.events \
    WHERE {} \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY change_requests_accepted[-1] {} \
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo'),
                               ' AND '.join(whereClauses),
                               'ORDER BY count DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '',
                               config.get('order'))

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, total_count, count = row
        return {
        'id':id,
        'name':name,
        'total_count':total_count,
        'count':count,
        'ratio': list(map(lambda v:'{:.2}%'.format(v*100/total_count),count)),
        }
    return list(map(getResult, result))

def chaossChangeRequestsDeclined(config: QueryConfig):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    config = getMergedConfig(config)
    whereClauses = ["type = \'PullRequestEvent\' AND action = \'closed\' AND pull_merged = 0"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause!=None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    
    sql = ' \
    SELECT \
    id, \
    argMax(name, time) AS name, \
    SUM(count) AS total_count, \
    {} \
    FROM'.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'change_requests_declined', 'value': 'count' })) + \
    '( \
    SELECT \
        {}, \
        COUNT() AS count \
    FROM github_log.events \
    WHERE {} \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY change_requests_declined[-1] {} \
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo'),
                               ' AND '.join(whereClauses),
                               'ORDER BY count DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '',
                               config.get('order')
                               )

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, total_count, count = row
        return {
        'id':id,
        'name':name,
        'total_count':total_count,
        'count':count,
        'ratio': list(map(lambda v:'{:.2}%'.format(v*100/total_count),count)),
        }
    return list(map(getResult, result))

IssueResolutionDurationOptions = {
  'by': 'open', #'open' | 'close'
  'type': 'avg', #'avg' | 'median'
  'unit': 'week' #'week' | 'day' | 'hour' | 'minute'
}
def chaossIssueResolutionDuration(config):
    """_summary_

    Args:
        config (QueryConfig<IssueResolutionDurationOptions>): _description_

    """
    config = getMergedConfig(config)
    whereClauses = ["type = \'IssuesEvent\'"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    
    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1)
    
    by = filterEnumType(config.get('options').get('by') if config.get('options') != None else None, ['open', 'close'], 'open')
    byCol = 'opened_at' if by == 'open' else 'closed_at'
    type = filterEnumType(config.get('options').get('type') if config.get('options') != None else None, ['avg', 'median'], 'avg')
    unit = filterEnumType(config.get('options').get('unit') if config.get('options') != None else None, ['week', 'day', 'hour', 'minute'], 'day')
    
    sql = ' \
    SELECT \
    id, \
    argMax(name, time) AS name, \
    {} \
    FROM'.format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'resolution_duration', 'defaultValue': 'NaN' })) + \
    '( \
    SELECT \
        {}, \
        round({}(dateDiff(\'{}\', opened_at, closed_at)), {}) AS resolution_duration \
    FROM \
    ( \
        SELECT \
        repo_id, \
        argMax(repo_name, created_at) AS repo_name, \
        org_id, \
        argMax(org_login, created_at) AS org_login, \
        issue_number, \
        argMaxIf(action, created_at, action IN (\'opened\', \'closed\' , \'reopened\')) AS last_action, \
        maxIf(created_at, action = \'opened\') AS opened_at, \
        maxIf(created_at, action = \'closed\') AS closed_at \
        FROM github_log.events \
        WHERE {} \
        GROUP BY repo_id, org_id, issue_number \
        HAVING {} >= toDate(\'{}-{}-1\') AND {} < toDate(\'{}-{}-1\') AND last_action=\'closed\' \
    ) \
    GROUP BY id, time \
    {} \
    ) \
    GROUP BY id \
    ORDER BY resolution_duration[-1] {} \
    FORMAT JSONCompact'.format(getGroupTimeAndIdClauseForClickhouse(config, 'repo', byCol),
                               type, unit, config.get('percision'),
                               ' AND '.join(whereClauses),
                               byCol, config.get('startYear'), config.get('startMonth'), byCol, endDate.year, endDate.month, 
                               'ORDER BY resolution_duration {} LIMIT {} BY time'.format(config.get('order'), config.get('limit')) if config.get('limit') > 0 else '',
                               config.get('order')
                               )

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, resolution_duration = row
        return {
        'id':id,
        'name':name,
        'resolution_duration':resolution_duration,
        }
    return list(map(getResult, result))
