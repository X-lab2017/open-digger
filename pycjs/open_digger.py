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
from pycjs.metrics import plotly, getRank, showAll, MultiMime

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


repl_var_func_dict_open_digger = {
    "openDigger.render.plotly": plotly,
    "openDigger.getRank": getRank,
    "openDigger.quick.showAll": showAll,
}


def get_export_module_open_digger(vm, js_code=None, module_name="", repl_var_func_dict=None, var_dot2underscore=True,
                                 show_indexes=False, df_options=None):
    js_code = js_code or js_import_open_digger
    module_name = module_name or "openDigger"
    repl_var_func_dict = repl_var_func_dict or repl_var_func_dict_open_digger
    return get_export_module(vm, js_code, module_name=module_name, repl_var_func_dict=repl_var_func_dict,
                             var_dot2underscore=var_dot2underscore, show_indexes=show_indexes, df_options=df_options)


year = 2023
startYear = 2015
endYear = year
startMonth = 1
endMonth = 12
baseOptions = {
   "startYear": startYear,
   "endYear": endYear,
   "startMonth": startMonth,
   "endMonth": endMonth,
   "groupTimeRange": 'year',
   "order": 'DESC'
}


if __name__ == '__main__':
    localOptions = {
       "labelUnion": [':technology/database'],
       "limit": 10
    }

    options = copy.deepcopy(baseOptions)
    options.update(localOptions)

    # use context manager 'with'
    with NodeVM(**vm_option_open_digger) as vm:
        # set show_indexes=True to display functions in the export module.
        df_options = {"max_colwidth": 60}
        get_export_module_open_digger(vm, js_import_open_digger, show_indexes=True, df_options=df_options)

    # use vm_context_manager as a manual context manager
    from pycjs.vm_context_manager import VMContext

    vmc = VMContext(**vm_option_open_digger)
    vmc.open()
    vm = vmc.vm
    export_module = get_export_module_open_digger(vm)
    openDigger = export_module.openDigger

    data_repo_openrank = openDigger.index.openrank.getRepoOpenrank(options)
    print(pd.DataFrame(list(data_repo_openrank)))

    openDigger.render.plotly([
        {'x': [2019, 2020, 2021, 2022, 2023], 'y': [5850.92, 7653.21, 7738.96, 7880.61, 7601.04], 'name': 'elastic/kibana'},
        {'x': [2019, 2020, 2021, 2022, 2023], 'y': [3362.24, 4710.99, 5500.94, 6195.07, 7134.37], 'name': 'grafana/grafana'}
    ],
        {"title": f"Top 2 OpenRank repositories of 'Big Data' 2019-2023"},
        MultiMime()
    )

    baseOptions = {
            "labelUnion": [':technology/database'],
            "startYear": 2019, "endYear": 2023, "startMonth": 1, "endMonth": 12,
            "groupTimeRange": 'month', "limit": 1
        }
    openDigger.quick.showAll(openDigger,  repoName="apache/spark", baseOptions=baseOptions)

    vmc.close()
