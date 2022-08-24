from itertools import groupby
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
                'percision': 2,
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
        'order': 'DESC',
        'limit': 10,
        'percision': 2,
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
        if len(data.githubRepos) > 0: arr.append('r.id IN [{}]'.format(','.join(map(str, data.githubRepos))))
        if len(data.githubOrgs) > 0: arr.append('r.org_id IN [{}]'.format(','.join(map(str, data.githubOrgs))))
        if len(arr) == 0: return None
        return '({})'.format(' OR '.join(arr))
    repoWhereClauseArray = []
    if config.get('repoIds'): repoWhereClauseArray.append('r.id IN [{}]'.format(','.join(map(str, config.get('repoIds')))))
    if config.get('repoNames'): repoWhereClauseArray.append('r.name IN [{}]'.format(list(map(lambda n:'\'{}\''.format(n)), config.get('repoNames'))))
    if config.get('orgIds'): repoWhereClauseArray.append('r.org_id IN [{}]'.format(','.join(map(str, config.get('orgIds')))))
    if config.get('orgNames'): repoWhereClauseArray.append('r.org_name IN [{}]'.format(list(map(lambda o:'\'{}\''.format(o)), config.get('orgNames'))))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubRepos > 0): repoWhereClauseArray.append('r.id IN [{}]'.format(','.join(data.githubRepos)))
        if len(data.githubOrgs  > 0): repoWhereClauseArray.append('r.org_id IN [{}]'.format(','.join(data.githubOrgs)))
    repoWhereClause = '({})'.format(' OR '.join(repoWhereClauseArray)) if len(repoWhereClauseArray) > 0 else None
    return repoWhereClause
  

def getRepoWhereClauseForClickhouse(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        arr = []
        if len(data.githubRepos) > 0: arr.append('repo_id IN [{}]'.format(','.join(map(str,data.githubRepos))))
        if len(data.githubOrgs) > 0: arr.append('org_id IN [{}]'.format(','.join(map(str,data.githubOrgs))))
        if len(arr) == 0: return None
        return '({})'.format(' OR '.join(arr))
    repoWhereClauseArray = []
    if config.get('repoIds'): repoWhereClauseArray.append('repo_id IN [{}]'.format(','.join(config.get('repoIds'))))
    if config.get('repoNames'): repoWhereClauseArray.append('repo_name IN [{}]'.format(list(map(lambda n:'\'{}\''.format(n)), config.get('repoNames'))))
    if config.get('orgIds'): repoWhereClauseArray.append('org_id IN [{}]'.format(','.join(config.get('orgIds'))))
    if config.get('orgNames'): repoWhereClauseArray.append('org_name IN [{}]'.format(list(map(lambda o:'\'{}\''.format(o)), config.get('orgNames'))))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubRepos > 0): repoWhereClauseArray.append('repo_idIN [{}]'.format(','.join(data.githubRepos)))
        if len(data.githubOrgs  > 0): repoWhereClauseArray.append('org_id IN [{}]'.format(','.join(data.githubOrgs)))
    repoWhereClause = '({})'.format(' OR '.join(repoWhereClauseArray)) if len(repoWhereClauseArray) > 0 else None
    return repoWhereClause
  
# User
def getUserWhereClauseForNeo4j(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        if len(data.githubUsers) > 0: return 'u.id IN [{}]'.format(','.join(data.githubUsers))
        return None
    userWhereClauseArray = []
    if config.get('userIds'): userWhereClauseArray.append('u.id IN [{}]'.format(','.join(config.get('userIds'))))
    if config.get('userLogins'): userWhereClauseArray.append('u.login IN [{}]'.format(list(map(lambda n:'\'{}\''.format(n), config.get('userLogins')))))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubUsers > 0): userWhereClauseArray.append('u.id IN [{}]'.format(','.join(data.githubUsers)))
    userWhereClause = '({})'.format(' OR '.join(userWhereClauseArray)) if len(userWhereClauseArray) > 0 else None
    return userWhereClause

def getUserWhereClauseForClickhouse(config):
    def process(l):
        data = getGitHubData([l])
        data = EasyDict(data)
        if len(data.githubUsers) > 0: return 'actor_id IN [{}]'.format(','.join(data.githubUsers))
        return None
    userWhereClauseArray = []
    if config.get('userIds'): userWhereClauseArray.append('actor_id IN [{}]'.format(','.join(config.get('userIds'))))
    if config.get('userLogins'): userWhereClauseArray.append('actor_login IN [{}]'.format(list(map(lambda n:'\'{}\''.format(n), config.get('userLogins')))))
    if config.get('labelIntersect'):
        return '(' + ' AND '.join(list(filter(lambda i: i != None, list(map(process, config.get('labelIntersect')))))) + ')'
    if config.get('labelUnion'):
        data = EasyDict(getGitHubData(config.get('labelUnion')))
        if len(data.githubRepos > 0): userWhereClauseArray.append('actor_id IN [{}]'.format(','.join(data.githubUsers)))
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
    def process_quarter(y, m, lastQuarter = 0):
        q = math.ceil(m / 3)
        if q != lastQuarter: timeRangeSumClauseArray.append([])
        timeRangeSumClauseArray[len(timeRangeSumClauseArray) - 1].append('COALESCE({}_{}{}, 0.0)'.format(type, y, m))
        lastQuarter = q
    def process_year(y, m, lastYear = 0):
        if y != lastYear: timeRangeSumClauseArray.append([])
        timeRangeSumClauseArray[len(timeRangeSumClauseArray) - 1].append('COALESCE({}_{}{}, 0.0)'.format(type, y, m))
        lastYear = y
    timeRangeSumClauseArray = []
    if config.get('groupTimeRange') == 'month':
        # for every month individual, every element belongs to a individual element
        forEveryMonthByConfig(config, lambda y, m: timeRangeSumClauseArray.append(['COALESCE({}_{}{}, 0.0)'.format(type, y, m)]))
    elif config.get('groupTimeRange') == 'quarter':
        # for every quarter, need to find out when to push a new element by quarter
        lastQuarter = 0
        forEveryMonthByConfig(config, process_quarter)
    elif config.get('groupTimeRange') == 'year':
        # for every year, need to find out when to push a new element by the year;
        lastYear = 0
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
  
def getGroupArrayInsertAtClauseForClickhouse(config, option) -> str:
    """_summary_
    Args:
        config (dict): QueryConfig
        option (_type_): { key: string; defaultValue?: string; value?: string; }
    """
    def process():
        if config.get('groupTimeRange') == None: return '0'
        startTime = 'toDate(\'{}-{}-1\')'.format(config.get('startYear'), config.get('startMonth'))
        if config.get('groupTimeRange') == 'quarter': startTime = 'toStartOfQuarter({})'.format(startTime)
        elif config.get('groupTimeRange') == 'year': startTime = 'toStartOfYear({})'.format(startTime)
        return 'toUInt32(dateDiff(\'{}\', {}, time))'.format(config.get('groupTimeRange'), startTime)
    return 'groupArrayInsertAt{}({}, {}) AS {}'.format('({})'\
        .format(option.get('defaultValue')) if option.get('defaultValue') != None else '', option.get('value') if option.get('value')!=None else option.get('key'), process(), option.get('key'))

def getGroupTimeAndIdClauseForClickhouse(config, type = 'repo', timeCol = 'created_at') -> str:
    """_summary_
    Args:
        config (_type_): _description_
        type (str, optional): _description_. Defaults to 'repo'.
        timeCol (str, optional): _description_. Defaults to 'created_at'.

    Returns:
        str: _description_
    """
    def get_groupEle():
        groupEle = '1' # no time range, aggregate all data to a single value
        if config.get('groupTimeRange') == 'month': groupEle = 'toStartOfMonth({})'.format(timeCol)
        elif config.get('groupTimeRange') == 'quarter': groupEle = 'toStartOfQuarter({})'.format(timeCol)
        elif config.get('groupTimeRange') == 'year': groupEle = 'toStartOfYear({})'.format(timeCol)
        return groupEle
    def group_by():
        if config.get('groupBy') == None:  #group by repo'
            if type == 'repo':
                return 'repo_id AS id, argMax(repo_name, time) AS name'
            else:
                return 'actor_id AS id, argMax(actor_login, time) AS name'
        elif config.get('groupBy') == 'org':
            return 'org_id AS id, argMax(org_login, time) AS name'
        else :  # group by label
            return '{} AS id, id AS name'.format(getLabelGroupConditionClauseForClickhouse(config))
    return '{} AS time, {}'.format(get_groupEle(), group_by())

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