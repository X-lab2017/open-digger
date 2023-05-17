import neo4j from 'neo4j-driver';
import parser = require('parse-neo4j');
import getConfig from '../config';

let _driver: any;

export async function getClient() {
  if (!_driver) _driver = neo4j.driver((await getConfig()).db.neo4j.host);
  return _driver;
}

export async function query<T = any>(query: string, params?: any): Promise<T[]> {
  const session = (await getClient()).session();
  const r = await session.run(query, params);
  await session.close();
  return parser.parse(r) as T[];
}

export async function runQueryStream<T = any>(query: string, onRecord: (r: T) => Promise<void>, params?: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const session = (await getClient()).session();
    const result = session.run(query, params);
    result.subscribe({
      onNext: (r: any) => onRecord(parseRecord(r)),
      onCompleted: () => session.close().then(() => resolve()),
      onError: reject,
    });
  });
}

export function parseRecord<T = any>(record: any): T {
  const item = parser.parseRecord(record);
  const ret: any = {};
  for (const key of item.keys) {
    ret[key] = item._fields[item._fieldLookup[key]];
  }
  return ret;
}
