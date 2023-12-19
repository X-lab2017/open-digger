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
      'user': 'default',
      'password': '',
      'protocol': 'http:',
      'format': 'JSON',
      'database': 'opensource',
    },
    'neo4j': {
      'host': 'neo4j://localhost:7687',
      'user': 'neo4j',
      'password': 'password',
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
}
def mergeConfig(base_config, local_config):
    for key in base_config.keys():
      if isinstance(base_config[key], dict) and isinstance(local_config[key], dict):
          mergeConfig(base_config[key], local_config[key])
      else:
          base_config[key] = local_config[key]
    return base_config
def getConfig(local_config=None):
    local_config = local_config or {}
    global config
    if not inited: 
        try:
            config = mergeConfig(config, local_config)
            return config
        except:
          return config
    return config
