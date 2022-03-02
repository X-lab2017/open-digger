import { merge } from "lodash";

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
};

import('./local_config').then(localConfig => {
  config = merge(config, localConfig.default);
}).catch(() => {});

export default () => config;
