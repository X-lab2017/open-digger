from itertools import groupby
import db.clickhouse_wrapper as clickhouse_wrapper
from numpy import append
from label_data_utils import getGitHubData, getLabelData
import datetime
from easydict import EasyDict
import math

QueryConfig = {
                'labelUnion': None,
                'labelIntersect': None,
                'repoIds': None,
                'orgIds': None,
                'repoNames': None,
                'orgNames': None,
                'userIds': None,
                'userLogins': None,
                'startYear': 2015,
                'startMonth': 1,
                'endYear': 2015,
                'endMonth': 12,
                'order': 'DESC',
                'limit': 10,
                'precision': 2,
                'groupBy': None,
                'groupTimeRange': None,
                'options': None
}

def getMergedConfig(config):
    defaultConfig = {
        'startYear': 2015,
        'startMonth': 1,
        'endYear': datetime.datetime.today().year,
        'endMonth': datetime.datetime.today().month,
        'orderOption': 'latest',
        'order': 'DESC',
        'limit': 10,
        'limitOption': 'all',
        'precision': 2,
    } 
    defaultConfig.update(config)
    return defaultConfig


def forEveryMonthByConfig(config, func):
    return forEveryMonth(config.get('startYear'), config.get('startMonth'), config.get('endYear'), config.get('endMonth'), func)

def forEveryMonth(startYear, startMonth, endYear, endMonth, func):
    for y in range(startYear, endYear + 1):
        begin_month = startMonth if y == startYear else 1
        end_month = endMonth if y == endYear else 12
        for m in range(begin_month, end_month + 1):
            func(y, m)

# Repo
def getRepoWhereClauseForNeo4j(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        arr = []
        if len(data.githubRepos) > 0: arr.append('r.id IN {}'.format(data.githubRepos))
        if len(data.githubOrgs) > 0: arr.append('r.org_id IN {}'.format(data.githubOrgs))
        if len(arr) == 0: return None
        return '({})'.format(' OR '.join(arr))
    repoWhereClauseArray = []
    if config.get('repoIds'): repoWhereClauseArray.append('r.id IN {}'.format(config.get('repoIds')))
    if config.get('repoNames'): repoWhereClauseArray.append('r.name IN {}'.format(config.get('repoNames')))
    if config.get('orgIds'): repoWhereClauseArray.append('r.org_id IN {}'.format(config.get('orgIds')))
    if config.get('orgNames'): repoWhereClauseArray.append('r.org_name IN {}'.format(config.get('orgNames')))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubRepos > 0): repoWhereClauseArray.append('r.id IN {}'.format(data.githubRepos))
        if len(data.githubOrgs  > 0): repoWhereClauseArray.append('r.org_id IN {}'.format(data.githubOrgs))
    repoWhereClause = '({})'.format(' OR '.join(repoWhereClauseArray)) if len(repoWhereClauseArray) > 0 else None
    return repoWhereClause

def getRepoWhereClauseForClickhouse(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        arr = []
        if len(data.githubRepos) > 0: arr.append('repo_id IN {}'.format(data.githubRepos))
        if len(data.githubOrgs) > 0: arr.append('org_id IN {}'.format(data.githubOrgs))
        if len(arr) == 0: return None
        return '({})'.format(' OR '.join(arr))
    repoWhereClauseArray = []
    if config.get('repoIds'): repoWhereClauseArray.append('repo_id IN {}'.format(config.get('repoIds')))
    if config.get('repoNames'):
      # find id first
      sql = 'SELECT DISTINCT(repo_id) FROM opensource.gh_events WHERE repo_name IN {}'.format(config.get('repoNames'))
      ids = clickhouse_wrapper.query(sql)
      repoWhereClauseArray.append('repo_id IN {}'.format(list(map(lambda i: i[0], ids))))
    if config.get('orgIds'): repoWhereClauseArray.append('org_id IN {}'.format(config.get('orgIds')))
    if config.get('orgNames'):
      # find id first
      sql = 'SELECT DISTINCT(org_id) FROM opensource.gh_events WHERE org_login IN {}'.format(config.get('orgNames'))
      ids = clickhouse_wrapper.query(sql)
      repoWhereClauseArray.append('org_id IN {}'.format(list(map(lambda i: i[0], ids))))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubRepos > 0): repoWhereClauseArray.append('repo_idIN {}'.format(data.githubRepos))
        if len(data.githubOrgs  > 0): repoWhereClauseArray.append('org_id IN {}'.format(data.githubOrgs))
    repoWhereClause = '({})'.format(' OR '.join(repoWhereClauseArray)) if len(repoWhereClauseArray) > 0 else None
    return repoWhereClause
  
# User
def getUserWhereClauseForNeo4j(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        if len(data.githubUsers) > 0: return 'u.id IN {}'.format(data.githubUsers)
        return None
    userWhereClauseArray = []
    if config.get('userIds'): userWhereClauseArray.append('u.id IN {}'.format(config.get('userIds')))
    if config.get('userLogins'): userWhereClauseArray.append('u.login IN {}'.format(config.get('userLogins')))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubUsers > 0): userWhereClauseArray.append('u.id IN {}'.format(data.githubUsers))
    userWhereClause = '({})'.format(' OR '.join(userWhereClauseArray)) if len(userWhereClauseArray) > 0 else None
    return userWhereClause

def getUserWhereClauseForClickhouse(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        if len(data.githubUsers) > 0: return 'actor_id IN {}'.format(data.githubUsers)
        return None
    userWhereClauseArray = []
    if config.get('userIds'): userWhereClauseArray.append('actor_id IN {}'.format(config.get('userIds')))
    if config.get('userLogins'):
      # get id first
      sql = 'SELECT DISTINCT(actor_id) FROM opensource.gh_events WHERE actor_login IN {}'.format(config.get('userLogins'))
      ids = clickhouse_wrapper.query(sql)
      userWhereClauseArray.append('actor_id IN {}'.format(list(map(lambda i: i[0], ids))))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubRepos > 0): userWhereClauseArray.append('actor_id IN {}'.format(data.githubUsers))
    userWhereClause = '({})'.format(' OR '.join(userWhereClauseArray)) if len(userWhereClauseArray) > 0 else None
    return userWhereClause

# Time
def getTimeRangeWhereClauseForNeo4j(config, type):
    timeWhereClauseArray = []
    forEveryMonthByConfig(config, lambda y, m: timeWhereClauseArray.append('{}.activity_{}{} > 0'.format(type, y, m)))
    if len(timeWhereClauseArray) == 0: raise Exception('Not valid time range.')
    timeWhereClause = '({})'.format(' OR '.join(timeWhereClauseArray))
    return timeWhereClause

def getTimeRangeSumClauseForNeo4j(config, type):
    lastYear = 0
    lastQuarter = 0
    def process_quarter(y, m):
        nonlocal lastQuarter
        q = math.ceil(m / 3)
        if q != lastQuarter: timeRangeSumClauseArray.append([])
        timeRangeSumClauseArray[len(timeRangeSumClauseArray) - 1].append('COALESCE({}_{}{}, 0.0)'.format(type, y, m))
        lastQuarter = q
    def process_year(y, m):
        nonlocal lastYear
        if y != lastYear: timeRangeSumClauseArray.append([])
        timeRangeSumClauseArray[len(timeRangeSumClauseArray) - 1].append('COALESCE({}_{}{}, 0.0)'.format(type, y, m))
        lastYear = y
    timeRangeSumClauseArray = []
    if config.get('groupTimeRange') == 'month':
        # for every month individual, every element belongs to a individual element
        forEveryMonthByConfig(config, lambda y, m: timeRangeSumClauseArray.append(['COALESCE({}_{}{}, 0.0)'.format(type, y, m)]))
    elif config.get('groupTimeRange') == 'quarter':
        # for every quarter, need to find out when to push a new element by quarter
        forEveryMonthByConfig(config, process_quarter)
    elif config.get('groupTimeRange') == 'year':
        # for every year, need to find out when to push a new element by the year;
        forEveryMonthByConfig(config, process_year)
    else:
        # for all to single one, push to the first element
        timeRangeSumClauseArray.push([])
        forEveryMonthByConfig(config, lambda y, m: timeRangeSumClauseArray[0].append('COALESCE({}_{}{}, 0.0)'.format(type, y, m)))
    if len(timeRangeSumClauseArray) == 0: raise Exception('Not valid time range.')
    timeRangeSumClause = list(map(lambda i: 'round({}, {})'.format(' + '.join(i), config.get('percision')), timeRangeSumClauseArray))
    return timeRangeSumClause

def getTimeRangeWhereClauseForClickhouse(config):
    endDate = datetime.date(year = config.get('endYear')+1 if config.get('endMonth')+1>12 else config.get('endYear'), month = (config.get('endMonth')+1)%12, day = 1)
    # endDate.setMonth(config.get('endMonth'))  # find next month
    return ' created_at >= toDate(\'{}-{}-1\') AND created_at < toDate(\'{}-{}-1\') '.format(config.get('startYear'), config.get('startMonth'), endDate.year, endDate.month)

# clickhouse label group condition
def getLabelGroupConditionClauseForClickhouse(config): 
    labelData = list(filter(lambda l: l.get('type') == config.get('groupBy'), getLabelData())) if getLabelData() != None else None
    if (labelData==None or len(labelData) == 0): raise Exception('Invalide group by label: {}'.format(config.get('groupBy')))
    idLabelRepoMap = {}
    idLabelOrgMap = {}
    idLabelUserMap = {}
    def addToMap(my_map, id, label):
        if not id in my_map: my_map[id] = []
        if my_map.get(id) != None: my_map.get(id).append(label) 

    for l in labelData:
        for id in l.get('githubOrgs'): addToMap(idLabelOrgMap, id, l.get('name'))
        for id in l.get('githubRepos'): addToMap(idLabelRepoMap, id, l.get('name'))
        for id in l.get('githubUsers'): addToMap(idLabelUserMap, id, l.get('name'))

    resultMap = {}  # <string, { labels: string[], repoIds: number[], orgIds: number[], userIds: number[] }>
    def addToResultMap(my_map, id:int, labels:str, type):
        """_summary_
        Args:
            my_map (dict): dict<string, { labels: string[], repoIds: number[], orgIds: number[], userIds: number[] }>
            id (int): number
            labels (str): string list
            type (str): 'repo' | 'org' | 'user'
        """
        key = str(labels)
        if not key in my_map: my_map[key] = { 'labels':labels, 'repoIds': [], 'orgIds': [], 'userIds': [] }
        if type == 'repo': 
            if my_map.get(key) != None: my_map.get(key).get('repoIds').append(id)
        elif type == 'org': 
            if my_map.get(key) != None: my_map.get(key).get('orgIds').append(id)
        elif type == 'user': 
            if my_map.get(key) != None: my_map.get(key).get('userIds').append(id)
            
    for id, labels in idLabelRepoMap.items(): addToResultMap(resultMap, id, labels, 'repo')
    for id, labels in idLabelOrgMap.items(): addToResultMap(resultMap, id, labels, 'org')
    for id, labels in idLabelUserMap.items(): addToResultMap(resultMap, id, labels, 'user')

    def process(v):
        c = []
        if len(v.get('orgIds')) > 0: c.append('org_id IN ({})'.format(','.join(str(i) for i in v.get('orgIds'))))
        if len(v.get('repoIds')) > 0: c.append('repo_id IN ({})'.format(','.join(str(i) for i in v.get('repoIds'))))
        if len(v.get('userIds')) > 0: c.append('actor_id IN ({})'.format(','.join(str(i) for i in v.get('userIds'))))
        return '({}),[{}]'.format(' OR '.join(c), ','.join(map(lambda l: '\'{}\''.format(l),v.get('labels'))))
    conditions = ','.join(list(map(process, resultMap.values())))

    return 'arrayJoin(multiIf({}, [\'Others\']))'.format(conditions)

def getGroupArrayInsertAtClauseForClickhouse(config, option):
    """_summary_
    Args:
        config (dict): QueryConfig
        option (_type_): { key: string; defaultValue?: string; value?: string; }
    """
    start_time = f"toDate('{config['startYear']}-{config['startMonth']}-1')"
    end_time = f"toDate('{config['endYear']}-{config['endMonth']}-1')"
    
    default_value = option.get('defaultValue', 0)
    
    total_length = ""
    if config.get('groupTimeRange'):
        total_length = f"toUInt32(dateDiff('{config['groupTimeRange']}', {start_time}, {end_time})) + 1"
    else:
        total_length = "1"
    
    fieldName = option.get('value', option['key'])
    if config['precision'] > 0 and not option.get('noPrecision'):
        group_key = f"ROUND({fieldName}, {config['precision']})"
    else:
        group_key = fieldName
    
    if not config.get('groupTimeRange'):
        position = "0"
    else:
        if config['groupTimeRange'] == 'quarter':
            start_time = f"toStartOfQuarter({start_time})"
        elif config['groupTimeRange'] == 'year':
            start_time = f"toStartOfYear({start_time})"
        position = f"toUInt32(dateDiff('{config['groupTimeRange']}', {start_time}, time){'-1' if option.get('positionByEndTime') else ''})"
    
    return f'''groupArrayInsertAt(
            {default_value}, 
            {total_length})({group_key}, 
            {position}) AS {option['key']}'''

def getGroupTimeClauseForClickhouse(config, timeCol = 'created_at') -> str:
    """_summary_
    Args:
        config (_type_): _description_
        timeCol (str, optional): _description_. Defaults to 'created_at'.

    Returns:
        str: _description_
    """
    groupEle = '1' # no time range, aggregate all data to a single value
    if config.get('groupTimeRange') == 'month': groupEle = 'toStartOfMonth({})'.format(timeCol)
    elif config.get('groupTimeRange') == 'quarter': groupEle = 'toStartOfQuarter({})'.format(timeCol)
    elif config.get('groupTimeRange') == 'year': groupEle = 'toStartOfYear({})'.format(timeCol)
    return '{} AS time'.format(groupEle)

def getGroupIdClauseForClickhouse(config, type = 'repo', timeCol = 'created_at') -> str:
    """_summary_
    Args:
        config (_type_): _description_
        type (str, optional): _description_. Defaults to 'repo'.
        timeCol (str, optional): _description_. Defaults to 'created_at'.

    Returns:
        str: _description_
    """
    if config.get('groupBy') == None:  #group by repo'
        if type == 'repo':
            return 'repo_id AS id, argMax(repo_name, time) AS name'
        else:
            return 'actor_id AS id, argMax(actor_login, time) AS name'
    elif config.get('groupBy') == 'org':
        return 'org_id AS id, argMax(org_login, time) AS name'
    else :  # group by label
        return '{} AS id, id AS name'.format(getLabelGroupConditionClauseForClickhouse(config))        

def getInnerOrderAndLimit(config, col, index=None):
    if config.get('limitOption') == 'each' and config.get('limit', 0) > 0:
        order_by_clause = f"ORDER BY {col}[{index}] {config.get('order')}" if config.get('order') else ''
        limit_clause = f"LIMIT {config.get('limit')} BY time"
        return f"{order_by_clause} {limit_clause}"
    else:
        return ''

def getOutterOrderAndLimit(config, col, index=None):
    order_clause = ""
    if config.get('order'):
        if config.get('orderOption') == 'latest':
            order_clause = f"ORDER BY {col}[-1]{f'[{index}]' if index is not None else ''}"
        else:
            index_clause = f"x -> x[{index}], " if index is not None else ''
            order_clause = f"ORDER BY arraySum({index_clause}{col})"
    limit_clause = f"LIMIT {config.get('limit')}" if config.get('limitOption') == 'all' and config.get('limit', 0) > 0 else ''
    return f"{order_clause} {config.get('order', '')} {limit_clause}"

def filterEnumType(value, types, defautlValue: str) -> str:
    """_summary_
    Args:
        value (_type_): _description_
        types (str list): _description_
        defautlValue (str): _description_

    Returns:
        str: _description_
    """
    if not value or not value in types: return defautlValue
    return value
