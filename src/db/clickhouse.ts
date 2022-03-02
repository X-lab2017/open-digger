import ClickHouse = require('@apla/clickhouse');
import getConfig from '../config';

let client;

function getClient() {
  if (client) return client;
  client = new ClickHouse(getConfig().db.clickhouse);
  return client;
}

export async function query<T>(q: string): Promise<T> {
    const client = getClient();
    return (await client.querying(q) as any).data;
}
