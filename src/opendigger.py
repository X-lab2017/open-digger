from metrics import index as func
import label_data_utils as label
from functools import cmp_to_key
import db.neo4j_driver as neo4j_driver
import db.clickhouse as clickhouse
import plotly

class openDigger(object):
    def __init__(self):
        self.label = label
        self.render = plotly

    class driver():
        def __init__(self):
          self.clickhouse = clickhouse
          self.neo4j = neo4j_driver
    class quick():
        def showAll(self, repoName, startYear = 2015, endYear = 2021):
            query_sql = "MATCH (r:Repo{name: '%s"%(repoName)+"'}) RETURN r"
            # query_sql = "MATCH (r:Repo) RETURN r"
            data = openDigger.driver().neo4j.query(query_sql)
            print(data.keys())
            values = [
                {'y': [], 'mode': 'scatter', 'name': 'activity'},
                {'y': [], 'mode': 'scatter', 'name': 'openrank'}]
            for year in range(startYear, endYear + 1):
                for month in range(1, 13):
                    k = str(year)+str(month)
                    values[0]['y'].append(data[0]['activity_' + k])
                    values[1]['y'].append(data[0]['open_rank_' + k])
            openDigger.render.plotly(values, {'title': "Activity/OpenRank for {} from {} to {}".format(repoName, startYear, endYear)});
    def getRank(values, nameGetter, valueGetter):
        resultMap = {}
        for v in values:
            resultMap[nameGetter(v)] = []
        valueLength = len(valueGetter(values[0]))
        for i in range(valueLength):
            values.sort(key = cmp_to_key(lambda a, b: valueGetter(b)[i] - valueGetter(a)[i]))
            for index, v in enumerate(values):
                resultMap.get(nameGetter(v)).append(None if valueGetter(v)[i] == 0 else index + 1)
        return list(map(lambda e: {'name': e[0], 'values': e[1],}, resultMap.items()))

    class index():
        class activity():
            def getRepoActivity(config): return func.getRepoActivity(config)
            def getUserActivity(config): return func.getUserActivity(config)
            def getRepoActivityWithDetail(config): return func.getRepoActivityWithDetail(config)
            def getUserActivityWithDetail(config): return func.getUserActivityWithDetail(config)
        class openrank():
            def getRepoOpenrank(config): return func.getRepoOpenrank(config)
            def getUserOpenrank(config): return func.getUserOpenrank(config)
        class attention():
            def getAttention(self,config): return func.getAttention(config)

    class metric():
        class chaoss():
            def codeChangeCommits(self, config): return func.chaossCodeChangeCommits(config)
            def issuesNew(self, config): return func.chaossIssuesNew(config)
            def issuesClosed(self,config): return func.chaossIssuesClosed(config)
            def busFactor(self,config): return func.chaossBusFactor(config)
            def changeRequestsAccepted(self,config): return func.chaossChangeRequestsAccepted(config)
            def changeRequestsDeclined(self,config): return func.chaossChangeRequestsDeclined(config)
            def chaossIssueResolutionDuration(self,config): return func.chaossIssueResolutionDuration(config)
    class relation():
        def getRelatedUsers(config): return func.getRelatedUsers(config)
