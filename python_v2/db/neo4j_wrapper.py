from py2neo import Graph
from easydict import EasyDict
from config import getConfig

class Neo4jWrapper(object):
    def __init__(self):
        if not hasattr(Neo4jWrapper, "__first_init"):
            neo4j_config = EasyDict(getConfig()).db.neo4j
            try:
                self.driver = Graph(neo4j_config.host, auth=(neo4j_config.user, neo4j_config.password))
                self.__first_init = True
            except Exception as e:
                print(e)
                print("NEO4J INIT ERROR!")
            
    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, "__instance" ):
            cls.__instance = super(Neo4jWrapper, cls).__new__(cls)
        return cls.__instance

    def query(self, query_sql):
        result = self.driver.run(query_sql) # return a cursor object
        return result.data()
