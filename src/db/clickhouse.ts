import ClickHouse = require('@apla/clickhouse');
import getConfig from '../config';

let client;

async function getClient() {
  if (client) return client;
  client = new ClickHouse((await getConfig()).db.clickhouse);
  return client;
}

export async function query<T>(q: string): Promise<T> {
    const client = await getClient();
    return (await client.querying(q) as any).data;
}
