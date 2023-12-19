from metrics.basic import QueryConfig, \
                  getMergedConfig, \
                  getRepoWhereClauseForNeo4j, \
                  getTimeRangeWhereClauseForNeo4j, \
                  getTimeRangeSumClauseForNeo4j, \
                  getUserWhereClauseForNeo4j, \
                  getRepoWhereClauseForClickhouse,\
                  getUserWhereClauseForClickhouse,\
                  getTimeRangeWhereClauseForClickhouse,\
                  getGroupArrayInsertAtClauseForClickhouse,\
                  getGroupTimeClauseForClickhouse,\
                  getGroupIdClauseForClickhouse, \
                  getInnerOrderAndLimit, \
                  getOutterOrderAndLimit, \
                  getTopLevelPlatform, \
                  getInnerGroupBy, \
                  processQueryResult
from label_data_utils import getLabelData
from db.neo4j_wrapper import Neo4jWrapper
from db.clickhouse_wrapper import ClickhouseWrapper
from functools import cmp_to_key
from metrics.chaoss import chaossCodeChangeCommits, chaossBusFactor, chaossIssuesNew, chaossIssuesClosed, chaossChangeRequestsAccepted, \
    chaossChangeRequestsDeclined, chaossIssueResolutionDuration, \
    chaossChangeRequests, chaossChangeRequestReviews, chaossNewContributors, \
    chaossIssueResponseTime, chaossChangeRequestsAcceptanceRatio, \
    chaossChangeRequestResolutionDuration, chaossChangeRequestResponseTime, chaossIssueAge, chaossChangeRequestAge, chaossInactiveContributors, \
    __chaossActiveDatesAndTimes as chaossActiveDatesAndTimes, chaossRepoActiveDatesAndTimes, chaossUserActiveDatesAndTimes
    # chaossCodeChangeLines, chaossTechnicalFork, chaossChangeRequestsDuration, chaossIssuesAndChangeRequestActive  # todo: define these functions in chaoss.py

# todo: define the functions [repoStars, repoIssueComments, repoParticipants, userEquivalentTimeZone, contributorEmailSuffixes]

import numpy as np
clickhouse = ClickhouseWrapper()
neo4j = Neo4jWrapper()


def getRepoOpenrank(config):
    """_summary_

    Args:
        config (QueryConfig): config of query.
    Returns:
        clickhouse cursor: query results of clickhouse
    """
    config = getMergedConfig(config)
    whereClause = []
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    timeWhereClause = getTimeRangeWhereClauseForClickhouse(config)
    if repoWhereClause:
        whereClause.append(repoWhereClause)
    if timeWhereClause:
        whereClause.append(timeWhereClause)
    whereClause.append("type='Repo'")

    sql = f'''
    SELECT
        id,
        {getTopLevelPlatform(config)},
        argMax(name, time) AS name,
        {getGroupArrayInsertAtClauseForClickhouse(config, {"key": "openrank"})}
    FROM
    (
        SELECT
            platform,
            {getGroupTimeClauseForClickhouse(config)},
            {getGroupIdClauseForClickhouse(config)},
            SUM(openrank) AS openrank
        FROM global_openrank
        WHERE {' AND '.join(whereClause)}
        {getInnerGroupBy(config)}
        {getInnerOrderAndLimit(config, 'openrank')}
    )
    GROUP BY id, platform
    {getOutterOrderAndLimit(config, 'openrank')}
    '''
    result = clickhouse.query(sql)
    return processQueryResult(result, ['openrank'])


# def getRepoOpenrank(config):
#     """_summary_

#     Args:
#         config (QueryConfig): config of query.
#     Returns:
#         neo4j cursor: query results of neo4j
#     """
#     config = getMergedConfig(config)
#     calType = 'open_rank'
#     repoWhereClause = getRepoWhereClauseForNeo4j(config)
#     timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'r')
#     timeActivityOrOpenrankClause = getTimeRangeSumClauseForNeo4j(config, 'r.{}'.format(calType))
#     if not config.get('groupBy'):
#         query = 'MATCH (r:Repo) WHERE {} {} RETURN r.name AS repo_name, r.org_login AS org, [{}] AS {} ORDER BY reverse({}) {} {};'.format(repoWhereClause+' AND ' if repoWhereClause else '', timeWhereClause, ','.join(timeActivityOrOpenrankClause), calType, calType, config.get('order'), 'LIMIT {}'.format(config.get('limit')) if config.get('limit') > 0 else '')
#         return neo4j.query(query)
#     elif config.get('groupBy') == 'org':
#         query = 'MATCH (r:Repo) WHERE {} {} RETURN r.org_login AS org_login, count(r.id) AS repo_count, [{}] AS {} ORDER BY reverse({}) {} {};'.format(repoWhereClause+' AND ' if repoWhereClause else '', timeWhereClause, list(map(lambda i:'round(SUM({}), {})'.format(i, config.get('percision')), timeActivityOrOpenrankClause)), calType, calType, config.get('order'), 'LIMIT {}'.format(config.get('limit')) if config.get('limit') > 0 else '')
#         return neo4j.query(query)
#     else:
#         query = 'MATCH (r:Repo) WHERE {} {} RETURN r.id AS repo_id, r.org_id AS org_id, [{}] AS {};'.format(repoWhereClause + ' AND ' if repoWhereClause else '', timeWhereClause, ','.join(timeActivityOrOpenrankClause), calType)
#         queryResult = neo4j.query(query)
#         labelData = list(filter(lambda l: l.get('type') == config.get('groupBy'), getLabelData())) if getLabelData() != None else None
#         result = {}
#         if labelData == None: return None
#         for row in queryResult:
#             labels = list(filter(lambda l: int(row.get('repo_id')) in l.get('githubRepos') or int(row.get('org_id')) in l.get('githubOrgs'),labelData))
#             for label in labels:
#                 if not label.get('name') in result.keys(): values = row[calType]
#                 else:
#                     values = result.get(label.get('name'))[calType]
#                     for i in range(len(values)):
#                         values[i] += row[calType][i]
#                 result[label.get('name')] = {
#                     'label': label.get('name'),
#                     'repo_count': (result.get(label.get('name'))['repo_count'] if label.get('name') in result else 0) + 1,
#                 }
#                 result[label.get('name')][calType] = values
#         resultArr = list(result.values())
#         if config.get('order') == 'ASC': resultArr.sort(key = cmp_to_key(lambda a, b: a[calType][len(a[calType]) - 1] - b[calType][len(b[calType]) - 1]))
#         if config.get('order') == 'DESC': resultArr.sort(key = cmp_to_key(lambda a, b: b[calType][len(b[calType]) - 1] - a[calType][len(a[calType]) - 1]))
#         for i in resultArr:
#             i[calType] = np.around(i[calType])
#         return resultArr[0:config.get('limit')]

def getUserOpenrank(config):
    """_summary_

    Args:
        config (QueryConfig): config of query.
    Returns:
        neo4j cursor: query results of neo4j
    """
    config = getMergedConfig(config)
    calType = 'open_rank'
    userWhereClause = getUserWhereClauseForNeo4j(config)
    timeWhereClause = getTimeRangeWhereClauseForNeo4j(config, 'u')
    timeActivityClause = getTimeRangeSumClauseForNeo4j(config, 'u.{}'.format(calType))
    query = 'MATCH (u:User) WHERE {} {} RETURN u.login AS user_login, [{}] AS {} ORDER BY {} {} {};'.format(userWhereClause +' AND ' if userWhereClause else '', timeWhereClause, ','.join(timeActivityClause), calType, calType, config.get('order'), 'LIMIT {}'.format(config.get('limit')) if config.get('limit') > 0 else '')
    return neo4j.query(query)

def getRepoActivity(config):
    config = getMergedConfig(config)
    whereClauses = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"] # specify types to reduce memory usage and calculation
    repoWhereClause = getRepoWhereClauseForClickhouse(config)
    if repoWhereClause: whereClauses.append(repoWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    sql = "SELECT id, argMax(name, time) AS name, \
    {}, \
    {}, \
    {}, \
    {}, \
    {}, \
    {} \
FROM \
(".format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'activity', 'defaultValue': '0' }),
            getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'issue_comment', 'defaultValue': '0' }),
            getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'open_issue', 'defaultValue': '0' }),
            getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'open_pull', 'defaultValue': '0' }),
            getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'review_comment', 'defaultValue': '0' }),
            getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'merged_pull', 'defaultValue': '0' }),
            ) + \
"SELECT \
    {}, \
    {}, \
    ROUND(SUM(activity), 2) AS activity, \
    SUM(issue_comment) AS issue_comment, \
    SUM(open_issue) AS open_issue, \
    SUM(open_pull) AS open_pull, \
    SUM(review_comment) AS review_comment, \
    SUM(merged_pull) AS merged_pull \
    FROM \
    (".format(getGroupTimeClauseForClickhouse(config, 'month'), getGroupIdClauseForClickhouse(config, 'repo', 'month')) + \
    "SELECT \
        toStartOfMonth(created_at) AS month, \
        repo_id, argMax(repo_name, created_at) AS repo_name, \
        org_id, argMax(org_login, created_at) AS org_login, \
        if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id, \
        countIf(type='IssueCommentEvent' AND action='created') AS issue_comment, \
        countIf(type='IssuesEvent' AND action='opened')  AS open_issue, \
        countIf(type='PullRequestEvent' AND action='opened') AS open_pull, \
        countIf(type='PullRequestReviewCommentEvent' AND action='created') AS review_comment, \
        countIf(type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull, \
        sqrt({}*issue_comment + {}*open_issue + {}*open_pull + {}*review_comment + {}*merged_pull) AS activity \
    FROM opensource.gh_events \
    WHERE {} \
    GROUP BY repo_id, org_id, actor_id, month \
    HAVING activity > 0 \
    ) \
    GROUP BY id, time\
    {}\
) \
GROUP BY id \
ORDER BY activity[-1] {} \
FORMAT JSONCompact".format(Index.ISSUE_COMMENT_WEIGHT, Index.OPEN_ISSUE_WEIGHT, 
                            Index.OPEN_PULL_WEIGHT, Index.REVIEW_COMMENT_WEIGHT, Index.PULL_MERGED_WEIGHT,
                            ' AND '.join(whereClauses),
                            'ORDER BY activity DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '',
                            config.get('order')
                            ) # use JSONCompact to reduce network I/O

    result = clickhouse.query(sql)
    def return_row(row):
        id, name, activity, issue_comment, open_issue, open_pull, review_comment, merged_pull = row
        return {
        'id':id,
        'name':name,
        'activity':activity,
        'issue_comment':issue_comment,
        'open_issue':open_issue,
        'open_pull':open_pull,
        'review_comment':review_comment,
        'merged_pull':merged_pull,
        }
    return list(map(return_row, result))

def getUserActivity(config = QueryConfig, withBot = True):
    config = getMergedConfig(config)
    whereClauses = ["type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')"] # specify types to reduce memory usage and calculation
    userWhereClause = getUserWhereClauseForClickhouse(config)
    if userWhereClause != None: whereClauses.append(userWhereClause)
    whereClauses.append(getTimeRangeWhereClauseForClickhouse(config))
    sql = "SELECT id, argMax(name, time) AS name, \
{}, \
{}, \
{}, \
{}, \
{}, \
{} \
FROM \
(".format(getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'activity', 'defaultValue': '0' }),
        getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'issue_comment', 'defaultValue': '0' }),
        getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'open_issue', 'defaultValue': '0' }),
        getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'open_pull', 'defaultValue': '0' }),
        getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'review_comment', 'defaultValue': '0' }),
        getGroupArrayInsertAtClauseForClickhouse(config, { 'key': 'merged_pull', 'defaultValue': '0' })
        ) + \
"SELECT \
    {}, \
    {}, \
    ROUND(SUM(activity), 2) AS activity, \
    SUM(issue_comment) AS issue_comment, \
    SUM(open_issue) AS open_issue, \
    SUM(open_pull) AS open_pull, \
    SUM(review_comment) AS review_comment, \
    SUM(merged_pull) AS merged_pull \
FROM \
(".format(getGroupTimeClauseForClickhouse(config, 'month'), getGroupIdClauseForClickhouse(config, 'actor', 'month')) + \
    "SELECT \
    toStartOfMonth(created_at) AS month, \
    repo_id, \
    if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_id, actor_id) AS actor_id, \
    argMax(if(type='PullRequestEvent' AND action='closed' AND pull_merged=1, issue_author_login, actor_login), created_at) AS actor_login, \
    countIf(type='IssueCommentEvent' AND action='created') AS issue_comment, \
    countIf(type='IssuesEvent' AND action='opened')  AS open_issue, \
    countIf(type='PullRequestEvent' AND action='opened') AS open_pull, \
    countIf(type='PullRequestReviewCommentEvent' AND action='created') AS review_comment, \
    countIf(type='PullRequestEvent' AND action='closed' AND pull_merged=1) AS merged_pull, \
    sqrt({}*issue_comment + {}*open_issue + {}*open_pull + {}*review_comment + {}*merged_pull) AS activity \
    FROM opensource.gh_events \
    WHERE {} \
    GROUP BY repo_id, actor_id, month \
    HAVING activity > 0 {} \
) \
GROUP BY id, time \
{} \
) \
GROUP BY id \
ORDER BY activity[-1] {} \
FORMAT JSONCompact".format(Index.ISSUE_COMMENT_WEIGHT, Index.OPEN_ISSUE_WEIGHT, Index.OPEN_PULL_WEIGHT, Index.REVIEW_COMMENT_WEIGHT, Index.PULL_MERGED_WEIGHT,
                        ' AND '.join(whereClauses), '' if withBot else 'AND actor_login NOT LIKE \'%[bot]\'',
                        'ORDER BY activity DESC LIMIT {} BY time'.format(config.get('limit')) if config.get('limit') > 0 else '',
                        config.get('order'))

    result = clickhouse.query(sql)
    def return_row(row):
        id, name, activity, issue_comment, open_issue, open_pull, review_comment, merged_pull = row
        return {
        'id':id,
        'name':name,
        'activity':activity,
        'issue_comment':issue_comment,
        'open_issue':open_issue,
        'open_pull':open_pull,
        'review_comment':review_comment,
        'merged_pull':merged_pull,
        }
    return list(map(return_row, result))

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
    FORMAT JSONCompact'.format(getGroupTimeClauseForClickhouse(config), getGroupIdClauseForClickhouse(config), ' AND '.join(whereClauses), 
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
