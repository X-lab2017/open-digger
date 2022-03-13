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
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60);
    const year = lastMonth.getFullYear(), month = lastMonth.getMonth() + 1;
    const q = `MATCH (r:Repo) WHERE r.activity_${year}${month} IS NOT NULL RETURN r;`;
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
        forEveryMonth(2015, 1, year, month, (y, m) => {
          repoInfo.activity[`${y}-${m}`] = repo[`activity_${y}${m}`] ?? 0;
          repoInfo.influence[`${y}-${m}`] = repo[`open_rank_${y}${m}`] ?? 0;
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
