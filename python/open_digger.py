from metrics import index as func
import label_data_utils as label
from functools import cmp_to_key
import db.neo4j_driver as neo4j_driver
import db.clickhouse as clickhouse
import plotly.graph_objs as go
from plotly.subplots import make_subplots

class openDigger(object):
    def __init__(self):
        self.label = label
        self.render = go
    class driver():
        def __init__(self):
          self.clickhouse = clickhouse
          self.neo4j = neo4j_driver
    class quick():
        def showAll(self, repoName, startYear = 2015, endYear = 2021):
            config = { 'repoNames': [repoName], 'startYear': startYear, 'endYear': endYear, 'groupTimeRange': 'month' }
            activity = func.getRepoActivity(config)
            openrank = func.getRepoOpenrank(config)
            for year in range(startYear, endYear + 1):
                for month in range(1, 13):
                    k = '{}{}'.format(year, month)
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(
                openDigger().render.Scatter(
                    y = activity[0].get('activity'),
                    mode="markers+lines",
                    name='activity'
            ))
            fig.add_trace(
                openDigger().render.Scatter(
                    y = openrank[0].get('open_rank'),
                    mode="markers+lines",
                    name='openrank'
            ), secondary_y=True)
            fig.update_layout(
                title="Activity/OpenRank for {} from {} to {}".format(repoName, startYear, endYear),
            )
            fig.show()
    def getRank(self, values, nameGetter, valueGetter):
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
            def getRepoActivity(self, config): return func.getRepoActivity(config)
            def getUserActivity(self, config): return func.getUserActivity(config)
        class openrank():
            def getRepoOpenrank(self, config): return func.getRepoOpenrank(config)
            def getUserOpenrank(self, config): return func.getUserOpenrank(config)
        class attention():
            def getAttention(self, config): return func.getAttention(config)

    class metric():
        class chaoss():
            def codeChangeCommits(self, config): return func.chaossCodeChangeCommits(config)
            def issuesNew(self, config): return func.chaossIssuesNew(config)
            def issuesClosed(self,config): return func.chaossIssuesClosed(config)
            def busFactor(self,config): return func.chaossBusFactor(config)
            def changeRequestsAccepted(self,config): return func.chaossChangeRequestsAccepted(config)
            def changeRequestsDeclined(self,config): return func.chaossChangeRequestsDeclined(config)
            def issueResolutionDuration(self,config): return func.chaossIssueResolutionDuration(config)
    class relation():
        def getRelatedUsers(config): return func.getRelatedUsers(config)
