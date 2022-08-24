# import { merge } from 'lodash';
from easydict import EasyDict
# from local_config import local_config
inited = False
config = {
  'general': {
    'owner': 'X-lab2017',
    'repo': 'OpenDigger',
    'baseUrl': 'http://open-digger.opensource-service.cn/',
  },
  'db': {
    'clickhouse': {
      'host': 'localhost', #python里的clickhouse_driver用的tcp端口9000
      'port': '9000',
      'user': '',
      'password': '',
      'protocol': 'http:',
      'format': 'JSON',
    },
    'neo4j': {
      'host':'neo4j://localhost:7687',
    }
  },
  'oss': {
    'ali': {
      'region': '',
      'accessKeyId': '',
      'accessKeySecret': '',
      'bucket': '',
    }
  },
  'ci': {
    'token':'process.env.GITHUB_TOKEN',
  }
};
# print(config)
def getConfig():
    global config
    if not inited: 
        try:
            from local_config import local_config
            config = dict(**config, **local_config)  # merge的方法，值不同怎么办？
            # config.update(local_config)
            return config
        except:
          return config
    return config
# print(getConfig())
# print(dict(config.items(), local_config.items()))