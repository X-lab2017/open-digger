import { Octokit } from "@octokit/rest";
import { insertRecords, query } from "../db/clickhouse";
import { getLogger } from "../utils";
import getConfig from '../config';

// Update GitHub Bot Avatars
const githubBotAvatarTable = 'gh_bot_avatars';
const logger = getLogger('UpdateGitHubBotAvatar');

const createTable = async () => {
  await query(`CREATE TABLE IF NOT EXISTS ${githubBotAvatarTable}
  (
    \`id\` UInt64,
    \`login\` String,
    \`avatar\` String
  )
  ENGINE = ReplacingMergeTree
  ORDER BY (id)
  SETTINGS index_granularity = 8192`);
  logger.info('Create table done.');
};

const updateGithubBotAvatar = async () => {
  await createTable();

  const config = await getConfig();
  let tokenIndex = 0;
  let oct = new Octokit({ auth: config.github.tokens[tokenIndex] });

  const updateBots = await query<any>(`SELECT actor_id, argMax(actor_login, created_at) FROM events WHERE actor_login LIKE '%[bot]' AND actor_id NOT IN (SELECT id FROM ${githubBotAvatarTable}) GROUP BY actor_id`);

  logger.info(`Got ${updateBots.length} bot accounts.`);
  let updateCount = 0;
  for (const [id, login] of updateBots) {
    try {
      const info = await oct.users.getByUsername({ username: login });
      updateCount++;
      if (updateCount > 3000) {
        // update token for every 3000 requests
        logger.info('Updated 3000 accounts.');
        updateCount = 0;
        oct = new Octokit({ auth: config.github.tokens[tokenIndex++ % config.github.tokens.length] });
      }
      await insertRecords([{ id: +id, login, avatar: info.data.avatar_url }], githubBotAvatarTable);
    } catch (e: any) {
      if (e.message == 'Not Found') {
        await insertRecords([{ id: +id, login, avatar: '' }], githubBotAvatarTable);
      } else {
        logger.error(`Error on fetch data, e=${e.message}`);
      }
    }
  }
};

updateGithubBotAvatar();
