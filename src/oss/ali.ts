import OSS from 'ali-oss';
import getConfig from '../config';

let client: OSS;

export function getClient(): OSS {
  if (client) return client;
  const config = getConfig();
  client = new OSS(config.oss.ali);
  return client;
};
