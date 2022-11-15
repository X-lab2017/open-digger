import ClickHouse = require('@apla/clickhouse');
import getConfig from '../config';

let _client: any;

async function getClient() {
  if (!_client) _client = new ClickHouse((await getConfig()).db.clickhouse);
  return _client;
}

export async function query<T>(q: string): Promise<T[]> {
    const result: T[] = [];
    await queryStream(q, row => result.push(row));
    return result;
}

export async function queryStream<T = any>(q: string, onRow: (row: T) => void): Promise<void> {
  return new Promise(async resolve => {
    const stream = (await getClient()).query(q);
    stream.on('data', (row: T) => onRow(row));
    stream.on('end', () => {
      resolve();
    });
    stream.on('error', (err: any) => console.error(`Query for ${q} error: ${err}`));
  });
}
