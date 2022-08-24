from py2neo import Node, Relationship, Graph
# import parser = require('parse-neo4j');
import sys
import os
from easydict import EasyDict
sys.path.append(os.getcwd())
from src.config import getConfig

_driver = None

def getClient():
    global _driver
    if _driver == None:
        neo4j_config = EasyDict(EasyDict(getConfig()).db.neo4j)
        _driver = Graph(neo4j_config.host)
    return _driver
      
def query(query_sql):
    print(query_sql)
    result = getClient().run(query_sql) #返回的结果是一个cursor对象
    return result

# export function parseRecord<T = any>(record: any): T {
#   return parser.parseRecord(record)._fields[0];
# }
# resultaa = query("MATCH (r:Repo{name: 'pingcap/tidb'}) RETURN r")
# print(resultaa)