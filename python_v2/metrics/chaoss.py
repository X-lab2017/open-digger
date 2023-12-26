import datetime
from typing import Tuple,List
from metrics.basic import filterEnumType,\
                  getGroupArrayInsertAtClauseForClickhouse,\
                  getGroupTimeClauseForClickhouse,\
                  getGroupIdClauseForClickhouse,\
                  getMergedConfig,\
                  getRepoWhereClauseForClickhouse,\
                  getTimeRangeWhereClauseForClickhouse,\
                  getInnerOrderAndLimit,\
                  getOutterOrderAndLimit,\
                  getUserWhereClauseForClickhouse,\
                  QueryConfig
from db.clickhouse_wrapper import ClickhouseWrapper
clickhouse = ClickhouseWrapper()

__ISSUE_COMMENT_WEIGHT = 1
__OPEN_ISSUE_WEIGHT = 2
__OPEN_PULL_WEIGHT = 3
__REVIEW_COMMENT_WEIGHT = 4
__PULL_MERGED_WEIGHT = 2
__basicActivitySqlComponent = f''' 
        if(type=\'PullRequestEvent\' AND action=\'closed\' AND pull_merged=1, issue_author_id, actor_id) AS actor_id, 
        argMax(if(type=\'PullRequestEvent\' AND action=\'closed\' AND pull_merged=1, issue_author_login, actor_login), created_at) AS actor_login, 
        countIf(type=\'IssueCommentEvent\' AND action=\'created\') AS issue_comment, 
        countIf(type=\'IssuesEvent\' AND action=\'opened\')  AS open_issue, 
        countIf(type=\'PullRequestEvent\' AND action=\'opened\') AS open_pull, 
        countIf(type=\'PullRequestReviewCommentEvent\' AND action=\'created\') AS review_comment, 
        countIf(type=\'PullRequestEvent\' AND action=\'closed\' AND pull_merged=1) AS merged_pull, 
        sqrt({__ISSUE_COMMENT_WEIGHT}*issue_comment + {__OPEN_ISSUE_WEIGHT}*open_issue + {__OPEN_PULL_WEIGHT}*open_pull + {__REVIEW_COMMENT_WEIGHT}*review_comment + {__PULL_MERGED_WEIGHT}*merged_pull) AS activity 
'''

CodeChangeCommitsOptions= {
    # a filter regular expression for commit message
    'messageFilter': '^(build:|chore:|ci:|docs:|feat:|fix:|perf:|refactor:|revert:|style:|test:).*'
}

timeDurationConstants = {
    "unitArray": ['week', 'day', 'hour', 'minute'],
    "sortByArray": ['avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4'],
    "quantileArray": list(range(5)),
}

def __bulidInnnerCountSql(config, whereClauses, type='repo'):
    return f'''
        SELECT 
            {getGroupTimeClauseForClickhouse(config)},
            {getGroupIdClauseForClickhouse(config, type)}, 
            COUNT() AS count 
        FROM opensource.gh_events         
        WHERE {' AND '.join(whereClauses)} 
        GROUP BY id, time 
        {getInnerOrderAndLimit(config, 'count')} 
    '''

def __bulidOuterCountSql(config, inner_sql, countColName):
    return f'''
    SELECT 
        id, 
        argMax(name, time) AS name, 
        SUM(count) AS total_count,
        {getGroupArrayInsertAtClauseForClickhouse(config, { 'key': countColName, 'value':'count' })} 
    FROM 
    ({inner_sql})
    GROUP BY id 
    {getOutterOrderAndLimit(config, countColName)}
    '''

def __executeInnnerSql(inner_sql, columns=['time','id','name','count']):
    queryResult = clickhouse.query(inner_sql)
    rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
    return rst

def __executeOuterSql(generated_sql, columns, processMethod):
    queryResult = clickhouse.query(generated_sql)
    rst = [processMethod(row, columns) for row in queryResult]
    # rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
    return rst

def __process(row, cloumns):
    processResult = dict(zip(cloumns,row))
    return processResult

def __processAppendRatio(row, cloumns, countIndex = -1, totalCountIndex = -2):
    processResult = dict(zip(cloumns,row))
    count = row[countIndex]
    total_count = row[totalCountIndex]
    processResult['ratio'] = list(map(lambda v: '{}%'.format(str(format((v*100/total_count), '.2f'))), count))
    return processResult

def chaossCodeChangeCommits(config, mode='outer') -> (List,str):
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

    rst = []
    inner_sql = f'''
        SELECT 
            {getGroupTimeClauseForClickhouse(config)},
            {getGroupIdClauseForClickhouse(config, 'repo')}, 
            COUNT(arrayJoin({arrayJoinMessage})) AS count 
        FROM opensource.gh_events         
        WHERE {' AND '.join(whereClauses)} 
        GROUP BY id, time 
        {getInnerOrderAndLimit(config, 'count')} 
    '''

    if mode == 'origin':
        rst =  Chaoss.__executeInnnerSql(inner_sql)
        return rst, inner_sql
    
    generated_sql = Chaoss.__bulidOuterCountSql(config, inner_sql, 'commits_count')
    columns = ['id', 'name', 'total_count', 'count']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql

def __chaossCount(config, mode, whereClauses, countColName) -> (List,str):
    config = getMergedConfig(config)
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause != None: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    rst = []
    inner_sql = Chaoss.__bulidInnnerCountSql(config, whereClauses)

    if mode == 'origin':
        rst = Chaoss.__executeInnnerSql(inner_sql)
        return rst, inner_sql
    generated_sql = Chaoss.__bulidOuterCountSql(config, inner_sql, countColName)
    columns = ['id', 'name', 'total_count', 'count', 'ratio']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__processAppendRatio)
    return rst, generated_sql

def chaossIssuesNew(config, mode='outer') -> (List,str):
    """_summary_

    Args:
        config (dict): QueryConfig
    """
    whereClauses = ["type = \'IssuesEvent\' AND action IN (\'opened\', \'reopened\')"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'issues_new_count')
    
def chaossIssuesClosed(config, mode='outer') -> (List,str):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    whereClauses = ["type = \'IssuesEvent\' AND action = \'closed\'"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'issues_close_count')

def chaossChangeRequestsAccepted(config: QueryConfig, mode='outer') -> (List,str):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    whereClauses = ["type = \'PullRequestEvent\' AND action = \'closed\' AND pull_merged = 1"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'change_requests_accepted')

def chaossChangeRequestsDeclined(config: QueryConfig, mode='outer') -> (List,str):
    """_summary_

    Args:
        config (QueryConfig): _description_
    """
    whereClauses = ["type = \'PullRequestEvent\' AND action = \'closed\' AND pull_merged = 0"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'change_requests_declined')

BusFactorOptions = {
    # calculate bus factor by change request or git commit, or activity index. default: activity  ('commit' | 'change request' | 'activity')
    'by': 'activity',
    # the bus factor percentage thredhold, default: 0.5
    'percentage': 0.5,
    # include GitHub Apps account, default: false
    'withBot': False,
}

def chaossBusFactor(config, mode='outer') -> (List,str):
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
    
    rst = []
    inner_sql = f'''
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
            {getGroupTimeClauseForClickhouse(config)},
            {getGroupIdClauseForClickhouse(config)},
            {
            'arrayJoin(push_commits.name) AS author, COUNT() AS count' if by == 'commit' else
            'issue_author_id AS actor_id, argMax(issue_author_login, created_at) AS author, COUNT() AS count' if by == 'change request' else
            f'{Chaoss.__basicActivitySqlComponent}, toUInt32(ceil(activity)) AS count'
            }
            FROM opensource.gh_events 
            WHERE {' AND '.join(whereClauses)}
            GROUP BY id, time, {('author' if by == 'commit' else 'actor_id')}
            {botFilterHavingClause}
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'bus_factor')}
    '''
    if mode == 'origin':
        columns = ['time', 'id', 'name', 'total_contributions', 'bus_factor', 'detail']
        rst = Chaoss.__executeInnnerSql(inner_sql, columns)
        return rst, inner_sql

    generated_sql = f'''
        SELECT
        id,
        argMax(name, time) AS name,
        {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "bus_factor"})},
        {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "detail", "noPrecision": True, "defaultValue": "[]"})},
        {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "total_contributions"})}
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, 'bus_factor')}
    '''
    columns = ['id', 'name', 'bus_factor', 'detail', 'total_contributions']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql

IssueResolutionDurationOptions = {
'by': 'open', #'open' | 'close'
'type': 'avg', #'avg' | 'median'
'unit': 'week' #'week' | 'day' | 'hour' | 'minute'
}

def __chaossResolutionDuration(config, type, mode) -> (List,str):
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
    unit = filterEnumType(config.get("options", {}).get("unit"), Chaoss.timeDurationConstants["unitArray"], 'day')
    thresholds = config.get("options", {}).get("thresholds", [3, 7, 15])
    ranges = thresholds + [-1]
    sortBy = filterEnumType(config.get("options", {}).get("sortBy"), Chaoss.timeDurationConstants["sortByArray"], 'avg')

    rst = []
    inner_sql = f'''
        SELECT
            {getGroupTimeClauseForClickhouse(config, byCol)},
            {getGroupIdClauseForClickhouse(config, 'repo')},
            avg(resolution_duration) AS avg,
            {', '.join([f'quantile({q / 4})(resolution_duration) AS quantile_{q}' for q in Chaoss.timeDurationConstants["quantileArray"]])},
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
    '''
    if mode == 'origin':
        columns = ['time','id','name','avg', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4', 'resolution_levels']
        rst = Chaoss.__executeInnnerSql(inner_sql, columns)
        return rst, inner_sql

    generated_sql = f'''
    SELECT
        id,
        argMax(name, time) As name,
        {getGroupArrayInsertAtClauseForClickhouse(config, { "key": "avg", "defaultValue": 'NaN' })},
        {getGroupArrayInsertAtClauseForClickhouse(config, { "key": 'levels', "value": 'resolution_levels', "defaultValue": "[]", "noPrecision": True })},
        {', '.join([getGroupArrayInsertAtClauseForClickhouse(config, { "key": f"quantile_{q}", "defaultValue": 'NaN' }) for q in Chaoss.timeDurationConstants["quantileArray"]])}
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, sortBy, 1 if sortBy == 'levels' else None)}
    '''
    columns = ['id', 'name', 'resolution_duration_avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']
    rst = Chaoss.__executeInnnerSql(generated_sql, columns)
    return rst, generated_sql

def chaossIssueResolutionDuration(config, mode='outer') -> (List,str):
    return Chaoss.__chaossResolutionDuration(config, 'issue', mode)

def chaossChangeRequestResolutionDuration(config, mode='outer') -> (List,str):
    return Chaoss.__chaossResolutionDuration(config, 'change request', mode)

def __chaossResponseTime(config, type, mode) -> (List,str):
    config = getMergedConfig(config)
    whereClauses = []

    if type == 'issue':
        whereClauses.append("type IN ('IssueCommentEvent', 'IssuesEvent') AND actor_login NOT LIKE '%[bot]'")
    else:
        whereClauses.append("type IN ('IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent', 'PullRequestReviewEvent') AND actor_login NOT LIKE '%[bot]'")

    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause:
        whereClauses.append(repoWhereClause)
    
    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1) 
    unit = filterEnumType(config.get("options", {}).get("unit"), Chaoss.timeDurationConstants["unitArray"], 'day')
    thresholds = config.get("options", {}).get("thresholds", [3, 7, 15])
    ranges = thresholds + [-1]
    sortBy = filterEnumType(config.get("options", {}).get("sortBy"), Chaoss.timeDurationConstants["sortByArray"], 'avg')

    rst = []
    inner_sql = f'''
        SELECT
            {getGroupTimeClauseForClickhouse(config, 'issue_created_at')},
            {getGroupIdClauseForClickhouse(config)},
            avg(response_time) AS avg,
            {', '.join([f'quantile({q / 4})(response_time) AS quantile_{q}' for q in Chaoss.timeDurationConstants["quantileArray"]])},
            [{', '.join([f'countIf(response_level = {i})' for i in range(len(ranges))])}] AS response_levels
        FROM
        (
            SELECT
                repo_id,
                argMax(repo_name, created_at) AS repo_name,
                org_id,
                argMax(org_login, created_at) AS org_login,
                issue_number,
                minIf(created_at, action = 'opened' AND issue_comments = 0) AS issue_created_at,
                minIf(created_at, (action = 'created' AND actor_id != issue_author_id) OR (action = 'closed')) AS responded_at,
                if(responded_at = toDate('1970-01-01'), now(), responded_at) AS first_responded_at,
                dateDiff('{unit}', issue_created_at, first_responded_at) AS response_time,
                multiIf({', '.join([f'response_time <= {t}, {i}' for i, t in enumerate(thresholds)])}, {len(thresholds)}) AS response_level
            FROM opensource.gh_events 
            WHERE {' AND '.join(whereClauses)}
            GROUP BY repo_id, org_id, issue_number
            HAVING issue_created_at >= toDate('{config.get('startYear')}-{config.get('startMonth')}-1') 
                    AND issue_created_at < toDate('{endDate.year}-{endDate.month}-1')
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'resolution_duration')}
    '''
    if mode == 'origin':
        columns = ['time','id','name','avg', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4', 'response_levels']
        rst = Chaoss.__executeInnnerSql(inner_sql,columns)
        return rst, inner_sql
    
    generated_sql = f'''
    SELECT
        id,
        argMax(name, time),
        {getGroupArrayInsertAtClauseForClickhouse(config, { "key": "avg", "defaultValue": 'NaN' })},
        {getGroupArrayInsertAtClauseForClickhouse(config, { "key": 'levels', "value": 'response_levels', "defaultValue": "[]", "noPrecision": True })},
        {', '.join([getGroupArrayInsertAtClauseForClickhouse(config, { "key": f"quantile_{q}", "defaultValue": 'NaN' }) for q in Chaoss.timeDurationConstants["quantileArray"]])}
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, sortBy, 1 if sortBy == 'levels' else None)}
    '''
    columns = ['id', 'name', 'response_time_avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql

def chaossIssueResponseTime(config, mode='outer') -> (List,str):
    return Chaoss.__chaossResponseTime(config, 'issue', mode)

def chaossChangeRequestResponseTime(config, mode='outer') -> (List,str):
    return Chaoss.__chaossResponseTime(config, 'change request', mode)

def __chaossAge(config, type, mode) -> (List,str):
    config = getMergedConfig(config)
    whereClauses = []

    if type == 'issue':
        whereClauses.append("type='IssuesEvent'")
    else:
        whereClauses.append("type='PullRequestEvent'")

    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause:
        whereClauses.append(repoWhereClause)

    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1) 
    endTimeClause = f"toDate('{endDate.year}-{endDate.month}-1')"
    whereClauses.append(f"created_at < {endTimeClause}")
    if config['groupTimeRange']:
        timeClause = f"arrayJoin(arrayMap(x -> dateAdd({config.get('groupTimeRange')}, x + 1, toDate('{config.get('startYear')}-{config.get('startMonth')}-1')), range(toUInt64(dateDiff('{config.get('groupTimeRange')}', toDate('{config.get('startYear')}-{config.get('startMonth')}-1'), {endTimeClause}))))) AS time"
    else:
        timeClause = f"{endTimeClause} AS time"

    unit = filterEnumType(config.get("options", {}).get("unit"), Chaoss.timeDurationConstants["unitArray"], 'day')
    thresholds = config.get("options", {}).get("thresholds", [15, 30, 60])
    ranges = thresholds + [-1]
    sortBy = filterEnumType(config.get("options", {}).get("sortBy"), Chaoss.timeDurationConstants["sortByArray"], 'avg')

    inner_sql = f'''
        SELECT
            {timeClause},
            {getGroupIdClauseForClickhouse(config)},
            avgIf(dateDiff('{unit}', opened_at, time), opened_at < time AND closed_at >= time) AS avg,
            {', '.join([f"quantileIf({q / 4})(dateDiff('{unit}', opened_at, time), opened_at < time AND closed_at >= time) AS quantile_{q}" for q in Chaoss.timeDurationConstants["quantileArray"]])},
            [{', '.join([f"""countIf(multiIf({', '.join([f"dateDiff('{unit}', opened_at, time) <= {t}, {i}" for i, t in enumerate(thresholds)])}, {len(thresholds)}) = {i} AND opened_at < time AND closed_at >= time)""" for i in range(len(ranges))])}] AS age_levels
        FROM
        (
            SELECT
                repo_id,
                argMax(repo_name, created_at) AS repo_name,
                org_id,
                argMax(org_login, created_at) AS org_login,
                issue_number,
                minIf(created_at, action = 'opened') AS opened_at,
                maxIf(created_at, action = 'closed') AS real_closed_at,
                if(real_closed_at=toDate('1970-1-1'), {endTimeClause}, real_closed_at) AS closed_at
            FROM opensource.gh_events
            WHERE {' AND '.join(whereClauses)}
            GROUP BY repo_id, org_id, issue_number
            HAVING opened_at > toDate('1970-01-01')
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'age')}
    '''
    if mode == 'origin':
        columns = ['time','id','name','avg', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4', 'age_levels']
        rst = Chaoss.__executeInnnerSql(inner_sql,columns)
        return rst, inner_sql

    generated_sql = f'''
    SELECT
        id,
        argMax(name, time),
        {getGroupArrayInsertAtClauseForClickhouse(config, { "key": "avg", "defaultValue": 'NaN', "positionByEndTime": True })},
        {getGroupArrayInsertAtClauseForClickhouse(config, { "key": 'levels', "value": 'if(arrayAll(x -> x = 0, age_levels), [], age_levels)', "defaultValue": "[]", "noPrecision": True, "positionByEndTime": True })},
        {', '.join([getGroupArrayInsertAtClauseForClickhouse(config, { "key": f'quantile_{q}', "defaultValue": 'NaN', "positionByEndTime": True}) for q in Chaoss.timeDurationConstants["quantileArray"]])}
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, sortBy, 1 if sortBy == 'levels' else None)}
    '''
    columns = ['id', 'name', 'response_time_avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql       

def chaossIssueAge(config, mode='outer') -> (List,str):
    return Chaoss.__chaossAge(config, 'issue', mode)

def chaossChangeRequestAge(config, mode='outer') -> (List,str):
    return Chaoss.__chaossAge(config, 'change request', mode)

#Evolution - Code Development Efficiency
def chaossChangeRequestsAccepted(config, mode='outer') -> (List,str):
    whereClauses = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'change_requests_accepted')

def chaossChangeRequestsDeclined(config, mode='outer') -> (List,str):
    whereClauses = ["type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 0"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'change_requests_accepted')

def chaossChangeRequestsAcceptanceRatio(config, mode='outer') -> (List,str):
    config = getMergedConfig(config)
    whereClauses = ["type = 'PullRequestEvent' AND action = 'closed' "]
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause:
        whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))

    inner_sql = f'''
        SELECT
            {getGroupTimeClauseForClickhouse(config)},
            {getGroupIdClauseForClickhouse(config)},
            COUNT() AS count,
            countIf(pull_merged = 1) AS accepted_count,
            countIf(pull_merged = 0) AS declined_count,
            accepted_count / count AS ratio
        FROM opensource.gh_events
        WHERE {" AND ".join(whereClauses)}
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'ratio')}
    '''
    if mode == 'origin':
        columns = ['time','id','name', 'count', 'accepted_count', 'declined_count', 'ratio']
        rst = Chaoss.__executeInnnerSql(inner_sql,columns)
        return rst, inner_sql        
    
    generated_sql = f'''
    SELECT
        id,
        argMax(name, time) AS name,
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'change_requests_accepted_ratio', 'value': 'ratio'})},
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'change_requests_accepted', 'value': 'accepted_count'})},
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'change_requests_declined', 'value': 'declined_count'})}
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, 'change_requests_accepted_ratio')}
    '''
    columns = ['id', 'name', 'ratio', 'accepted_count', 'declined_count']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql    

# Evolution - Code Development Process Quality
def chaossChangeRequests(config, mode='outer') -> (List,str):
    whereClauses = ["type = 'PullRequestEvent' AND action = 'opened'"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'change_requests_count')

def chaossChangeRequestReviews(config, mode='outer') -> (List,str):
    whereClauses = ["type = 'PullRequestReviewCommentEvent'"]
    return Chaoss.__chaossCount(config, mode, whereClauses, 'change_requests_reviews_count')

NewContributorsOptions = {
    'by': 'commit', #'commit' | 'change request'
    'withBot': False
}

def chaossNewContributors(config, mode='outer') -> (List,str):
    config = getMergedConfig(config)
    by = filterEnumType(config.get('options').get('by') if config.get('options') != None else None, ['commit', 'change request'], 'change request')
    whereClauses = []
    
    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1) 
    
    if by == 'commit':
        whereClauses.append("type = 'PushEvent'")
    elif by == 'change request':
        whereClauses.append("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1")
    
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause:
        whereClauses.append(repoWhereClause)

    inner_sql = f'''
        SELECT
            {getGroupTimeClauseForClickhouse(config, 'first_time')},
            {getGroupIdClauseForClickhouse(config)},
            length(detail) AS new_contributor,
            (arrayMap((x) -> (x), groupArray(author))) AS detail
        FROM
        (
            SELECT
                min(created_at) AS first_time,
                repo_id,
                argMax(repo_name, created_at) AS repo_name,
                org_id,
                argMax(org_login, created_at) AS org_login,
                {'author' if by == 'commit' else('actor_id, argMax(author,created_at) AS author' if by == 'change request' else '' )}
            FROM
            (
                SELECT
                    repo_id,
                    repo_name,
                    org_id,
                    org_login,
                    {'arrayJoin(push_commits.name) AS author' if by == 'commit' 
                        else('issue_author_id AS actor_id, issue_author_login AS author' if by == 'change request' else '' )},
                    created_at
                FROM opensource.gh_events
                WHERE {" AND ".join(whereClauses)}
                {'' if config.get("options", {}).get("withBot") and by != 'commit' else "HAVING author NOT LIKE '%[bot]'"}
            )
            GROUP BY repo_id, org_id, {'author' if by == 'commit' else 'actor_id'}
            HAVING first_time >= toDate('{config.get('startYear')}-{config.get('startMonth')}-1') AND first_time < toDate('{endDate.year}-{endDate.month}-1')
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'new_contributor')}
    '''
    if mode == 'origin':
        columns = ['time','id','name', 'new_contributor', 'detail']
        rst = Chaoss.__executeInnnerSql(inner_sql,columns)
        return rst, inner_sql        
    
    generated_sql = f'''
    SELECT
        id,
        argMax(name, time) AS name,
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'new_contributors', 'value': 'new_contributor'})},
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'detail', 'noPrecision': True, 'defaultValue': '[]'})},
        SUM(new_contributor) AS total_new_contributors
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, 'new_contributors')}
    '''
    columns = ['id', 'name', 'new_contributors', 'detail', 'total_new_contributors']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql  

InactiveContributorsOptions = {
    # time interval to determine inactive contributor, default: 6
    'timeInterval': 6,  
    # time interval unit, default: month
    'timeIntervalUnit': 'month',
    # determine contributor by commit or by change request
    'by': 'commit', # 'commit'| 'change request',
    # min count of contributions to determine inactive contributor
    'minCount': 0,
    'withBot': False
}  

def chaossInactiveContributors(config, mode='outer') -> (List,str):
    config = getMergedConfig(config)
    by = filterEnumType(config.get("options", {}).get('by'), ['commit', 'change request'], 'change request')
    timeInterval = config.get("options", {}).get('timeInterval', 6)
    timeIntervalUnit = filterEnumType(config.get("options", {}).get('timeIntervalUnit'), ['month', 'quarter', 'year'], 'month')
    minCount = config.get("options", {}).get('minCount', 0)
    whereClauses = []
    
    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1) 
    endTimeClause = f"toDate('{endDate.year}-{endDate.month}-1')"

    if by == 'commit':
        whereClauses.append("type = 'PushEvent'")
    elif by == 'change request':
        whereClauses.append("type = 'PullRequestEvent' AND action = 'closed' AND pull_merged = 1")
    
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause:
        whereClauses.append(repoWhereClause)
    
    whereClauses.append(f"created_at < {endTimeClause}")

    inner_sql = f'''
        SELECT
            id,
            argMax(name, time) AS name,
            time,
            countIf(first_time < time AND contributions <= {minCount}) AS inactive_contributors,
            groupArrayIf(author, first_time < time AND contributions <= {minCount}) AS detail
        FROM
        (
            SELECT
            {(
                f"arrayJoin(arrayMap(x -> dateAdd({config['groupTimeRange']}, x + 1, toDate('{config['startYear']}-{config['startMonth']}-1')), " +
                f"range(toUInt64(dateDiff('{config['groupTimeRange']}', toDate('{config['startYear']}-{config['startMonth']}-1'), {endTimeClause})))))"
            ) if config.get('groupTimeRange') else endTimeClause} AS time,
            {getGroupIdClauseForClickhouse(config)},
            {('author' if by == 'commit' else 'actor_id, argMax(author, created_at) AS author')},
            min(created_at) AS first_time,
            countIf(created_at >= dateSub({timeIntervalUnit}, {timeInterval}, time) AND created_at <= time) AS contributions
            FROM
            (
            SELECT 
                repo_id,
                repo_name,
                org_id,
                org_login,
                {('arrayJoin(push_commits.name) AS author' if by == 'commit' else 'issue_author_id AS actor_id, issue_author_login AS author')},
                created_at
            FROM opensource.gh_events
            WHERE {' AND '.join(whereClauses)}
            {(config.get('options', {}).get('withBot') and by != 'commit') and '' or "HAVING author NOT LIKE '%[bot]'"}
            )
            GROUP BY id, {('author' if by == 'commit' else 'actor_id')}, time
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'inactive_contributors')}        
    '''
    if mode == 'origin':
        columns = ['id','name', 'time', 'inactive_contributors', 'detail']
        rst = Chaoss.__executeInnnerSql(inner_sql,columns)
        return rst, inner_sql  

    generated_sql = f'''
    SELECT
        id,
        argMax(name, time) AS name,
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'inactive_contributors', 'positionByEndTime': True})},
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'detail', 'noPrecision': True, 'defaultValue': '[]', 'positionByEndTime': True})}
    FROM
    ({inner_sql})
        GROUP BY id
    {getOutterOrderAndLimit(config, 'inactive_contributors')}       
    '''   
    columns = ['id', 'name', 'inactive_contributors', 'detail']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql  

InactiveContributorsOptions = {
    # normalize the results by this option as max value
    'normalize': 100
}  

def __chaossActiveDatesAndTimes(config, type, mode='outer') -> (List,str):
    config = getMergedConfig(config)
    whereClauses = [getTimeRangeWhereClauseForClickhouse(config)]
    
    if type == 'user':
        userWhereClause = getUserWhereClauseForClickhouse(config)
        if userWhereClause:
            whereClauses.append(userWhereClause)
    elif type == 'repo':
        repoWhereClause = getRepoWhereClauseForClickhouse(config)
        if repoWhereClause:
            whereClauses.append(repoWhereClause)
    else:
        raise ValueError(f"Not supported type: {type}")
    
    inner_sql = f'''
        SELECT id, argMax(name, time) AS name, time, arrayMap(x -> {f"round(x*{config.get('options', {}).get('normalize')} * max(count))" if config.get('options', {}).get('normalize') else 'x'}, 
                groupArrayInsertAt(0, 168)(count, toUInt32((day - 1) * 24 + hour))) AS count
        FROM
        (
            SELECT
            {getGroupTimeClauseForClickhouse(config)},
            {getGroupIdClauseForClickhouse(config, type)},
            toHour(created_at) AS hour,
            toDayOfWeek(created_at) AS day,
            COUNT() AS count
            FROM opensource.gh_events
            WHERE {' AND '.join(whereClauses)}
            GROUP BY id, time, hour, day
            ORDER BY day, hour
        )
        GROUP BY id, time
        {getInnerOrderAndLimit(config, 'count', 1)}
    '''
    if mode == 'origin':
        columns = ['id','name', 'time', 'list', 'count']
        rst = Chaoss.__executeInnnerSql(inner_sql,columns)
        return rst, inner_sql  
    
    generated_sql = f'''
    SELECT
        id,
        argMax(name, time) AS name,
        {getGroupArrayInsertAtClauseForClickhouse(config, {'key': 'count', 'noPrecision': True, 'defaultValue': '[]'})}
    FROM
    ({inner_sql})
    GROUP BY id
    {getOutterOrderAndLimit(config, 'count', 1)}
    '''
    columns = ['id', 'name', 'count']
    rst = Chaoss.__executeOuterSql(generated_sql, columns, Chaoss.__process)
    return rst, generated_sql 

def chaossUserActiveDatesAndTimes(config, mode='outer') -> (List,str):
    return Chaoss.__chaossActiveDatesAndTimes(config, 'user', mode)

def chaossRepoActiveDatesAndTimes(config, mode='outer') -> (List,str):
    return Chaoss.__chaossActiveDatesAndTimes(config, 'repo', mode)
    