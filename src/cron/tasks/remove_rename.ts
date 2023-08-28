import { Task } from '..';
import { query } from '../../db/clickhouse';
import OSS from 'ali-oss';
import getConfig from '../../config';

/**
 * This task is used to remove renamed repos and orgs from OSS
 * in case legacy old format data left behind on OSS
 */
const task: Task = {
  cron: '0 0 4 * *',
  enable: false,
  immediate: false,
  callback: async () => {
    try {
      const config = await getConfig();
      const ossPrefix = 'open_digger/github/';
      const oss = new OSS(config.oss.ali);

      const deleteFile = async (fileName: string) => {
        try {
          const r: any = await oss.delete(fileName);
          if (r.res.statusMessage !== 'OK' && r.res.statusMessage !== 'No Content') {
            console.log(`Error on delete ${fileName}, message=${JSON.stringify(r.res)}`);
          }
        } catch (e) {
          console.log(e);
        }
      };
      const deletePath = async (path: string) => {
        while (true) {
          const files = await oss.list({ prefix: `${ossPrefix}${path}/`, 'max-keys': 300 }, {});
          if (Array.isArray(files.objects)) {
            if (files.objects.length === 0) break;
            await Promise.all(files.objects.map(async f => {
              await deleteFile(f.name);
            }));
          }
        }
        await deleteFile(`${ossPrefix}${path}/`);
      };

      const orgQuery = `SELECT org_id, groupArray(DISTINCT org_login) AS names, argMax(org_login, created_at) FROM gh_events WHERE repo_id IN (SELECT id FROM gh_export_repo) GROUP BY org_id HAVING length(names) > 1`;
      const orgQueryResult = await query<any[]>(orgQuery);
      console.log(`Got ${orgQueryResult.length} rows from org query.`);
      const orgToRemove: string[] = [];
      const orgToRemoveIds: number[] = [];
      orgQueryResult.forEach(row => {
        const [orgId, names, lastName] = row;
        orgToRemove.push(...names.filter(n => lastName !== n));
        orgToRemoveIds.push(orgId);
      });
      console.log(`There are ${orgToRemove.length} orgs.`);
      for (const o of orgToRemove) {
        await deletePath(o);
      }
      console.log('Remove all orgs files done.');

      const repoQuery = `SELECT groupArray(DISTINCT repo_name) AS names, argMax(repo_name, created_at) FROM gh_events WHERE repo_id IN (SELECT id FROM gh_export_repo) AND org_id NOT IN (${orgToRemoveIds.join(',')}) GROUP BY repo_id HAVING length(names) > 1`;
      const repoQueryResult = await query<any[]>(repoQuery);
      const repoToRemove: string[] = [];
      console.log(`Got ${repoQueryResult.length} rows from repo query.`);
      repoQueryResult.forEach(row => {
        const [names, lastName] = row;
        repoToRemove.push(...names.filter(n => lastName !== n));
      });
      console.log(`There are ${repoToRemove.length} repos to remove.`);
      for (const r of repoToRemove) {
        await deletePath(r);
      }
      console.log('Remove all repos files done.');
    } catch (e) {
      console.error(e);
    }
  }
};

module.exports = task;
