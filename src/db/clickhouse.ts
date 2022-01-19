import ClickHouse = require('@apla/clickhouse');
import config from '../config';

let client;

function getClient() {
  if (client) return client;
  client = new ClickHouse(config.db.clickhouse);
  return client;
}

export async function query<T>(q: string): Promise<T> {
    const client = getClient();
    return (await client.querying(q) as any).data;
}
