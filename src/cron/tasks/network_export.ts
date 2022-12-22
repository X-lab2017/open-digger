import { Task } from '..';
import { query } from '../../db/neo4j';
import { query as queryClickhouse } from '../../db/clickhouse';
import { forEveryMonth } from '../../metrics/basic';
import getConfig from '../../config';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const task: Task = {
  cron: '0 0 6 * *',
  enable: true,
  immediate: false,
  callback: async () => {

    const limit = 30, developerNetworkFile = 'developer_network.json', repoNetworkFile = 'repo_network.json';

    const startDate = new Date(), endDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    endDate.setMonth(endDate.getMonth() - 1);
    const months: string[] = [], formattedMonths: string[] = [];
    await forEveryMonth(startDate.getFullYear(), startDate.getMonth() + 1, endDate.getFullYear(), endDate.getMonth() + 1, async (y, m) => {
      months.push(`${y}${m}`);
      formattedMonths.push(`${y}-${m.toString().padStart(2, '0')}`)
    });
    const config = await getConfig();
    const exportBasePath = join(config.export.path, 'github');

    const openrankMap = new Map<string, number>();
    const loadOpenrankSql = `
    SELECT actor_login AS name, SUM(openrank)
    FROM gh_user_openrank
    WHERE created_at >= toDate('${startDate.getFullYear()}-${startDate.getMonth() + 1}-01')
      AND created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-01')
    GROUP BY name
    UNION ALL
    SELECT repo_name AS name, SUM(openrank)
    FROM gh_repo_openrank
    WHERE created_at >= toDate('${startDate.getFullYear()}-${startDate.getMonth() + 1}-01')
      AND created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-01')
    GROUP BY name
    `;
    const openrankRes = await queryClickhouse<string[]>(loadOpenrankSql);
    openrankRes.forEach(r => openrankMap.set(r[0], parseFloat(parseFloat(r[1]).toFixed(2))));
    console.log(`Load ${openrankMap.size} openrank for user and repo`);

    const activityProp = (type: string) => months.map(m => `SQRT(COALESCE(${type}.activity_${m}, 0.0))`).join('+');

    const processData = async (rows: { n1: string; n2: string; rel: number }[], name: string, fileName: string, map: Map<string, number> = openrankMap) => {
      const set = new Set<string>();
      rows.forEach(r => set.add(r.n1));
      rows.forEach(r => set.add(r.n2));
      const data = {
        nodes: Array.from(set).map<any>(name => [name, map.get(name) ?? 1]).sort((a, b) => b[1] - a[1]),
        // for repo netowrk of users and user network of repos, may contain nodes with same name, so need to filter out in edges. If filter out in SQL, then network with only one node will not return anything.
        edges: rows.map<any>(r => [r.n1, r.n2, r.rel]).filter(n => n[0] != n[1]).sort((a, b) => b[2] - a[2]),
      };
      (async () => {
        if (!existsSync(join(exportBasePath, name))) mkdirSync(join(exportBasePath, name), { recursive: true });
        writeFileSync(join(exportBasePath, name, fileName), JSON.stringify(data));
      })();
    };
    // user network
    const generateUserNetwork = async () => {
      const userNetworkSql = `
MATCH (u:User{id:$id})-[a1:ACTION]->(r:Repo)<-[a2:ACTION]-(u2:User)
WITH u, u2, ${activityProp('a1')} AS act1, ${activityProp('a2')} AS act2
WHERE act1 > 0 AND act2 > 0
WITH u, u2, SUM((act1 * act2)/(act1 + act2)) AS relationship
ORDER BY relationship DESC
LIMIT toInteger($limit)
WITH collect(u2.id) + [u.id] AS uid
MATCH (u1:User)-[a1:ACTION]->(r:Repo)<-[a2:ACTION]-(u2:User)
WHERE u1.id IN uid AND u2.id IN uid AND u1.id > u2.id AND ${activityProp('a1')} > 0 AND ${activityProp('a2')} > 0
WITH u1, u2, ${activityProp('a1')} AS act1, ${activityProp('a2')} AS act2
RETURN u1.login AS n1, u2.login AS n2, ROUND(SUM((act1 * act2)/(act1 + act2)), 2) AS rel
`;
      const repoNetworkSql = `
MATCH (u:User{id:$id})-[a:ACTION]->(r:Repo)
WITH r, ${activityProp('a')} AS act
WHERE act > 0
WITH r, act
ORDER BY act DESC
LIMIT toInteger($limit)
WITH collect(r.id) AS rid, collect(r.name) AS rname
CALL {
  WITH rid
  MATCH (r1:Repo)<-[a1:ACTION]-(u:User)-[a2:ACTION]->(r2:Repo)
  WHERE r1.id IN rid AND r2.id IN rid AND r1.id > r2.id AND ${activityProp('a1')} > 0 AND ${activityProp('a2')} > 0
  WITH r1, r2, ${activityProp('a1')} AS act1, ${activityProp('a2')} AS act2
  RETURN r1.name AS n1, r2.name AS n2, SUM((act1 * act2)/(act1 + act2)) AS rel
  UNION ALL
  WITH rname
  UNWIND rname AS name
  RETURN name AS n1, name AS n2, 0 AS rel
}
RETURN n1, n2, ROUND(rel, 2) AS rel
`;
      const repoActivitySql = `
MATCH (u:User{id:$id})-[a:ACTION]->(r:Repo)
WITH r, ${activityProp('a')} AS act
WHERE act > 0
RETURN r.name AS name, ROUND(act, 2) AS act
ORDER BY act DESC
LIMIT toInteger($limit)
      `;

      const users = await queryClickhouse<string[]>(`
SELECT actor_id, argMax(actor_login, created_at)
FROM gh_user_openrank
WHERE created_at >= toDate('${startDate.getFullYear()}-${startDate.getMonth() + 1}-01')
  AND created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-01')
  AND openrank > ${Math.E}
GROUP BY actor_id`);
      console.log(`Found ${users.length} users to generate`);
      let i = 0;
      for (const [id, login] of users) {
        await processData(await query(userNetworkSql, { id: parseInt(id), limit }), login, developerNetworkFile);
        const repoActivity = await query(repoActivitySql, { id: parseInt(id), limit });
        const map = new Map<string, number>(repoActivity.map(i => [i.name, i.act]));
        await processData(await query(repoNetworkSql, { id: parseInt(id), limit }), login, repoNetworkFile, map);
        if (++i % 1000 === 0) console.log(`Finish ${i} users`);
      }
    };

    // repo network
    const generateRepoNetwork = async () => {
      const repoNetworkSql = `
MATCH (r:Repo{id:$id})<-[a1:ACTION]-(u:User)-[a2:ACTION]->(r2:Repo)
WITH r, r2, ${activityProp('a1')} AS act1, ${activityProp('a2')} AS act2
WHERE act1 > 0 AND act2 > 0
WITH r, r2, SUM((act1 * act2)/(act1 + act2)) AS relationship
ORDER BY relationship DESC
LIMIT toInteger($limit)
WITH collect(r2.id) + [r.id] AS rid
MATCH (r1:Repo)<-[a1:ACTION]->(u:User)-[a2:ACTION]->(r2:Repo)
WHERE r1.id IN rid AND r2.id IN rid AND r1.id > r2.id AND ${activityProp('a1')} > 0 AND ${activityProp('a2')} > 0
WITH r1, r2, ${activityProp('a1')} AS act1, ${activityProp('a2')} AS act2
RETURN r1.name AS n1, r2.name AS n2, ROUND(SUM((act1 * act2)/(act1 + act2)), 2) AS rel
`;
      const userNetworkSql = `
MATCH (r:Repo{id:$id})<-[a:ACTION]->(u:User)
WITH u, ${activityProp('a')} AS act
WHERE act > 0
WITH u, act
ORDER BY act DESC
LIMIT toInteger($limit)
WITH collect(u.id) AS uid, collect(u.login) AS uname
CALL {
  WITH uid
  MATCH (u1:User)-[a1:ACTION]->(r:Repo)<-[a2:ACTION]-(u2:User)
  WHERE u1.id IN uid AND u2.id IN uid AND u1.id > u2.id AND ${activityProp('a1')} > 0 AND ${activityProp('a2')} > 0
  WITH u1, u2, ${activityProp('a1')} AS act1, ${activityProp('a2')} AS act2
  RETURN u1.login AS n1, u2.login AS n2, SUM((act1 * act2)/(act1 + act2)) AS rel
  UNION ALL
  WITH uname
  UNWIND uname AS name
  RETURN name AS n1, name AS n2, 0 AS rel
}
RETURN n1, n2, ROUND(rel, 2) AS rel
`;

      const userActivitySql = `
MATCH (r:Repo{id:$id})<-[a:ACTION]->(u:User)
WITH u, ${activityProp('a')} AS act
WHERE act > 0
RETURN u.login AS login, ROUND(act, 2) AS act
ORDER BY act DESC
LIMIT toInteger($limit)
      `;

      const repos = await queryClickhouse<string[]>(`
SELECT repo_id, argMax(repo_name, created_at)
FROM gh_repo_openrank
WHERE created_at >= toDate('${startDate.getFullYear()}-${startDate.getMonth() + 1}-01')
  AND created_at < toDate('${endDate.getFullYear()}-${endDate.getMonth() + 1}-01')
  AND openrank > ${Math.E}
GROUP BY repo_id`);
      console.log(`Found ${repos.length} repos to generate`);
      let i = 0;
      for (const [id, name] of repos) {
        const userActivity = await query(userActivitySql, { id: parseInt(id), limit });
        const map = new Map<string, number>(userActivity.map(i => [i.login, i.act]));
        await processData(await query(userNetworkSql, { id: parseInt(id), limit }), name, developerNetworkFile, map);
        await processData(await query(repoNetworkSql, { id: parseInt(id), limit }), name, repoNetworkFile);
        if (++i % 1000 === 0) console.log(`Finish ${i} repos`);
      }
    };

    await Promise.all([
      generateUserNetwork(),
      generateRepoNetwork(),
    ]);
  }
};

module.exports = task;
