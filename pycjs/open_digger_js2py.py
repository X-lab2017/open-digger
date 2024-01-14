import js2py
import os
import re


# def path_format(matched):
#     return ''.join(list(map(lambda s: str(s).replace('\\', '/'), str(matched.group()))))
#
# cur_dir = os.path.abspath('.').replace('\\', '/')
# local_lib = cur_dir
# a = js2py.require('./node_modules/add_numbers1', update=True)
# a = js2py.require('./node_modules/add_numbers1', update=True, local_lib=local_lib)
# a = js2py.require(os.path.join(local_lib, 'node_modules/add_numbers1').replace('\\', '/'), update=True)
# print(a(2, 3))
#
# # js2py.require('./node_modules/index')
# js_path = './node_modules/index.js'
# js_abs_path = os.path.join(cur_dir, js_path).replace('\\', '/')
# local_lib = os.path.dirname(js_abs_path)
# with open(js_path, 'r', encoding='utf-8') as f:
#    js_index = f.read()
# js_index = re.sub("require\(.+\)", path_format, js_index)
# js_index = js_index.replace('../', os.path.dirname(local_lib) + '/').replace('./', local_lib + '/')
# context = js2py.EvalJs(enable_require=True)
# context.execute(js_index)
# f_add_index = context.eval("addNumbers")
# print('addNumber: %s, var s: %s' % (f_add_index(2, 3), context.s))


def path_format(matched):
    return ''.join(list(map(lambda s: str(s).replace('\\', '/'), str(matched.group()))))


cur_dir = os.path.abspath('.').replace('\\', '/')
js_path = '../src/open_digger.js'
js_abs_path = os.path.abspath(js_path).replace('\\', '/')
local_lib = os.path.dirname(js_abs_path)
with open(js_abs_path, 'r', encoding='utf-8') as f:
   js_open_digger = f.read()
js_open_digger = re.sub("require\(.+\)", path_format, js_open_digger)
js_open_digger = js_open_digger.replace('../', os.path.dirname(local_lib) + '/').replace('./', local_lib + '/')
context = js2py.EvalJs(enable_require=True)
context.execute(js_open_digger)
openDigger = context.openDigger


if __name__ == '__main__':
   # https://github.com/PiotrDabkowski/Js2Py/issues/125#issuecomment-1880148120
   print(openDigger.index)
   print(openDigger.metric.chaoss)
   print(openDigger.index.activity.getRepoActivity)

   year = 2022
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
   options_temp = {}
   options = {}
   options_temp.update(options)
   options_temp.update(baseOptions)
   options = options_temp
   openrank = openDigger.index.openrank.getRepoOpenrank(options)

   import pandas as pd
   print(pd.DataFrame(list(openrank)))
   print(openDigger.index.activity.getRepoActivity(options))
