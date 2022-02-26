export default {
  general: {
    owner: 'X-lab2017',
    repo: 'OpenDigger',
    baseUrl: 'http://open-digger.opensource-service.cn/',
  },
  db: {
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST ?? 'cc-uf6s6ckq946aiv4jyo.ads.rds.aliyuncs.com',
      port: process.env.CLICKHOUSE_PORT ?? '8123',
      user: process.env.CLICKHOUSE_USER ?? 'frank',
      password: process.env.CLICKHOUSE_PASSWORD ?? 'Frank524!',
      protocol: process.env.CLICKHOUSE_PROTOCAL ?? 'http:',
      format: process.env.CLICKHOUSE_FORMAT ?? 'JSON',
    },
    neo4j: {
      host: process.env.NEO4J_HOST ?? 'neo4j://host.docker.internal',
    }
  },
};
