local_config = {
    'db': {
      'clickhouse': {
        'host': 'cc-uf6764sn662413tc9.public.clickhouse.ads.aliyuncs.com', #python里的clickhouse_driver用的tcp端口9000
        'port': '9000',
        'user': 'xlab',
        'password': 'Xlab2021!',
        'protocol': 'http:',
        'format': 'JSON',
        'database': 'opensource',
      },
      'neo4j':{
        'port': '7687',
      }
    }
}
# local_config = {
#   'db': {
#     'clickhouse': {
#       'host':'172.17.0.1', 
#       'user':'default',
#     },
#     'neo4j':{
#       'port': '7687',
#     }
#   }
# }