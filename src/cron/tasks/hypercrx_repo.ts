import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { Task } from '..';
import { getClient as getNeo4jClient, parseRecord } from '../../db/neo4j';
import { forEveryMonth } from '../../metrics/basic';

const task: Task = {
  cron: '0 0 6 * *',    // runs on the 5th day of every month at 00:00
  enable: true,
  immediate: false,
  callback: async () => {
    const neo4jClient = await getNeo4jClient();
    const session = neo4jClient.session();
    let t = new Date();
    const oneMonthByMilliSec = 30 * 24 * 60 * 60 * 1000;
    const lastMonth = new Date(t.getTime() - oneMonthByMilliSec);
    const year = lastMonth.getFullYear(), month = lastMonth.getMonth() + 1;
    const activityQueryArr: string[] = [];
    for (let i = 0; i < 6; i++) {
      t = new Date(t.getTime() - oneMonthByMilliSec);
      const y = t.getFullYear(), m = t.getMonth() + 1;
      activityQueryArr.push(`r.activity_${y}${m}`);
    }
    const q = `MATCH (r:Repo) WHERE (${activityQueryArr.map(c => `${c} > 0`).join(' OR ')}) AND (${activityQueryArr.map(c => `COALESCE(${c},0.0)`).join(' + ')} > 10) RETURN r;`;
    const result = session.run(q);
    let count = 0;
    result.subscribe({
      onNext: async r => {
        const repo = parseRecord(r);
        const repoInfo = {
          id: repo.id,
          name: repo.name,
          org: repo.org_login,
          org_id: repo.org_id,
          activity: {},
          influence: {},
        };
        var inited = false;
        await forEveryMonth(2015, 1, year, month, async (y, m) => {
          if (repo[`activity_${y}${m}`]) inited = true;
          repoInfo.activity[`${y}-${m}`] = inited ? parseFloat(repo[`activity_${y}${m}`]?.toFixed(2) ?? 0) : undefined;
          repoInfo.influence[`${y}-${m}`] = inited ? parseFloat(repo[`open_rank_${y}${m}`]?.toFixed(2) ?? 0) : undefined;
        });
        const [owner, name] = repoInfo.name.split('/');
        const dir = `./local_files/hypercrx_repo/${owner}`;
        if (!existsSync(dir)) {
          mkdirSync(dir);
        }
        writeFileSync(`${dir}/${name}.json`, JSON.stringify(repoInfo));
        count++;
        if (count % 10000 === 0) console.log(`Finish write ${count} files.`);
      },
      onCompleted: () => {
        session.close().then(() => {
          console.log(`Process ${count} repos done.`);
        });
      },
      onError: console.log,
    });
  }
};

module.exports = task;
