import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Task } from '..';
import { getClient as getNeo4jClient, parseRecord } from '../../db/neo4j';
import { forEveryMonth } from '../../metrics/basic';

const task: Task = {
  cron: '0 0 7 * *',    // runs on the 5th day of every month at 00:00
  enable: true,
  immediate: false,
  callback: async () => {
    const neo4jClient = await getNeo4jClient();
    const session = neo4jClient.session();
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60);
    const year = lastMonth.getFullYear(), month = lastMonth.getMonth() + 1;
    const q = `MATCH (u:User) WHERE u.activity_${year}${month} IS NOT NULL RETURN u;`;
    const result = session.run(q);
    let count = 0;
    result.subscribe({
      onNext: async r => {
        const user = parseRecord(r);
        const userInfo = {
          login: user.login,
          id: user.id,
          activity: {},
          influence: {},
        };
        await forEveryMonth(2015, 1, year, month, async (y, m) => {
          userInfo.activity[`${y}-${m}`] = user[`activity_${y}${m}`] ?? 0;
          userInfo.influence[`${y}-${m}`] = user[`open_rank_${y}${m}`] ?? 0;
        });
        const dir = `./local_files/hypercrx_actor/${user.login.charAt(0).toLowerCase()}`;
        if (!existsSync(dir)) {
          mkdirSync(dir);
        }
        writeFileSync(`${dir}/${user.login}.json`, JSON.stringify(userInfo));
        count++;
        if (count % 10000 === 0) console.log(`Finish write ${count} files.`);
      },
      onCompleted: () => {
        session.close().then(() => {
          console.log(`Process ${count} users done.`);
        });
      },
      onError: console.log,
    });
  }
};

module.exports = task;
