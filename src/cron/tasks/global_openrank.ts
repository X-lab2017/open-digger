import { appendFileSync } from 'fs';
import { Task } from '..';
import * as clickhouse from '../../db/clickhouse';
import * as neo4j from '../../db/neo4j';
import { getPlatformData } from '../../label_data_utils';
import { forEveryMonth } from '../../metrics/basic';
import { getLogger } from '../../utils';

const task: Task = {
  cron: '0 0 12 1 * *',
  callback: async () => {
    const logger = getLogger('GlobalOpenRankTask');

    const globalOpenrankTableName = 'global_openrank';
    const userRententionFactor = 0.5;
    const repoRententionFactor = 0.3;
    const backgroundRententionFactor = 0.15;
    const openrankAttenuationFactor = 0.85;
    const openrankMinValue = 1;
    const acitivityToOpenrank = activity => Math.min(1, activity / 88.17);  // 75% quantile of monthly activity

    const createTable = async () => {
      const sql = `CREATE TABLE IF NOT EXISTS ${globalOpenrankTableName}
        (
          \`platform\` Enum('GitHub' = 1, 'Gitee' = 2, 'AtomGit' = 3, 'GitLab.com' = 4, 'Gitea' = 5, 'GitLab.cn' = 6),
          \`repo_id\` UInt64,
          \`repo_name\` LowCardinality(String),
          \`actor_id\` UInt64,
          \`actor_login\` LowCardinality(String),
          \`org_id\` UInt64,
          \`org_login\` LowCardinality(String),
          \`type\` Enum('Repo' = 1, 'User' = 2),
          \`legacy\` UInt8,
          \`created_at\` DateTime,
          \`openrank\` Float
        )
        ENGINE = MergeTree
        ORDER BY (repo_id, actor_id, org_id, platform, created_at)
        SETTINGS index_granularity = 8192`;
      await clickhouse.query(sql);
    };

    const calcualteForMonth = async (year: number, month: number) => {
      const yyyymm = year.toString() + month.toString().padStart(2, '0');
      try {
        // check if the openrank of the month has been calculated
        const checkSql = `SELECT COUNT() FROM ${globalOpenrankTableName} WHERE toYYYYMM(created_at) = ${yyyymm}`;
        const checkResult = await clickhouse.query<string[]>(checkSql);
        if (!Array.isArray(checkResult) || checkResult.length !== 1 ||
          !Array.isArray(checkResult[0]) || checkResult[0].length !== 1) {
          throw new Error(`Check global_openrank table failed for ${yyyymm}, result=${checkResult}`);
        }
        if (parseInt(checkResult[0][0]) > 0) {
          logger.info(`Results of global openrank for ${yyyymm} already exists, skip.`);
          return true;
        }
        logger.info(`Start to calculate the global_openrank table for ${yyyymm}.`);

        // load last month openrank
        const lastMonthOpenrank = new Map<string, { info: any; openrank: number; }>();
        // const date = new Date(year, month - 1, 1);
        const lastMonth = new Date(year, month - 2, 1);
        const loadLastMonthSql = `SELECT actor_id, actor_login, repo_id, repo_name, org_id, org_login, platform, type, openrank FROM ${globalOpenrankTableName} WHERE toYYYYMM(created_at) = ${lastMonth.getFullYear()}${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
        const loadLastMonthResult = await clickhouse.query<string[]>(loadLastMonthSql);
        if (!Array.isArray(loadLastMonthResult)) {
          throw new Error(`Load last month openrank failed for ${yyyymm}, result=${loadLastMonthResult}`);
        }
        if (loadLastMonthResult.length > 0) {
          for (const row of loadLastMonthResult) {
            if (Array.isArray(row) && row.length === 9) {
              const [actorId, actorLogin, repoId, repoName, orgId, orgLogin, platform, type, openrank] = row;
              const key = `${type}_${platform}_${type === 'Repo' ? repoId : actorId}`;
              if (lastMonthOpenrank.has(key)) {
                logger.error(`Duplicate key ${key} in last month openrank.`);
              }
              lastMonthOpenrank.set(key, {
                info: {
                  actor_login: actorLogin,
                  repo_name: repoName,
                  org_id: orgId,
                  org_login: orgLogin,
                }, openrank: parseFloat(openrank)
              });
            } else {
              logger.error(`Someting wrong with last month openrank row: ${JSON.stringify(row)}`);
            }
          }
        }
        logger.info(`Load ${lastMonthOpenrank.size} last month openrank.`);

        // load activity data
        const botLabelData = getPlatformData([':bot']);
        const loadActivitySql = `
          SELECT
            platform,
            repo_id,
            argMax(repo_name, created_at) AS repo_name,
            argMax(org_id, created_at) AS org_id,
            argMax(org_login, created_at) AS org_login,
            actor_id,
            argMax(actor_login, created_at) AS actor_login,
            ROUND(countIf(type='IssuesEvent' AND action='opened') * 22.235 +
              countIf(type='IssueCommentEvent') * 5.252 +
              countIf(type='IssuesEvent' AND action='closed') * 9.712 + 
              countIf(type='PullRequestReviewCommentEvent') * 7.427 + 
              countIf(type='PullRequestEvent' AND action='opened') * 40.679 + 
              countIf(type='PushEvent') * 14.695, 3) AS activity,
            MAX(created_at) AS max_created_at,
            (countIf(type='IssuesEvent' AND action='opened') + countIf(type='IssueCommentEvent') + countIf(type='PullRequestEvent' AND action='opened') + countIf(type='IssuesEvent' AND action='closed') + countIf(type='PullRequestReviewCommentEvent')) AS valid_count
          FROM events
          WHERE
            toYYYYMM(created_at)=${yyyymm}
            AND type IN (
              'IssuesEvent',
              'IssueCommentEvent',
              'PullRequestEvent',
              'PullRequestReviewCommentEvent',
              'PushEvent'
            )
            AND issue_title NOT ILIKE '[snyk]%'
            AND ${botLabelData.map(p => {
          if (!p.users || p.users.length === 0) return null;
          return `(NOT (platform='${p.name}' AND actor_id IN (${p.users.map(u => u.id).join(',')})))`;
        }).filter(p => p).join(' AND ')}
          GROUP BY repo_id, actor_id, platform
          HAVING activity > 0 AND valid_count > 0 AND actor_login NOT LIKE '%[bot]'`;
        const nodeMap = new Map<string, { info: any, createdAt: Date }>();
        const userRelationshipCountMap = new Map<string, number>();
        const activityMap = new Map<string, number>();
        const rows: { rId: string; uId: string; activity: number }[] = [];
        await clickhouse.queryStream(loadActivitySql, async row => {
          if (!Array.isArray(row) || row.length !== 10) {
            throw new Error(`Load activity data failed for ${yyyymm}, row=${row}`);
          }
          const platform = row[0];
          const repoId = row[1];
          const repoName = row[2];
          const orgId = row[3];
          const orgLogin = row[4];
          const userId = row[5];
          const userLogin = row[6];
          const activity = row[7];
          const createdAt = new Date(row[8]);
          const rId = `Repo_${platform}_${repoId}`;
          const uId = `User_${platform}_${userId}`;
          if (!nodeMap.has(rId) || nodeMap.get(rId)!.createdAt < createdAt) {
            nodeMap.set(rId, {
              info: {
                repo_name: repoName,
                org_id: orgId,
                org_login: orgLogin,
              }, createdAt
            });
          }
          if (!nodeMap.has(uId) || nodeMap.get(uId)!.createdAt < createdAt) {
            nodeMap.set(uId, { info: { actor_login: userLogin }, createdAt });
          }
          userRelationshipCountMap.set(uId, (userRelationshipCountMap.get(uId) ?? 0) + 1);
          activityMap.set(rId, (activityMap.get(rId) ?? 0) + activity);
          activityMap.set(uId, (activityMap.get(uId) ?? 0) + activity);
          rows.push({ rId, uId, activity });
        });
        const maxUserRelationshipNodes = Array.from(userRelationshipCountMap.entries()).sort((a, b) => b[1] - a[1]).filter(i => i[1] > 300);
        if (maxUserRelationshipNodes.length > 0) {
          logger.info('Most relationship users with more than 300 repos:');
          const items = maxUserRelationshipNodes.map(u => {
            const id = u[0];
            const [_type, platform, _id] = id.split('_');
            const login = nodeMap.get(u[0])?.info.actor_login;
            const url = `https://${platform.toLowerCase()}.com/${login}`;
            return { url, login, id: _id, count: u[1] };
          })
          console.table(items);
          for (const item of items) {
            appendFileSync('./local_files/maybe_bot_users.txt', `${yyyymm}\t${item.url}\t${item.login}\t${item.id}\t${item.count}\n`);
          }
        }
        const bgId = 'Background_GitHub_0';
        nodeMap.set(bgId, { info: {}, createdAt: new Date() });
        const nodeIds = Array.from(nodeMap.keys());
        const nodeIndexMap = new Map(nodeIds.map((n, index) => [n, index]));
        const nodes = nodeIds.map((n, index) => ({
          id: index,
          i: (lastMonthOpenrank.get(n)?.openrank ?? 0) * openrankAttenuationFactor +  // openrank from last month
            (n.startsWith('User') ? acitivityToOpenrank(activityMap.get(n)!) : 0),  // user activity leads openrank
          r: n === bgId ? backgroundRententionFactor :
            (n.startsWith('Repo') ? repoRententionFactor :
              userRententionFactor),
        }));
        const relationships: { s: number; t: number; w: number; }[] = [];
        for (const row of rows) {
          const { rId, uId, activity } = row;
          const rIndex = nodeIndexMap.get(rId);
          const uIndex = nodeIndexMap.get(uId);
          if (rIndex === undefined || uIndex === undefined) {
            throw new Error(`Can not find node index for ${rId} or ${uId}`);
          }
          relationships.push({ s: rIndex, t: uIndex, w: 0.95 * activity / activityMap.get(rId)! });
          relationships.push({ s: uIndex, t: rIndex, w: 0.95 * activity / activityMap.get(uId)! });
        }
        nodeIds.forEach(n => {
          // add background relationships
          if (n === bgId) return;
          if (!nodeIndexMap.has(n) || !nodeIndexMap.has(bgId)) {
            throw new Error(`Node ${n} or ${bgId} not exist`);
          }
          relationships.push({ s: nodeIndexMap.get(n)!, t: nodeIndexMap.get(bgId)!, w: 0.05 });
          relationships.push({ s: nodeIndexMap.get(bgId)!, t: nodeIndexMap.get(n)!, w: 1 / (nodeIds.length - 1) });
        });
        logger.info(`Calculate ${nodes.length} nodes and ${relationships.length} relationships.`);

        // check relationships
        const nodeWeightMap = new Map<number, number>();
        relationships.forEach(r => nodeWeightMap.set(r.s, (nodeWeightMap.get(r.s) ?? 0) + r.w));
        for (const [nodeIndex, weight] of nodeWeightMap) {
          if (weight > 1.01 || weight < 0.99) {
            throw new Error(`Relationships weight error, node=${nodeIds[nodeIndex]}, weight=${weight}`);
          }
        }

        // calculate openrank
        const graphName = `global_openrank_${yyyymm}`;
        await neo4j.query('CALL gds.graph.drop($graphName, false)', { graphName });
        const cypher = 'CALL gds.graph.project.cypher($graphName, $nodesQuery, $relsQuery, { parameters: { nodes: $nodes, rels: $rels}});';
        await neo4j.query(cypher, {
          graphName,
          nodesQuery: 'UNWIND $nodes AS n RETURN n.id AS id, n.i AS initValue, n.r AS retentionFactor',
          relsQuery: 'UNWIND $rels AS r RETURN r.s AS source, r.t AS target, r.w AS weight',
          nodes,
          rels: relationships,
        });
        logger.info(`Create graph ${graphName} done.`);
        const openrankResult = new Map<string, number>();
        await neo4j.queryStream(`CALL xlab.pregel.openrank.stream('${graphName}',{
          initValueProperty:'initValue',
          retentionFactorProperty:'retentionFactor',
          relationshipWeightProperty:'weight',
          tolerance:0.01,
          maxIterations:100,
          writeProperty:''
        }) YIELD nodeId AS i, values AS v RETURN i, v.open_rank AS o`,
          async row => {
            const { i, o } = row;
            const id = nodeIds[i];
            if (openrankResult.has(id)) {
              logger.error(`Duplicate openrank result for ${i}:${id}`);
            }
            openrankResult.set(id, o);
          });
        await neo4j.query('CALL gds.graph.drop($graphName, false)', { graphName });
        logger.info(`Calculate for ${yyyymm} openrank results done, ${openrankResult.size} nodes retruned.`);

        // write back to clickhouse
        const backgroundOpenrank = openrankResult.get(bgId)!;
        const additionalOpenrank = backgroundOpenrank / (nodeIds.length - 1);
        await clickhouse.insertRecords(Array.from(openrankResult.entries()).map(r => {
          const [type, platform, id] = r[0].split('_');
          if (type === 'Background') return null;
          return {
            repo_id: type === 'Repo' ? +id : 0,
            actor_id: type === 'User' ? +id : 0,
            ...nodeMap.get(r[0])!.info,
            platform,
            type,
            legacy: 0,
            created_at: `${year}-${month.toString().padStart(2, '0')}-01 00:00:00`,
            openrank: r[1] + additionalOpenrank,
          };
        }).filter(r => r), globalOpenrankTableName);
        logger.info(`Insert openrank result for ${yyyymm} done.`);

        // openrank decrease for not active nodes
        const insertLegacyNodes: any[] = [];
        for (const [id, data] of lastMonthOpenrank) {
          if (!openrankResult.has(id) && data.openrank > openrankMinValue) {
            // not active in this month and openrank greater than min value
            const [type, platform, _id] = id.split('_');
            insertLegacyNodes.push({
              repo_id: type === 'Repo' ? +_id : 0,
              actor_id: type === 'User' ? +_id : 0,
              ...data.info,
              platform,
              type,
              legacy: 1,
              created_at: `${year}-${month.toString().padStart(2, '0')}-01 00:00:00`,
              openrank: data.openrank * openrankAttenuationFactor,
            });
          }
        }
        if (insertLegacyNodes.length > 0) {
          logger.info(`Gonna insert ${insertLegacyNodes.length} legacy nodes for ${yyyymm}.`);
          await clickhouse.insertRecords(insertLegacyNodes, globalOpenrankTableName);
        }
        return true;
      } catch (e: any) {
        logger.error(`Error on calculating global openrank for ${yyyymm}, err=${e.message}`);
        return false;
      }
    };

    // start process
    await createTable();
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    await forEveryMonth(2015, 1, now.getFullYear(), now.getMonth() + 1, async (y, m) => {
      while (true) {
        if (await calcualteForMonth(y, m)) {
          break;
        }
      }
    });

  },
};

module.exports = task;
