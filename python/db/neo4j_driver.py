from py2neo import Graph
from easydict import EasyDict
from config import getConfig

_driver = None

def getClient():
    global _driver
    if _driver == None:
        neo4j_config = EasyDict(getConfig()).db.neo4j
        _driver = Graph(neo4j_config.host)
    return _driver

def query(query_sql):
    result = getClient().run(query_sql) # return a cursor object
    return result.data()  # transform cursor to list
