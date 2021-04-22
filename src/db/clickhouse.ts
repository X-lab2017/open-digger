import ClickHouse = require('@apla/clickhouse');
import request from 'request';

interface ServerConfig {
  url?: string;
  host?: string;
  protocol?: string;
  port?: string;
  format?: string;
  user?: string;
  password?: string;
}

interface ClickhouseClient {
  querying<T>(q: string): Promise<T>;
}

function getClient(serverConfig: ServerConfig): ClickhouseClient {
  return new ClickHouse(serverConfig);
}

export async function query<T>(config: ServerConfig, q: string): Promise<T> {
  if (config.url !== undefined) {
    return new Promise((resolve, reject) => {
      request({
        url: config.url!,
        method: 'POST',
        form: {
          query: q,
        }
      }, (err, res, body) => {
        if (err) {
          reject(err);
        } else if (res.statusCode != 200) {
          reject(`Server error code=${res.statusCode}`);
        } else {
          try {
            resolve(JSON.parse(body).data);
          } catch (e) {
            reject(`Parse err, e=${e.message}`);
          }
        }
      });
    });
  } else {
    const client = getClient({
      host: config.host ?? 'localhost',
      protocol: config.protocol ?? 'http:',
      port: config.port ?? '8123',
      format: config.format ?? 'JSON',
      user: config.user,
      password: config.password,
    });
    return (await client.querying(q) as any).data;
  }
}
