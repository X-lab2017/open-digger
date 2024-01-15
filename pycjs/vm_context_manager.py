#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Python 3.9

# @Time   : 2024/1/15 21:49
# @Author : 'Lou Zehua'
# @File   : vm_context_manager.py

from node_vm2 import NodeVM


class VMContext(object):

    def __init__(self, *args, **kwargs):
        self.vm = NodeVM(*args, **kwargs)  # This VM class can be any class with its context manager.

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self.vm.__exit__(exc_type, exc_val, exc_tb)

    def open(self):
        return self.vm.__enter__()

    def close(self):
        return self.destroy()

    def destroy(self):
        return self.vm.destroy()  # return self.vm.__exit__(None, None, None) if exit func is not exist in the VM class.


if __name__ == '__main__':
    year = 2023
    startMonth = 1
    endMonth = 12
    options = {
        "startYear": year,
        "endYear": year,
        "startMonth": startMonth,
        "endMonth": endMonth,
        "limit": 2
    }
    js_import_open_digger = """
    var openDigger = require('../src/open_digger.js');
    """

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

    from pycjs.pycjs_node_vm import get_export_module

    # Context Manager for 'with' syntax of python code in py files
    with VMContext(**vm_option_open_digger).open() as vm:
        # set show_indexes=True to display functions in the export module.
        export_module = get_export_module(vm, js_import_open_digger, show_indexes=False)
        openDigger = export_module.openDigger
        print(openDigger.index.openrank.getRepoOpenrank(options))

    # Contex Manager for python codes with checkpoints in ipynb cells
    vmc = VMContext(**vm_option_open_digger)
    vmc.open()
    vm = vmc.vm
    export_module = get_export_module(vm, js_import_open_digger, show_indexes=False)
    openDigger = export_module.openDigger
    print(openDigger.index.openrank.getRepoOpenrank(options))
    vmc.close()
