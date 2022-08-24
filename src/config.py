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
    'token':'',
  }
};
def mergeConfig(base_config, local_config):
    for key, val in local_config.items():
            if isinstance(val, dict):
                mergeConfig(base_config[key], val)
            else:
                base_config[key] = val
    return base_config
def getConfig():
    global config
    if not inited: 
        try:
            from local_config import local_config
            config = mergeConfig(config, local_config)
            return config
        except:
          return config
    return config