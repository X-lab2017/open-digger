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
