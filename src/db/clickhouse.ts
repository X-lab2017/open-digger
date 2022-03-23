import ClickHouse = require('@apla/clickhouse');
import getConfig from '../config';

let _client: any;

async function getClient() {
  if (!_client) _client = new ClickHouse((await getConfig()).db.clickhouse);
  return _client;
}

export async function query<T>(q: string): Promise<T> {
    const client = await getClient();
    return (await client.querying(q) as any).data;
}
