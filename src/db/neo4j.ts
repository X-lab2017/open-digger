import neo4j from 'neo4j-driver';
import parser = require('parse-neo4j');
import getConfig from '../config';

let _driver: any;

export async function getClient() {
  if (_driver) return _driver;
  const config: any = await getConfig();
  const { url, user, password } = config.db.neo4j;
  if (user && password) {
    _driver = neo4j.driver(url, neo4j.auth.basic(user, password));
  } else {
    _driver = neo4j.driver(url);
  }
  return _driver;
};

export async function query<T = any>(query: string, params?: any): Promise<T[]> {
  const session = (await getClient()).session();
  const r = await session.run(query, params);
  await session.close();
  return parser.parse(r) as T[];
};

export async function queryStream<T = any>(query: string, onRecord: (r: T) => Promise<void>): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const driver = await getClient();
    const session = driver.session();
    const result = session.run(query);
    result.subscribe({
      onNext: (r: any) => onRecord(parseRecord(r)),
      onCompleted: () => session.close().then(() => resolve()),
      onError: reject,
    });
  });
};

export function parseRecord<T = any>(r: any): T {
  const item = parser.parseRecord(r);
  const ret: any = {};
  for (const key of item.keys) {
    ret[key] = item._fields[item._fieldLookup[key]];
  }
  return ret;
};
