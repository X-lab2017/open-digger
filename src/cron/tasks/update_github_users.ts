import { Task } from '..';
import getConfig from '../../config';
import { query } from '../../db/clickhouse';
import { Readable } from 'stream';
import { createClient } from '@clickhouse/client';
import { GitHubClient } from 'github-graphql-v4-client';

/**
 * This task is used to update github users basic info
 */
const task: Task = {
  cron: '*/10 * * * *',
  enable: false,
  immediate: false,
  callback: async () => {
    const updateBatchSize = 2000;
    const config = await getConfig();
    const tokens = config.github.tokens;
    const graphqlClient = new GitHubClient({
      tokens,
      maxConcurrentReqNumber: 30,
      logger: {
        info: () => { },
        error: () => { },
        warn: () => { }
      }
    })
    await graphqlClient.init();

    const queryUserInfo = async (login: string) => {
      const result: any = await graphqlClient.query(`query getUser($login: String!){ 
        user(login: $login) {
          name
          bio
          location
          email
          company
          twitterUsername
          createdAt
          socialAccounts(first: 50) {
            nodes {
              displayName
              provider
            }
          }
        }
      }`, { login });
      if (!result) return null;
      const user = result.user;
      user.socialAccounts = user.socialAccounts.nodes;
      return user;
    };

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
      \`twitter_username\` String,
      \`social_accounts.name\` Array(String),
      \`social_accounts.provider\` Array(LowCardinality(String)),
      \`created_at\` DateTime
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (id, updated_at)
    SETTINGS index_granularity = 8192`;
    await query(createTableQuery);

    // get users
    const now = new Date();
    const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01 00:00:00`;
    const getUsersList = async (totalCount: number): Promise<any[]> => {
      // try to get export user first, export users need to be updated every month
      let q = `SELECT id, actor_login FROM gh_export_user
    WHERE id NOT IN (
      SELECT id FROM gh_user_info
      WHERE toYYYYMM(updated_at) = ${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')})
      LIMIT ${totalCount}`;
      let usersList = await query(q);
      if (usersList.length > 0) return usersList;
      // then try to get users who has events, every user should be updated at least once a year
      q = `SELECT actor_id, argMax(actor_login, created_at) FROM gh_user_openrank
      WHERE actor_id NOT IN (SELECT id FROM gh_user_info WHERE toYear(updated_at) = ${now.getFullYear()})
      GROUP BY actor_id
      LIMIT ${totalCount}`;
      usersList = await query(q);
      if (usersList.length > 0) return usersList;
      // then try to get any user in the log, every user should be updated at least once
      q = `SELECT actor_id, argMax(actor_login, created_at) FROM gh_events
      WHERE actor_id NOT IN (SELECT id FROM gh_user_info)
      GROUP BY actor_id
      LIMIT ${totalCount}`;
      usersList = await query(q);
      return usersList;
    };

    const usersList = await getUsersList(updateBatchSize);
    if (usersList.length === 0) return;
    console.log(`Get ${usersList.length} users to update`);

    let processedCount = 0;
    const stream = new Readable({
      objectMode: true,
      read: () => { },
    });
    const client = createClient(config.db.clickhouse);

    for (const [id, login] of usersList) {
      const user: any = await queryUserInfo(login);
      const item: any = { id: parseInt(id), updated_at: date };
      if (!user) {
        item.status = 'not_found';
      } else {
        item.status = 'normal';
        item.location = user.location ?? '';
        item.company = user.company ?? '';
        item.bio = user.bio ?? '';
        item.email = user.email ?? '';
        item.name = user.name ?? '';
        item.twitter_username = user.twitterUsername ?? '';
        item['social_accounts.name'] = (user.socialAccounts ?? []).map(i => i.displayName);
        item['social_accounts.provider'] = (user.socialAccounts ?? []).map(i => i.provider);
        item.created_at = user.createdAt.replace('T', ' ').replace('Z', '');
      }
      stream.push(item);
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`${processedCount} accounts has been processed.`);
      }
    }
    stream.push(null);
    await client.insert({
      table: 'gh_user_info',
      values: stream,
      format: 'JSONEachRow',
    });
    await client.close();
  }
};

module.exports = task;
