import { Task } from '..';
import { query } from '../../db/neo4j';
import { getGitHubData } from '../../label_data_utils';
import { forEveryMonth } from '../../metrics/basic';
import { getClient } from '../../oss/ali';

const task: Task = {
  cron: '0 0 5 * *',    // runs on the 5th day of every month at 00:00
  enable: true,
  immediate: false,
  callback: async () => {
    const chineseUserIds = getGitHubData([':regions/China']).githubUsers;
    const q = `MATCH (u:User) WHERE u.id IN [${chineseUserIds.join(',')}] RETURN u;`;
    const users: any[] = await query(q);
    const result: any = users.map(u => {
      return {
        id: u.id,
        login: u.login,
        ranks: [],
      };
    });
    forEveryMonth(2015, 1, 2021, 12, (y, m) => {
      const rankIndex = `open_rank_${y}${m}`;
      const sortArr = users.sort((a, b) => (b[rankIndex] ?? 0) - (a[rankIndex] ?? 0));
      result.forEach(r => {
        const itemIndex = sortArr.findIndex(i => i.id === r.id);
        const valid = sortArr[itemIndex][rankIndex] > 0;
        const lastRank = r.ranks.length > 0 ? r.ranks[r.ranks.length - 1] : null;
        r.ranks.push({
          rank: valid ? (itemIndex + 1).toString() : '-',
          diff: valid ? ((lastRank && lastRank.rank != '-') ? lastRank.rank - (itemIndex + 1) : 'new') : '-',
        });
      });
    });
    const client = await getClient();
    await client.put('/hacking_force/total.json', Buffer.from(JSON.stringify(result)));
    console.log('Run hacking force total task done.');
  }
};

module.exports = task;
