import sys
import os
from easydict import EasyDict
from matplotlib.pyplot import get
sys.path.append(os.getcwd())
from src.config import getConfig
from clickhouse_driver import Client

_client = None
def getClient(): 
    global _client
    if _client == None: 
        # _client = new ClickHouse((await getConfig()).db.clickhouse);
        clickhouse_config = EasyDict(EasyDict(getConfig()).db.clickhouse)
        # print(clickhouse_config)
        host = clickhouse_config.host
        port = clickhouse_config.port
        user = clickhouse_config.user
        password = clickhouse_config.password
        _client = Client(host,port)
    return _client

def query(q):
    client = getClient()
    return client.execute(q)
def query_dataframe(q):
    client = getClient()
    return client.query_dataframe(q)

