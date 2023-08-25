import { Task } from '..';
import getConfig from '../../config';
import { DataCat } from 'github-data-cat';
import { query, queryStream } from '../../db/clickhouse';
import { Readable } from 'stream';
import { waitUntil } from '../../utils';
import { createClient } from '@clickhouse/client';

/**
 * This task is used to update github users basic info
 */
const task: Task = {
  cron: '*/10 * * * *',
  enable: false,
  immediate: false,
  callback: async () => {
    const config = await getConfig();
    const tokens = config.github.tokens;
    const dataCat = new DataCat({
      tokens,
      maxConcurrentReqNumber: 30,
      logger: {
        info: () => { },
        error: () => { },
        warn: () => { }
      }
    });
    await dataCat.init();

    // create info table
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS gh_user_info
    (
      \`id\` UInt64,
      \`status\` Enum('normal' = 1, 'not_found' = 2),
      \`updated_at\` DateTime,
      \`location\` String,
      \`company\` String,
      \`bio\` String,
      \`email\` String,
      \`name\` String,
      \`created_at\` DateTime
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (id, updated_at)
    SETTINGS index_granularity = 8192`;
    await query(createTableQuery);

    // get users
    const now = new Date();
    const userQuery = `
    SELECT id, actor_login FROM gh_export_user
    WHERE id NOT IN (
      SELECT id FROM gh_user_info
      WHERE toYYYYMM(updated_at) = ${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')})
      LIMIT 1500`;

    const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01 00:00:00`;
    let totalCount = 0, processedCount = 0;
    const stream = new Readable({
      objectMode: true,
      read: () => { },
    });
    const client = createClient(config.db.clickhouse);
    queryStream(userQuery, async row => {
      totalCount++;
      const [id, login] = row;
      const info = await dataCat.user.info(login);
      const item: any = { id, updated_at: date };
      if (!info) {
        item.status = 'not_found';
      } else {
        item.status = 'normal';
        item.location = info.location ?? '';
        item.company = info.company ?? '';
        item.bio = info.bio ?? '';
        item.email = info.email ?? '';
        item.name = info.name ?? '';
        item.created_at = info.createdAt.replace('T', ' ').replace('Z', '');
      }
      stream.push(item);
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`${processedCount} accounts has been processed.`);
      }
    }).then(() => {
      waitUntil(() => totalCount === processedCount).then(() => {
        stream.push(null);
      })
    });
    await client.insert({
      table: 'gh_user_info',
      values: stream,
      format: 'JSONEachRow',
    });
    await client.close();
  }
};

module.exports = task;
