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
    let t = new Date();
    const activityQueryArr: string[] = [];
    const oneMonthByMilliSec = 30 * 24 * 60 * 60 * 1000;
    const lastMonth = new Date(t.getTime() - oneMonthByMilliSec);
    const year = lastMonth.getFullYear(), month = lastMonth.getMonth() + 1;
    for (let i = 0; i < 6; i++) {
      t = new Date(t.getTime() - oneMonthByMilliSec);
      const y = t.getFullYear(), m = t.getMonth() + 1;
      activityQueryArr.push(`u.activity_${y}${m}`);
    }
    const q = `MATCH (u:User) WHERE (${activityQueryArr.map(c => `${c} > 0`).join(' OR ')}) AND (${activityQueryArr.map(c => `COALESCE(${c},0.0)`).join(' + ')} > 10) RETURN u;`;
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
          userInfo.activity[`${y}-${m}`] = parseFloat(user[`activity_${y}${m}`]?.toFixed(2) ?? 0);
          userInfo.influence[`${y}-${m}`] = parseFloat(user[`open_rank_${y}${m}`]?.toFixed(2) ?? 0);
        });
        const dir = `./local_files/hypercrx_actor`;
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
