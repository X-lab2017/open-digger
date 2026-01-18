import { inspect } from 'util';
import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { createClient as createGoogleClient } from '@google/maps';

/**
 * This task is used to update user location to standard address
 */
const task: Task = {
  cron: '*/2 * * * *',
  singleInstance: true,
  callback: async () => {
    const config = await getConfig();
    const googleClient = createGoogleClient({ key: config.google.map.key, timeout: 30000 });

    // create info table
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS location_info
    (
      \`location\` String,
      \`status\` Enum('normal' = 1, 'invalid' = 2),
      \`country\` LowCardinality(String),
      \`administrative_area_level_1\` LowCardinality(String),
      \`administrative_area_level_2\` LowCardinality(String),
      \`locality\` LowCardinality(String),
      \`longitude\` Float32,
      \`latitude\` Float32
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (location)
    SETTINGS index_granularity = 8192`;
    await query(createTableQuery);

    const getParsedLocation = (address: string): Promise<any> => {
      return new Promise(resolve => {
        googleClient.geocode({ address }, (err, resp) => {
          const ret: any = {};
          if (err) {
            if (err?.json?.status == 'INVALID_REQUEST') {
              ret.status = 'invalid';
            } else {
              console.log(`Error on parsing ${address}, err: ${inspect(err, false, 2)}`);
              resolve(undefined);
              return;
            }
          } else if (resp?.json?.status !== 'OK') {
            if (resp?.json?.status == 'ZERO_RESULTS') {
              ret.status = 'invalid';
            } else {
              console.log(`Status error on parsing ${address}, status: ${resp?.json?.status}`);
              resolve(undefined);
              return;
            }
          } else {
            ret.status = 'normal';
            const data = resp.json.results[0];
            ['country', 'administrative_area_level_1', 'administrative_area_level_2', 'locality'].forEach(k => {
              const value = data.address_components.find(i => i.types[0] === k);
              if (value) {
                ret[k] = value.long_name;
              }
            });
            if (data?.geometry?.location) {
              ret.latitude = data.geometry.location.lat;
              ret.longitude = data.geometry.location.lng;
            }
          }
          resolve(ret);
        });
      });
    };

    const locationQuery = `SELECT DISTINCT(location) FROM gh_user_info
      WHERE location != '' AND location NOT IN (SELECT location FROM location_info) LIMIT 10`;
    const results = await query<string[]>(locationQuery);

    const items: any[] = [];
    for (const loc of results) {
      const location = loc[0];
      const parsedLocation = await getParsedLocation(location);
      if (parsedLocation) {
        items.push({ location, ...parsedLocation });
      }
    }
    await insertRecords(items, 'location_info');
  }
};

module.exports = task;
