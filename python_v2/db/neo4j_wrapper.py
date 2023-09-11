from py2neo import Graph
from easydict import EasyDict
from config import getConfig

class Neo4jWrapper(object):
    def __init__(self):
        neo4j_config = EasyDict(getConfig()).db.neo4j
        # self.driver = Graph(neo4j_config.host)
        try:
            self.driver = Graph(neo4j_config.host)
        except Exception as e:
            print(e)
            print("NEO4J INIT ERROR")
            
    def __new__(cls, *args, **kwargs):

        if not hasattr(Neo4jWrapper, "_instance" ):
            Neo4jWrapper._instance = object.__new__(cls)
        return Neo4jWrapper._instance

    def query(self, query_sql):
        result = self.driver.run(query_sql) # return a cursor object
        return result.data()
