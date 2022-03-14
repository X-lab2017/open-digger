import { Task } from '..';
import { query } from '../../db/neo4j';
import { getClient } from '../../oss/ali';
const metrics = require('../../metrics');

const task: Task = {
  cron: '0 0 20 1 *',    // runs on the 20 Jan. every year
  enable: true,
  immediate: false,
  callback: async () => {
    const year = 2021;
    // get OpenRank data for all Chinese users
    const allData: any[] = await metrics.getUserOpenrank({labelUnion: [':regions/China'], startYear: year, endYear: year, endMonth: 12, limit: -1});

    // get most active repos for all users
    const activities: string[] = [];
    for (let m = 1; m < 12; m++) {
      activities.push(`COALESCE(a.activity_${year}${m},0.0)`);
    }
    for (let u of allData) {
      const q = `MATCH (u:User{login:'${u.user_login}'})-[a:ACTION]->(r:Repo) RETURN r.name AS repo_name, (${activities.join('+')}) AS activity ORDER BY activity DESC LIMIT 10;`;
      const result = await query(q);
      u.most_active_repos = result.map(i => i.repo_name);
      u.open_rank = u.open_rank[0];
    }

    // put data to OSS
    const client = await getClient();
    await client.put(`/hacking_force/annual_${year}.json`, Buffer.from(JSON.stringify(allData)));
    console.log(`Run hacking force total task done for ${year}.`);
  }
};

module.exports = task;
