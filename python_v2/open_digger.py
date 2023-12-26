import label_data_utils as label
from functools import cmp_to_key
from metrics import index as func
# import metrics
from db.clickhouse_wrapper import ClickhouseWrapper
from db.neo4j_wrapper import Neo4jWrapper
# import plotly.graph_objs as go
from plotly.subplots import make_subplots
import pandas as pd
import matplotlib.pyplot as plt

class Obj(object):
    def __init__(self, d):
        for k, v in d.items():
            if isinstance(v, (list, tuple)):
                setattr(self, k, [Obj(x) if isinstance(x, dict) else x for x in v])
            else:
                setattr(self, k, Obj(v) if isinstance(v, dict) else v)

            getattr(self, k)

    def __getattr__(self, name):
        try:
            return self.__getattribute__(name)
        except AttributeError as e:
            msg = str(e) + f" for {self}!"
            raise AttributeError(msg)

neo4j = Neo4jWrapper()
clickhouse = ClickhouseWrapper()

def plotly(df, **kwargs):
    df = pd.DataFrame(df)
    df_series_plot = pd.DataFrame()
    df_series_groups = df.groupby("name")
    for name, df_v in df_series_groups:
        df_series_plot[name] = pd.Series(df_v["y"], index=df_v["x"])
    df_series_plot.plot(**kwargs)

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

def showAll(repoName, startYear = 2015, endYear = 2021):
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

dict_openDigger = {
    "label": label,
    "render": {
        "plotly": plotly,
    },
    "driver": {
        "neo4j": neo4j,
        "clickhouse": clickhouse,
    },
    "index": {
        "activity": {
            "getRepoActivity": func.getRepoActivity,
            "getUserActivity": func.getUserActivity,
            # "getRepoActivityWithDetail": func.getRepoActivityWithDetail,  # todo
            # "getUserActivityWithDetail": func.getUserActivityWithDetail,  # todo
        },
        "openrank": {
            "getRepoOpenrank": func.getRepoOpenrank,
            "getUserOpenrank": func.getUserOpenrank,
        },
        "attention": {
            "getAttention": func.getAttention,
        }
    },
    "metric": {
        "chaoss": {
            "codeChangeCommits": func.chaossCodeChangeCommits,
            "issuesNew": func.chaossIssuesNew,
            # "issuesAndChangeRequestActive": func.chaossIssuesAndChangeRequestActive,  # todo
            "issuesClosed": func.chaossIssuesClosed,
            "busFactor": func.chaossBusFactor,
            "changeRequestsAccepted": func.chaossChangeRequestsAccepted,
            "changeRequestsDeclined": func.chaossChangeRequestsDeclined,
            "issueResolutionDuration": func.chaossIssueResolutionDuration,
            "changeRequestResolutionDuration": func.chaossChangeRequestResolutionDuration,
            # "codeChangeLines": func.chaossCodeChangeLines,  # todo
            "newContributors": func.chaossNewContributors,
            # "changeRequestsDuration": func.chaossChangeRequestsDuration,  # todo
            "issueResponseTime": func.chaossIssueResponseTime,
            "changeRequestResponseTime": func.chaossChangeRequestResponseTime,
            # "technicalFork": func.chaossTechnicalFork,  # todo
            'changeRequestsAcceptanceRatio': func.chaossChangeRequestsAcceptanceRatio,
            "repoActiveDatesAndTimes": func.chaossRepoActiveDatesAndTimes,
            "userActiveDatesAndTimes": func.chaossUserActiveDatesAndTimes,
            "issueAge": func.chaossIssueAge,
            "changeRequestAge": func.chaossChangeRequestAge,
            "inactiveContributors": func.chaossInactiveContributors,
        },
        "xlab": {  # todo
            # "repoStars": func.repoStars,
            # "repoParticipants": func.repoParticipants,
            # "userEquivalentTimeZone": func.userEquivalentTimeZone,
            # "contributorEmailSuffixes": func.contributorEmailSuffixes,
      },
    },
    "getRank": getRank,
    "quick": {
      "showAll": showAll
    }
}

openDigger = Obj(dict_openDigger)


# class openDigger(object):
#     def __init__(self):
#         self.label = label
#         self.render = go
#         self.metric = metrics.Metric()
#         self.clickhouse = ClickhouseWrapper()
#         self.neo4j = Neo4jWrapper()

#     class quick():
#         @classmethod
#         def showAll(repoName, startYear = 2015, endYear = 2021):
#             config = { 'repoNames': [repoName], 'startYear': startYear, 'endYear': endYear, 'groupTimeRange': 'month' }
#             activity = index.getRepoActivity(config)
#             openrank = index.getRepoOpenrank(config)
#             for year in range(startYear, endYear + 1):
#                 for month in range(1, 13):
#                     k = '{}{}'.format(year, month)
#             fig = make_subplots(specs=[[{"secondary_y": True}]])
#             fig.add_trace(
#                 openDigger().render.Scatter(
#                     y = activity[0].get('activity'),
#                     mode="markers+lines",
#                     name='activity'
#             ))
#             fig.add_trace(
#                 openDigger().render.Scatter(
#                     y = openrank[0].get('open_rank'),
#                     mode="markers+lines",
#                     name='openrank'
#             ), secondary_y=True)
#             fig.update_layout(
#                 title="Activity/OpenRank for {} from {} to {}".format(repoName, startYear, endYear),
#             )
#             fig.show()

#     def getRank(self, values, nameGetter, valueGetter):
#         resultMap = {}
#         for v in values:
#             resultMap[nameGetter(v)] = []
#         valueLength = len(valueGetter(values[0]))
#         for i in range(valueLength):
#             values.sort(key = cmp_to_key(lambda a, b: valueGetter(b)[i] - valueGetter(a)[i]))
#             for index, v in enumerate(values):
#                 resultMap.get(nameGetter(v)).append(None if valueGetter(v)[i] == 0 else index + 1)
#         return list(map(lambda e: {'name': e[0], 'values': e[1],}, resultMap.items()))
