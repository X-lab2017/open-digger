import datetime
from basic import filterEnumType,\
                  getGroupArrayInsertAtClauseForClickhouse,\
                  getGroupTimeAndIdClauseForClickhouse,\
                  getMergedConfig,\
                  getRepoWhereClauseForClickhouse,\
                  getTimeRangeWhereClauseForClickhouse,\
                  getInnerOrderAndLimit,\
                  getOutterOrderAndLimit,\
                  QueryConfig
import db.clickhouse as clickhouse
from activity_openrank import basicActivitySqlComponent

CodeChangeCommitsOptions= {
    # a filter regular expression for commit message
    'messageFilter': '^(build:|chore:|ci:|docs:|feat:|fix:|perf:|refactor:|revert:|style:|test:).*'
}

timeDurationConstants = {
    "unitArray": ['week', 'day', 'hour', 'minute'],
    "sortByArray": ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4'],
    "quantileArray": list(range(5)),
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
    if config.get('options') and config.get('options').get('messageFilter'):
        arrayJoinMessage = 'arrayFilter(x -> match(x, \'{}\'), push_commits.message)'.format(config.get('options').get('messageFilter')) 
    else:
        arrayJoinMessage = 'push_commits.message'

    sql = f'''
    SELECT 
    id, 
    argMax(name, time) AS name, 
    {getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'commits_count', 'value':'count' })} 
    FROM 
    ( 
    SELECT 
        {getGroupTimeAndIdClauseForClickhouse(config, 'repo')}, 
        COUNT(arrayJoin({arrayJoinMessage})) AS count 
    FROM opensource.gh_events 
    WHERE {' AND '.join(whereClauses)} 
    GROUP BY id, time 
    {getInnerOrderAndLimit(config, 'commits_count')} 
    ) 
    GROUP BY id 
    {getOutterOrderAndLimit(config, 'commits_count')}
    '''

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
    whereClauses = ["type = \'IssuesEvent\' AND action IN (\'opened\', \'reopened\')"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))

    sql = f'''
    SELECT 
    id, 
    argMax(name, time) AS name, 
    SUM(count) AS total_count, 
    {getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'issues_new_count', 'value': 'count' })} 
    FROM 
    (
    SELECT 
        {getGroupTimeAndIdClauseForClickhouse(config, 'repo')}, 
        COUNT() AS count 
    FROM opensource.gh_events           
    WHERE {' AND '.join(whereClauses)} 
    GROUP BY id, time 
    {getInnerOrderAndLimit(config, 'issues_new_count')} 
    ) 
    GROUP BY id 
    {getOutterOrderAndLimit(config, 'issues_new_count')}
    FORMAT JSONCompact'''
    
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

    sql = f'''
    SELECT
    id,
    argMax(name, time) AS name,
    SUM(count) AS total_count,
    {getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'issues_close_count', 'value': 'count' })}
    FROM
    (
    SELECT
        {getGroupTimeAndIdClauseForClickhouse(config, 'repo')},
        COUNT() AS count
    FROM opensource.gh_events 
    WHERE {' AND '.join(whereClauses)}
    GROUP BY id, time
    {getInnerOrderAndLimit(config, 'count')}
    )
    GROUP BY id
    {getOutterOrderAndLimit(config, 'issues_close_count')}
    '''
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

    percentage = str(1 - config.get('options').get('percentage')) if config.get('options') and 'percentage' in config.get('options') else '0.5'

    authorFieldName = 'actor_login' if by == 'activity' else 'author'
    if config.get('options', {}).get('withBot') and by != 'commit':
        botFilterHavingClause = ""
    else:
        botFilterHavingClause = f"HAVING {authorFieldName} NOT LIKE '%[bot]'" 
    
    sql = f'''
    SELECT
    id,
    argMax(name, time) AS name,
    {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "bus_factor"})},
    {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "detail", "noPrecision": True, "defaultValue": "[]"})},
    {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "total_contributions"})}
    FROM
    (
    SELECT
        time,
        id,
        any(name) AS name,
        SUM(count) AS total_contributions,
        length(detail) AS bus_factor,
        arrayFilter(x -> tupleElement(x, 2) >= quantileExactWeighted({percentage}) (count, count), arrayMap((x, y) -> (x, y), groupArray({authorFieldName}), groupArray(count))) AS detail
    FROM
    (
        SELECT
        {getGroupTimeAndIdClauseForClickhouse(config)},
        {
        'arrayJoin(push_commits.name) AS author, COUNT() AS count' if by == 'commit' else
        'issue_author_id AS actor_id, argMax(issue_author_login, created_at) AS author, COUNT() AS count' if by == 'change request' else
        f'{basicActivitySqlComponent}, toUInt32(ceil(activity)) AS count'
        }
        FROM opensource.gh_events 
        WHERE {' AND '.join(whereClauses)}
        GROUP BY id, time, {('author' if by == 'commit' else 'actor_id')}
        {botFilterHavingClause}
    )
    GROUP BY id, time
    {getInnerOrderAndLimit(config, 'bus_factor')}
    )
    GROUP BY id
    {getOutterOrderAndLimit(config, 'bus_factor')}
    '''

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

    sql = f'''
    SELECT
    id,
    argMax(name, time) AS name,
    SUM(count) AS total_count,
    {getGroupArrayInsertAtClauseForClickhouse(config, {"key": 'change_requests_accepted', 'value': 'count'})}
    FROM
    (
    SELECT
        {getGroupTimeAndIdClauseForClickhouse(config)},
        COUNT() AS count
    FROM opensource.gh_events 
    WHERE {' AND '.join(whereClauses)}
    GROUP BY id, time
    {getInnerOrderAndLimit(config, 'count')}
    )
    GROUP BY id
    {getOutterOrderAndLimit(config, 'change_requests_accepted')}
    '''

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
    
    sql = f'''
    SELECT
    id,
    argMax(name, time) AS name,
    SUM(count) AS total_count,
    {getGroupArrayInsertAtClauseForClickhouse(config, {"key": 'change_requests_declined', 'value': 'count'})}
    FROM
    (
    SELECT
        {getGroupTimeAndIdClauseForClickhouse(config)},
        COUNT() AS count
    FROM gh_events
    WHERE {' AND '.join(whereClauses)}
    GROUP BY id, time
    {getInnerOrderAndLimit(config, 'count')}
    )
    GROUP BY id
    {getOutterOrderAndLimit(config, 'change_requests_declined')}
    '''

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

def chaossResolutionDuration(config, type):
    """_summary_

    Args:
        config (QueryConfig<IssueResolutionDurationOptions>): _description_

    """
    config = getMergedConfig(config)
    whereClauses = ["type = 'IssuesEvent'"] if type == 'issue' else ["type = 'PullRequestEvent'"]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause: whereClauses.append(repoWhereClause)

    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1)  

    by = filterEnumType(config.get("options", {}).get("by"), ['open', 'close'], 'open')
    byCol = 'opened_at' if by == 'open' else 'closed_at'
    unit = filterEnumType(config.get("options", {}).get("unit"), timeDurationConstants["unitArray"], 'day')
    thresholds = config.get("options", {}).get("thresholds", [3, 7, 15])
    ranges = thresholds + [-1]
    sortBy = filterEnumType(config.get("options", {}).get("sortBy"), timeDurationConstants["sortByArray"], 'avg')
    
    sql = f'''
    SELECT
    id,
    argMax(name, time),
    {getGroupArrayInsertAtClauseForClickhouse(config, { "key": "avg", "defaultValue": 'NaN' })},
    {getGroupArrayInsertAtClauseForClickhouse(config, { "key": 'levels', "value": 'resolution_levels', "defaultValue": "[]", "noPrecision": True })},
    {', '.join([getGroupArrayInsertAtClauseForClickhouse(config, { "key": f"quantile_{q}", "defaultValue": 'NaN' }) for q in timeDurationConstants["quantileArray"]])}
    FROM
    (
        SELECT
            {getGroupTimeAndIdClauseForClickhouse(config, 'repo', byCol)},
            avg(resolution_duration) AS avg,
            {', '.join([f'quantile({q / 4})(resolution_duration) AS quantile_{q}' for q in timeDurationConstants["quantileArray"]])},
            [{', '.join([f'countIf(resolution_level = {i})' for i in range(len(ranges))])}] AS resolution_levels
        FROM
        (
            SELECT
            repo_id,
            argMax(repo_name, created_at) AS repo_name,
            org_id,
            argMax(org_login, created_at) AS org_login,
            issue_number,
            argMaxIf(action, created_at, action IN ('opened', 'closed' , 'reopened')) AS last_action,
            argMax(issue_created_at, created_at) AS opened_at,
            maxIf(created_at, action = 'closed') AS closed_at,
            dateDiff('{unit}', opened_at, closed_at) AS resolution_duration,
            multiIf({', '.join([f'resolution_duration <= {t}, {i}' for i, t in enumerate(thresholds)])}, {len(thresholds)}) AS resolution_level
            FROM opensource.gh_events 
            WHERE {' AND '.join(whereClauses)}
            GROUP BY repo_id, org_id, issue_number
            HAVING {byCol} >= toDate('{config['startYear']}-{config['startMonth']}-1') AND {byCol} < toDate('{endDate.year}-{endDate.month}-1') AND last_action='closed'
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'resolution_duration')}
    )
    GROUP BY id
    {getOutterOrderAndLimit(config, sortBy, 1 if sortBy == 'levels' else None)}
    '''

    result = clickhouse.query(sql)
    def getResult(row):
        id, name, avg, levels, quantile_0, quantile_1, quantile_2, quantile_3, quantile_4 = row
        return {
        'id':id,
        'name':name,
        'resolution_duration_avg':avg,
        'levels':levels,
        'quantile_0':quantile_0,
        'quantile_1':quantile_1,
        'quantile_2':quantile_2,
        'quantile_3':quantile_3,
        'quantile_4':quantile_4,
        }
    return list(map(getResult, result))

def chaossIssueResolutionDuration(config):
    return chaossResolutionDuration(config, 'issue')

def chaossChangeRequestResolutionDuration(config):
    return chaossResolutionDuration(config, 'change request')