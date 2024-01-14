#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Python 3.9

# @Time   : 2024/1/14 10:26
# @Author : 'Lou Zehua'
# @File   : pycjs_node_vm.py

import copy
import pandas as pd

from node_vm2 import NodeVM

from pycjs.pycjs_node_vm import get_export_module


vm_option_open_digger = {
    # 'console': 'inherit',
    # "wrapper": 'commonjs',
    # 'sandbox': {},
    'require': {
        'external': '../lib',
        # 'builtin': ['os'],
        # 'import': ["ijavascript-plotly"],
        'root': '../',
        # 'mock': { }
    }
}

js_import_open_digger = """
var openDigger = require('../src/open_digger.js');
"""

if __name__ == '__main__':
    year = 2023
    startMonth = 1
    endMonth = 12
    baseOptions = {
       "startYear": year,
       "endYear": year,
       "startMonth": startMonth,
       "endMonth": endMonth,
       "groupTimeRange": 'year',
       "order": 'DESC'
    }

    localOptions = {
       "labelUnion": [':technology/database'],
       "limit": 10
    }

    options = copy.deepcopy(baseOptions)
    options.update(localOptions)

    with NodeVM(**vm_option_open_digger) as vm:
        # set show_indexes=True to display functions in the export module.
        export_module = get_export_module(vm, js_import_open_digger, show_indexes=True, max_colwidth=60)
        openDigger = export_module.openDigger
        data_repo_openrank = openDigger.index.openrank.getRepoOpenrank(options)
        print(pd.DataFrame(list(data_repo_openrank)))
