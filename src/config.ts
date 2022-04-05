import { merge } from "lodash";

let inited = false;

let config = {
  general: {
    owner: 'X-lab2017',
    repo: 'OpenDigger',
    baseUrl: 'http://open-digger.opensource-service.cn/',
  },
  db: {
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST ?? 'localhost',
      port: process.env.CLICKHOUSE_PORT ?? '8123',
      user: process.env.CLICKHOUSE_USER ?? '',
      password: process.env.CLICKHOUSE_PASSWORD ?? '',
      protocol: process.env.CLICKHOUSE_PROTOCAL ?? 'http:',
      format: process.env.CLICKHOUSE_FORMAT ?? 'JSON',
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
    token: process.env.GH_TOKEN,
  }
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
