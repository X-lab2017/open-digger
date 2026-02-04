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
      url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USERNAME ?? '',
      password: process.env.CLICKHOUSE_PASSWORD ?? '',
      database: process.env.CLICKHOUSE_DATABASE ?? 'opensource',
    },
    neo4j: {
      url: process.env.NEO4J_URL ?? 'neo4j://localhost',
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
  github: {
    tokens: [],
    appPrivateKeyPath: '',
    appId: 0,
  },
  gitlab: {
    token: '',
    apiUrl: '',
    graphqlApiUrl: '',
  },
  google: {
    map: {
      key: '',
    },
  },
  task: {
    enable: [],
    immediate: [],
    configs: {} as any,
  },
};

export default async () => {
  if (!inited) {
    try {
      // @ts-ignore
      await import('./localConfig').then(localConfig => {
        config = merge(config, localConfig.default);
      });
    } catch { }
  }
  return config;
}
