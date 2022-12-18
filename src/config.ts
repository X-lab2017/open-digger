import { merge } from 'lodash';

let inited = false;

let config = {
  general: {
    owner: 'X-lab2017',
    repo: 'OpenDigger',
    baseUrl: 'http://open-digger.opensource-service.cn/',
  },
  db: {
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USERNAME ?? '',
      password: process.env.CLICKHOUSE_PASSWORD ?? '',
      database: process.env.CLICKHOUSE_DATABASE ?? 'opensource',
    },
    neo4j: {
      host: process.env.NEO4J_HOST ?? 'neo4j://localhost',
    }
  },
  oss: {
    ali: {
      region: '',
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
    }
  },
  ci: {
    token: process.env.GITHUB_TOKEN,
  },
  export: {
    path: '',
    needInit: true,
  },
};

export default async () => {
  if (!inited) {
    try {
      // @ts-ignore
      await import('./local_config').then(localConfig => {
        config = merge(config, localConfig.default);
      });
    } catch {}
  }
  return config;
}
