import neo4j = require('neo4j-driver');
import parser = require('parse-neo4j');
import config from '../config';

let driver: any;

function getClient() {
  if (driver) return driver;
  driver = neo4j.driver(config.db.neo4j.host);
  return driver;
}

export async function query<T = any>(query: string, params?: any) {
  const session = getClient().session();
  const r = await session.run(query, params);
  await session.close();
  return parser.parse(r) as T;
}
