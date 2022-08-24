import sys
import os
from easydict import EasyDict
from matplotlib.pyplot import get
from config import getConfig
from clickhouse_driver import Client

_client = None
def getClient(): 
    global _client
    if _client == None: 
        clickhouse_config = EasyDict(EasyDict(getConfig()).db.clickhouse)
        host = clickhouse_config.host
        port = clickhouse_config.port
        user = clickhouse_config.user
        password = clickhouse_config.password
        _client = Client(host,port)
    return _client

def query(q):
    client = getClient()
    return client.execute(q)
def queryDataframe(q):
    client = getClient()
    return client.query_dataframe(q)

