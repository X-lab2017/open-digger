#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Python 3.9

# @Time   : 2024/1/17 16:29
# @Author : 'Lou Zehua'
# @File   : metrics.py
from __future__ import annotations

import IPython
import pandas as pd


class MultiMime:

    def __init__(self, **kwargs):
        self.__dict__.update(**kwargs)
        self.mime = IPython.display.display

    def __repr__(self):
        return "this is the repr"

    def _repr_html_(self):
        return "this <b>is</b> html"

    def _repr_markdown_(self):
        return "this **is** markdown"

    def _repr_latex_(self):
        return "$ Latex \otimes mimetype $"


def plotly(data, layout, doc_elem):
    # print(type(doc_elem))
    doc_elem.mime({
        "application/vnd.plotly.v1+json": {
            "data": data,
            "layout": layout,
        },
    }, raw=True)


def getRank(values: list[dict[str | list]] | pd.DataFrame, nameGetter, valueGetter):
    resultMap = {}
    for v in values:
        resultMap[nameGetter(v)] = []
    valueLength = len(valueGetter(values[0]))
    for i in range(valueLength):
        values_batch_order = sorted(values, key=lambda x: valueGetter(x)[i], reverse=True)
        for index, v in enumerate(values_batch_order):
            resultMap.get(nameGetter(v)).append(None if valueGetter(v)[i] == 0 else index + 1)
    return list(map(lambda it: {'name': it[0], 'values': it[1]}, resultMap.items()))


def showAll(openDigger: object, repoName: str, startYear: int = 2015, endYear: int = 2023,
            db_type: str = "clickhouse", baseOptions: dict | None = None):
    db_type = db_type.lower()
    values = [
        {"x": [], "y": [], "mode": 'scatter', "name": 'activity'},
        {"x": [], "y": [], "mode": 'scatter', "name": 'openrank'}
    ]

    if db_type == "clickhouse":
        baseOptions = baseOptions or {
            "startYear": startYear,
            "endYear": endYear,
            "groupTimeRange": "month",
            "limit": 1
        }
        baseOptions = dict(baseOptions)
        # limit < 128 see https://github.com/ClickHouse/ClickHouse/issues/54053
        temp_config = {"repoNames": [repoName]}
        baseOptions.update(temp_config)
        config = baseOptions
        startYear = config["startYear"]
        endYear = config["endYear"]

        repos_activity = openDigger.index.activity.getRepoActivity(config)
        repos_openrank = openDigger.index.openrank.getRepoOpenrank(config)

        for year in range(startYear, endYear + 1):
            for month in range(1, 13):
                x = f"{year}-{month}"
                k = (year - startYear) * 12 + (month - 1) * 1
                values[0]["x"].append(x)
                values[1]["x"].append(x)
                values[0]["y"].append(repos_activity[0]["activity"][k])
                values[1]["y"].append(repos_openrank[0]["openrank"][k])

    elif db_type == "neo4j":
        data = openDigger.driver.neo4j.query(f"MATCH (r:Repo{{name:'{repoName}'}}) RETURN r;")

        for year in range(startYear, endYear + 1):
            for month in range(1, 13):
                x = f"{year}-{month}"
                k = f"{year}{month}"
                values[0]["x"].append(x)
                values[1]["x"].append(x)
                values[0]["y"].append(data[0][f"activity_{k}"])
                values[1]["y"].append(data[0][f"open_rank_{k}"])
    else:
        raise ValueError(f"The db_type must be in ['clickhouse', 'neo4j'], the '{db_type}' is not supported yet.")

    openDigger.render.plotly(values, {"title": f"Activity/OpenRank for {repoName} from {startYear} to {endYear}"}, MultiMime())
