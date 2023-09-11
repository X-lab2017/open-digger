from easydict import EasyDict
from config import getConfig
from clickhouse_driver import Client

class ClickhouseWrapper(object):
    def __init__(self):
        if not hasattr(ClickhouseWrapper, "_first_init"):
            config = EasyDict(getConfig()).db.clickhouse
            try:
                self.client = Client(config.host, config.port, config.database, config.user, config.password)
            except :
                print("CLICKHOUSE INIT FAILED")
    def __new__(cls, *args, **kwargs):

        if not hasattr(ClickhouseWrapper, "_instance" ):
            ClickhouseWrapper._instance = object.__new__(cls)
        return ClickhouseWrapper._instance


    def query(self, q):
        return self.client.execute(q)
    
    def queryDataframe(self,q):
        return self.client.query_dataframe(q)
