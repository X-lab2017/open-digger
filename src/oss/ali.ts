import OSS from 'ali-oss';
import getConfig from '../config';

let client: OSS;

export async function getClient(): Promise<OSS> {
  if (client) return client;
  const config = await getConfig();
  client = new OSS(config.oss.ali);
  return client;
};
