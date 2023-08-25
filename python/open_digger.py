import label_data_utils as label
from functools import cmp_to_key
import metrics
from db.clickhouse_wrapper import ClickhouseWrapper
from db.neo4j_wrapper import Neo4jWrapper
import plotly.graph_objs as go
from plotly.subplots import make_subplots

class openDigger(object):
    def __init__(self):
        self.label = label
        self.render = go
        self.metric = metrics.Metric()
        self.clickhouse = ClickhouseWrapper()
        self.neo4j = Neo4jWrapper()

    class quick():
        @classmethod
        def showAll(self, repoName, startYear = 2015, endYear = 2021):
            config = { 'repoNames': [repoName], 'startYear': startYear, 'endYear': endYear, 'groupTimeRange': 'month' }
            activity = self.index.getRepoActivity(config)
            openrank = self.index.getRepoOpenrank(config)
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
    