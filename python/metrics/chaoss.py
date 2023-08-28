import datetime
from typing import Tuple,List
from .basic import filterEnumType,\
                  getGroupArrayInsertAtClauseForClickhouse,\
                  getGroupTimeAndIdClauseForClickhouse,\
                  getMergedConfig,\
                  getRepoWhereClauseForClickhouse,\
                  getTimeRangeWhereClauseForClickhouse,\
                  getInnerOrderAndLimit,\
                  getOutterOrderAndLimit,\
                  QueryConfig
from db.clickhouse_wrapper import ClickhouseWrapper
clickhouse = ClickhouseWrapper()

class Chaoss():
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
                {getGroupTimeAndIdClauseForClickhouse(config, type)}, 
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
        rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
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
                {getGroupTimeAndIdClauseForClickhouse(config, 'repo')}, 
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
        columns = ['id', 'name', 'total_count', 'count']
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
                {getGroupTimeAndIdClauseForClickhouse(config)},
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
            queryResult = clickhouse.query(generated_sql)
            columns = ['time', 'id', 'name', 'total_contributions', 'bus_factor', 'detail']
            rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
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
        queryResult = clickhouse.query(generated_sql)
        columns = ['id', 'name', 'bus_factor', 'detail', 'total_contributions']
        rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
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
                {getGroupTimeAndIdClauseForClickhouse(config, 'repo', byCol)},
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
            queryResult = clickhouse.query(inner_sql)
            columns = ['time','id','name','avg', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4', 'resolution_levels']
            rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
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
        queryResult = clickhouse.query(generated_sql)
        columns = ['id', 'name', 'resolution_duration_avg', 'levels', 'quantile_0', 'quantile_1', 'quantile_2', 'quantile_3', 'quantile_4']
        rst = list(map(lambda row: dict(zip(columns,row)), queryResult))
        return rst, generated_sql
    
    def chaossIssueResolutionDuration(config, mode='outer') -> (List,str):
        return Chaoss.__chaossResolutionDuration(config, 'issue', mode)

    def chaossChangeRequestResolutionDuration(config, mode='outer') -> (List,str):
        return Chaoss.__chaossResolutionDuration(config, 'change request', mode)
