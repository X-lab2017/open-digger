import { ClickHouseClient, createClient, Row } from '@clickhouse/client';
import getConfig from '../config';
import { Readable } from 'stream';

let _client: ClickHouseClient;

async function getClient() {
  if (!_client) _client = createClient((await getConfig()).db.clickhouse);
  return _client;
}

export async function getNewClient() {
  return createClient((await getConfig()).db.clickhouse);
}

export async function query<T>(q: string, options: any = {}): Promise<T[]> {
  const result: T[] = [];
  await queryStream(q, row => result.push(row), options);
  return result;
}

export async function queryStream<T = any>(q: string, onRow: (row: T) => void, options: any = {}): Promise<void> {
  return new Promise(async resolve => {
    const resultSet = await (await getClient()).query({ query: q, format: 'JSONCompactEachRow', ...options });
    const stream = resultSet.stream();
    stream.on('data', (rows: Row[]) => rows.forEach(row => onRow(row.json())));
    stream.on('end', () => resolve());
    stream.on('error', (err: any) => console.error(`Query for ${q} error: ${err}`));
  });
}

export async function insertRecords(records: any[], table: string) {
  if (records.length === 0) return;
  const stream = new Readable({
    objectMode: true,
    read: () => {
      //
    },
  });
  for (const e of records) stream.push(e);
  stream.push(null);
  const client = createClient((await getConfig()).db.clickhouse);
  await client.insert({
    table,
    values: stream,
    format: 'JSONEachRow',
  });
  await client.close();
}
