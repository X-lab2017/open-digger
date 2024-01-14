import copy
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


def get_export_module(vm, js_code, **kwargs):
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
    var exportIndexes = [];
    getObjElemIndex(openDigger, 'openDigger', exportIndexes);
    exports.exportIndexes = exportIndexes;
    """
    js_code += js_export_indexes
    vm_rt = vm.run(js_code)
    export_indexes = vm_rt.get_member("exportIndexes")
    export_vars = [s.replace('.', '_') for s in export_indexes]

    if kwargs.get("show_indexes", False):
        df_export_module = pd.DataFrame({"export_vars": export_vars, "export_indexes": export_indexes})
        pd.set_option('display.max_colwidth', kwargs.get("max_colwidth", 60))
        print(df_export_module)

    # js export template: "exports.openDigger_label_getLabelData = openDigger.label.getLabelData;"
    exports_statements = list(map(apply_export_template, export_vars, export_indexes))
    exports_extend_str = '\n'.join(exports_statements)
    js_open_digger_exports_extended = js_code + exports_extend_str
    vm_rt = vm.run(js_open_digger_exports_extended)

    export_indexes_split = [str(s).split('.') for s in export_indexes]
    # Initialize vm_rt in the constructor
    func_leaf_list = [NodeVMFuncGen(var_str, vm_rt=vm_rt).func for var_str in export_vars]
    export_dict = formTree(export_indexes_split, func_leaf_list)
    export_module = Obj(export_dict)
    return export_module


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

    js_import_open_digger = """
    var openDigger = require('../src/open_digger.js');
    """

    with NodeVM(**vm_option) as vm:
        # set show_indexes=True to display functions in the export module.
        export_module = get_export_module(vm, js_import_open_digger, show_indexes=True, max_colwidth=60)
        openDigger = export_module.openDigger
        data_repo_openrank = openDigger.index.openrank.getRepoOpenrank(options)
        print(pd.DataFrame(list(data_repo_openrank)))
