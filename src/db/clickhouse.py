from easydict import EasyDict
from config import getConfig
from clickhouse_driver import Client

_client = None
def getClient(): 
    global _client
    if _client == None: 
        config = EasyDict(getConfig()).db.clickhouse
        _client = Client(config.host, config.port, config.database, config.user, config.password)
    return _client

def query(q):
    client = getClient()
    return client.execute(q)
def queryDataframe(q):
    client = getClient()
    return client.query_dataframe(q)
