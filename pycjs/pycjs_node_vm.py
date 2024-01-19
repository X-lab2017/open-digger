#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Python 3.9

# @Time   : 2024/1/14 10:26
# @Author : 'Lou Zehua'
# @File   : pycjs_node_vm.py

import re

import node_vm2
import pandas as pd

from node_vm2 import NodeVM


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


class NodeVMFuncGen(object):
    def __init__(self, func_name='_', vm_rt=None, *args, **kwargs):
        self.func_name = func_name
        self.vm_rt = vm_rt
        self.args = args
        self.kwargs = kwargs
        self.func = self.func_impl
        return

    def func_impl(self, *args, **kwargs):
        kwargs = kwargs or self.kwargs
        vm_rt = kwargs.pop("vm_rt", None) or self.vm_rt
        res = vm_rt.call_member(self.func_name, *args, **kwargs)
        return res


vm_option = {
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


def apply_export_template(var_str, module_index_str):
    return f"exports.{var_str} = {module_index_str};"


def formTree(path_nodes_list, leaf_node_list):
    tree_root = {}
    for path_nodes, leaf_node in zip(path_nodes_list, leaf_node_list):
        curr_tree = tree_root
        for i, key_node in enumerate(path_nodes):
            if i >= len(path_nodes) - 1:
                curr_tree[key_node] = leaf_node
                break
            if key_node not in curr_tree:
                curr_tree[key_node] = {}
            curr_tree = curr_tree[key_node]
    return tree_root


def get_export_module(vm, js_code, module_name="", repl_var_func_dict=None, show_indexes=False, df_options=None):
    repl_var_func_dict = repl_var_func_dict or {}
    df_options = df_options or {}
    if not module_name:
        require_module_vars = re.findall(r"([_a-zA-Z][_0-9a-zA-Z]*)\s*=\s*require\(.+\);", js_code)
        if len(require_module_vars):
            module_name = require_module_vars[0]

    if not module_name:
        return None

    js_export_indexes = """
    function getObjElemIndex(obj, parent_path, res) {
        for (let key in obj) {
            child_path = parent_path + `.${key}`;
            if (typeof obj[key] === 'object') {
                getObjElemIndex(obj[key], child_path, res); // 递归调用自身处理子对象
            } else {
                res.push(child_path);
            }
        }
    }
    """
    js_export_indexes += f"""
    var exportIndexes = [];
    getObjElemIndex({module_name}, '{module_name}', exportIndexes);
    exports.exportIndexes = exportIndexes;
    """

    js_code += js_export_indexes
    vm_rt = vm.run(js_code)
    export_indexes = vm_rt.get_member("exportIndexes")
    js_index_delimeter = '.'
    js_var_delimeter = '_'
    export_vars = [s.replace(js_index_delimeter, js_var_delimeter) for s in export_indexes]

    if show_indexes:
        df_export_module = pd.DataFrame({"export_vars": export_vars, "export_indexes": export_indexes})
        pd.set_option('display.max_colwidth', df_options.get("max_colwidth", 60))
        columns = df_options.get("columns", df_export_module.columns)
        rows = df_options.get("rows", [True]*df_export_module.shape[0])
        apply_op = df_options.get("apply_func", {"func": lambda x: x})
        print(df_export_module[columns].loc[rows].apply(**apply_op))

    # js export template: "exports.openDigger_label_getLabelData = openDigger.label.getLabelData;"
    exports_statements = list(map(apply_export_template, export_vars, export_indexes))
    exports_extend_str = '\n'.join(exports_statements)
    js_open_digger_exports_extended = js_code + exports_extend_str
    vm_rt = vm.run(js_open_digger_exports_extended)

    # use path split from export_indexes by js_index_delimeter to prevent the inconsistent_search_tree exceptions
    #   between the recovered module path of function and the raw module path of function
    #   when there is any js_var_delimeter within the raw module path names or within th raw function names
    export_indexes_split = [str(s).split(js_index_delimeter) for s in export_indexes]
    repl_indexes_split = [str(s).split(js_index_delimeter) for s in repl_var_func_dict.keys()]
    final_export_indexes_split = export_indexes_split.copy()
    # Initialize vm_rt in the constructor
    func_leaf_list = [NodeVMFuncGen(var_str, vm_rt=vm_rt).func for var_str in export_vars]

    # replace functions related to Plotly in the ijavascript-plotly module \
    #   and other functions using global elements like '$$' or using functions as formal parameters,
    #   which are not JSON serializable types or cannot be executed by vm sandbox.
    export_var_func_bound = dict(zip(export_vars, func_leaf_list))
    if len(repl_var_func_dict):
        repl_var_func_bound = {k.replace(js_index_delimeter, js_var_delimeter): v for k, v in repl_var_func_dict.items()}
    else:
        repl_var_func_bound = repl_var_func_dict
    final_var_func_bound = export_var_func_bound.copy()
    assert(len(export_var_func_bound) == len(export_indexes_split))
    assert(len(repl_var_func_bound) == len(repl_indexes_split))

    # merge the variable function bound dict
    func_impl_only_py = []
    for i in range(len(repl_var_func_bound)):
        k_repl_var = list(repl_var_func_bound.keys())[i]
        v_repl_func = list(repl_var_func_bound.values())[i]
        i_repl_indexes_split = repl_indexes_split[i]
        if k_repl_var not in final_var_func_bound.keys():  # update final_export_indexes_split for new python functions
            final_export_indexes_split.append(i_repl_indexes_split)
            final_var_func_bound[k_repl_var] = v_repl_func
            func_impl_only_py.append(js_index_delimeter.join(i_repl_indexes_split))
        else:  # use the replacement implemented in python of js functions
            final_var_func_bound[k_repl_var] = v_repl_func
    assert(list(final_var_func_bound.keys()) == [js_var_delimeter.join(s) for s in final_export_indexes_split])
    if len(func_impl_only_py):
        print(f"Warning: Use function only implemented in python: {func_impl_only_py}!")

    final_func_leaf_list = list(final_var_func_bound.values())
    export_dict = formTree(final_export_indexes_split, final_func_leaf_list)
    export_module = Obj(export_dict)
    return export_module


if __name__ == '__main__':
    from datetime import datetime

    js = """
    var os = require('os');
    exports.test = () => {
       return new Promise(resolve => {
          setTimeout(() => {
             resolve("hello")
          }, 3000);
       });
    };
    exports.greet = name => console.log(`Hello ${name}!`);
    """

    vm_option = {
        # 'console': 'inherit',
        # "wrapper": 'commonjs',
        # 'sandbox': {},
        'require': {
            'external': '../lib',
            'builtin': ['os'],
            # 'import': ["ijavascript-plotly"],
            'root': '../',
            # 'mock': { }
        }
    }

    with NodeVM(**vm_option) as vm:
        try:
            # set show_indexes=True to display functions in the export module.
            pd.set_option('display.max_rows', None)
            df_options = {
                "max_colwidth": 60,
                "rows": range(40),
                "columns": ["export_vars", "export_indexes"],
                # "apply_func": {"func": lambda x: sum([len(x_elem) for x_elem in x]) < 25, "axis": 1}
            }
            export_module = get_export_module(vm, js, show_indexes=True, df_options=df_options)
            print(export_module)
            os = export_module.os
            print(os.hostname())
        except node_vm2.VMError as e:
            print(str(e))

        vm_rt = vm.run(js)
        test = NodeVMFuncGen("test", vm_rt=vm_rt).func
        greet = NodeVMFuncGen("greet", vm_rt=vm_rt).func

        print(datetime.now())
        print(test())
        print(datetime.now())
        greet("John")
