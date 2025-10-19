import { Task } from '..';
import { forEveryMonth } from '../../metrics/basic';
import { getLogger, waitUntil } from '../../utils';
import { StaticPool } from 'node-worker-threads-pool';
import { query as queryClickhouse, queryStream as queryStreamClickhouse, getNewClient } from '../../db/clickhouse';
import { query as queryNeo4j, queryStream as queryStreamNeo4j } from '../../db/neo4j';
import { Readable } from 'stream';
// import { join } from 'path';
// import getConfig from '../../config';
// import { mkdirSync, readFileSync, writeFileSync } from 'fs';

enum CalcStatus {
  Normal = 1,
  TooLarge = 2,
}

// interface ExportDataType {
//   meta: {
//     repoId: number;
//     platform: string;
//     repoName: string;
//     retentionFactor: number;
//     backgroundRatio: number;
//     nodes: string[][];  // [id,name], for id: repo starts with r, user starts with u, issue starts with i, pr starts with p
//   },
//   data: {
//     [key: string]: {
//       openrank: number;
//       nodes: any[][];   // [index, initial value, openrank]
//       links: any[][];   // [source index, target index, weight]
//     };
//   },
// };

const task: Task = {
  cron: '0 0 15 1 * *',
  callback: async () => {
    const logger = getLogger('CommunityOpenRankTask');
    // const config = await getConfig();

    const openrankTable = 'community_openrank';
    const localWorkerNumber = 12;
    const neo4jWorkerNumber = 4;
    const lagecyOpenrankMonthCount = 3;
    const localCalcBatch = 30000;

    // counters
    let localWorkerProcessing = 0;
    let neo4jWorkerProcessing = 0;
    let neo4jWaitingNumber = 0;

    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));

    const cor = new Map<string, Map<string, Map<string, Map<string, number>>>>();
    const actorNameMap = new Map<string, string>();
    const repoNameMap = new Map<string, string>();
    const repoOrgMap = new Map<string, { id: string, login: string }>();
    const issueTitleMap = new Map<string, string>();
    const workerPool: StaticPool<any, any> = new StaticPool({
      size: localWorkerNumber,
      task: localCalcTask,
      resourceLimits: {
        maxOldGenerationSizeMb: 2048,
      }
    });
    logger.info(`Init local community openrank serivce with ${localWorkerNumber} workers and ${neo4jWorkerNumber} neo4j concurrent workers.`);

    const createTable = async () => {
      const q = `CREATE TABLE IF NOT EXISTS ${openrankTable}
  (
    \`platform\` LowCardinality(String),
    \`repo_id\` UInt64,
    \`repo_name\` LowCardinality(String),
    \`org_id\` UInt64,
    \`org_login\` LowCardinality(String),
    \`actor_id\` UInt64,
    \`actor_login\` LowCardinality(String),
    \`issue_number\` UInt32,
    \`created_at\` DateTime,
    \`openrank\` Float
  )
  ENGINE = MergeTree
  ORDER BY (repo_id, created_at)
  SETTINGS index_granularity = 8192`;
      queryClickhouse(q);
    }

    const updateCor = (platform: string, repoId: string, yyyymm: string, id: string, openrank: number) => {
      if (!cor.has(platform)) cor.set(platform, new Map<string, Map<string, Map<string, number>>>());
      if (!cor.get(platform)!.has(repoId)) cor.get(platform)!.set(repoId, new Map<string, Map<string, number>>());
      if (!cor.get(platform)!.get(repoId)!.has(yyyymm)) cor.get(platform)!.get(repoId)!.set(yyyymm, new Map<string, number>());
      cor.get(platform)!.get(repoId)!.get(yyyymm)!.set(id, openrank);
    }

    const loadOpenrankHistory = async (ctx: string[]): Promise<void> => {
      if (cor.size === 0) {
        // load for first time
        const query = `SELECT platform, repo_id, actor_id, issue_number, openrank, toString(toYYYYMM(created_at)) AS t from ${openrankTable} WHERE t IN (${ctx.join(',')})`;
        await queryStreamClickhouse(query, row => {
          const [platform, repoId, uId, iId, openrank, yyyymm] = row;
          if (uId > 0) updateCor(platform, repoId, yyyymm, `u${uId}`, openrank);
          else if (iId > 0) updateCor(platform, repoId, yyyymm, `i${uId}`, openrank);
          else updateCor(platform, repoId, yyyymm, repoId, openrank);
        }, { format: 'JSONCompactEachRow' });
      } else {
        // for further time, delete unused data
        for (const m of cor.values()) {
          ctx.forEach(c => m.delete(c));
        }
      }
    }

    const prepareCor = (data: any[], ctx: string[]) => {
      const _cor: any = {};
      for (const [platform, repoId] of data) {
        if (!cor.has(platform)) continue;
        if (!cor.get(platform)!.has(repoId)) continue;
        for (const c of ctx) {
          if (!cor.get(platform)!.get(repoId)!.has(c)) continue;
          for (const [id, openrank] of cor.get(platform)!.get(repoId)!.get(c)!.entries()) {
            _cor[`${repoId}_${id}_${c}`] = openrank;
          }
        }
      }
      return _cor;
    }

    const calcByNeo4j = async (p: any) => {
      await waitUntil(() => neo4jWorkerProcessing < neo4jWorkerNumber, { interval: 10 });
      neo4jWorkerProcessing++;
      const startTimeStamp = new Date().getTime();
      const { ids, nodes, rels } = p.details;
      const graphName = `${p.repoId}_${p.y}${p.m}`;
      await queryNeo4j('CALL gds.graph.drop($graphName, false)', { graphName });
      const cypher = 'CALL gds.graph.project.cypher($graphName, $nodesQuery, $relsQuery, { parameters: { nodes: $nodes, rels: $rels}});';
      await queryNeo4j(cypher, {
        graphName,
        nodesQuery: 'UNWIND $nodes AS n RETURN n.id AS id, n.i AS initValue, n.r AS retentionFactor',
        relsQuery: 'UNWIND $rels AS r RETURN r.s AS source, r.t AS target, r.w AS weight',
        nodes,
        rels,
      });
      const result: any[] = [];
      await queryStreamNeo4j(`CALL xlab.pregel.openrank.stream('${graphName}',{initValueProperty:'initValue',retentionFactorProperty:'retentionFactor',relationshipWeightProperty:'weight',tolerance:0.01,maxIterations:40,writeProperty:''}) YIELD nodeId AS i, values AS v RETURN *`,
        async row => {
          const { i, v } = row;
          result.push({ id: ids[i], openrank: v.open_rank });
        });
      await queryNeo4j('CALL gds.graph.drop($graphName, false)', { graphName });
      return {
        size: Math.ceil(Math.log(nodes.length - 1)),
        stat: { count: 1, elps: new Date().getTime() - startTimeStamp },
        list: result,
      };
    }

    const prepareContext = (y: number, m: number) => {
      return Array.from(new Array(lagecyOpenrankMonthCount).keys())
        .map(i => new Date(new Date(`${y}-${m}`).setMonth(m - i - 2)))
        .map(d => `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    }

    const loadNames = async (y: number, m: number) => {
      repoNameMap.clear();
      repoOrgMap.clear();
      actorNameMap.clear();
      issueTitleMap.clear();
      const yyyymm = `${y}${m.toString().padStart(2, '0')}`;
      const repoResult = await queryClickhouse<string[]>(`SELECT platform, repo_id, argMax(repo_name, created_at), argMax(org_id, created_at), argMax(org_login, created_at) FROM events WHERE toYYYYMM(created_at) = ${yyyymm} AND repo_id IN (SELECT id FROM export_repo) GROUP BY repo_id, platform`, { format: 'JSONCompactEachRow' });
      repoResult.forEach(row => {
        const [platform, repoId, repoName, orgId, orgLogin] = row;
        repoNameMap.set(`${platform}_${repoId}`, repoName);
        repoOrgMap.set(`${platform}_${repoId}`, { id: orgId, login: orgLogin });
      });
      const actorResult = await queryClickhouse<string[]>(`SELECT platform, actor_id, argMax(actor_login, created_at) FROM events WHERE toYYYYMM(created_at) = ${yyyymm} AND repo_id IN (SELECT id FROM export_repo) GROUP BY actor_id, platform`, { format: 'JSONCompactEachRow' });
      actorResult.forEach(row => {
        const [platform, actorId, actorLogin] = row;
        actorNameMap.set(`${platform}_${actorId}`, actorLogin);
      });
      const issueResult = await queryClickhouse<string[]>(`SELECT platform, repo_id, issue_number, substring(any(issue_title), 1, 256) FROM events WHERE toYYYYMM(created_at) = ${yyyymm} AND repo_id IN (SELECT id FROM export_repo) AND issue_number > 0 GROUP BY platform, repo_id, issue_number`, { format: 'JSONCompactEachRow' });
      issueResult.forEach(row => {
        const [platform, repoId, issueNumber, title] = row;
        issueTitleMap.set(`${platform}_${repoId}_${issueNumber}`, title);
      });
    };

    const loadCalculateRepos = async (y: number, m: number) => {
      const yyyymm = `${y}${m.toString().padStart(2, '0')}`;
      const q = `
SELECT
  a.platform AS platform,
  a.repo_id AS repo_id,
  argMax(go.repo_name, go.created_at) AS repo_name,
  sumIf(go.openrank, toYYYYMM(go.created_at) = ${yyyymm}) AS openrank,
  any(a.rels) AS rels
FROM
  (SELECT platform, repo_id, groupArray((actor_id, issue_number, activity, merged, is_pull)) AS rels FROM
    (SELECT
      repo_id,
      platform,
      issue_number,
      actor_id,
      ROUND(countIf(type='IssuesEvent' AND action='opened') * 22.235 +
      countIf(type='IssueCommentEvent') * 5.252 +
      countIf(type='IssuesEvent' AND action='closed') * 9.712 + 
      countIf(type='PullRequestReviewCommentEvent') * 7.427 + 
      countIf(type='PullRequestEvent' AND action='opened') * 40.679 + 
      countIf(type='PullRequestEvent' AND action='closed') * 14.695, 3) AS activity,
      MAX(pull_merged) AS merged,
      countIf(type IN ('PullRequestEvent', 'PullRequestReviewCommentEvent')) AS is_pull
    FROM
      events
    WHERE
      toYYYYMM (created_at) = ${yyyymm}
      AND repo_id IN (SELECT id FROM export_repo)
      AND repo_id NOT IN (SELECT repo_id FROM ${openrankTable} WHERE toYYYYMM(created_at) = ${yyyymm})
      AND type IN (
        'IssuesEvent',
        'IssueCommentEvent',
        'PullRequestEvent',
        'PullRequestReviewCommentEvent'
      )
    GROUP BY
      repo_id,
      issue_number,
      actor_id,
      platform
    HAVING activity > 0)
  GROUP BY repo_id, platform) a,
  global_openrank go
WHERE
  a.platform = go.platform
  AND a.repo_id = go.repo_id
GROUP BY
  platform, repo_id
`;
      const list: any[] = await queryClickhouse(q, { format: 'JSONCompactEachRow' });
      return list;
    }

    const splitArrayIntoChunks = (array: any[], chunkSize: number): any[][] => {
      const chunks: any[][] = [];
      let chunk: any[] = [];
      for (const item of array) {
        chunk.push(item);
        if (chunk.map(i => i[4].length).reduce((p, c) => p + c) >= chunkSize) {
          chunks.push(chunk);
          chunk = [];
        }
      }
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      return chunks;
    }

    const calculateForMonth = async (y: number, m: number): Promise<any> => {
      const start = new Date().getTime();
      const ctx = prepareContext(y, m);

      const createdAt = `${y}-${m.toString().padStart(2, '0')}-01 00:00:00`;

      const lists = await loadCalculateRepos(y, m);
      logger.info(`Got ${lists.length} repos to calculate, context is ${ctx}`);
      if (lists.length === 0) return;

      await loadNames(y, m);
      logger.info(`Loaded ${actorNameMap.size} actors, ${repoNameMap.size} repos, ${issueTitleMap.size} issues.`);

      await loadOpenrankHistory(ctx);
      const elpsMap = new Map<number, { count: number; elps: number; }>();
      const processLists: any[] = splitArrayIntoChunks(lists, localCalcBatch);

      // prepare insert client and stream
      const client = await getNewClient();
      const stream = new Readable({
        objectMode: true,
        read: () => { /* stub */ },
      });

      const saveRecord = (platform: string, repoId: string, idStr: string, openrank: number) => {
        const type = idStr.substring(0, 1);
        const id = parseInt(idStr.substring(1));
        const repoName = repoNameMap.get(`${platform}_${repoId}`);
        const orgInfo = repoOrgMap.get(`${platform}_${repoId}`);
        if (!repoName || !orgInfo) {
          logger.error(`Can not find repo name or org info for ${platform}_${repoId}`);
          return;
        }
        const record: any = {
          repo_id: parseInt(repoId),
          repo_name: repoName,
          org_id: parseInt(orgInfo.id),
          org_login: orgInfo.login,
          platform,
          openrank,
          created_at: createdAt,
        };
        if (type === 'i') {
          record.issue_number = id;
        } else if (type === 'u') {
          record.actor_id = id;
          const actorName = actorNameMap.get(`${platform}_${id}`);
          if (!actorName) {
            logger.error(`Can not find actor name for ${platform}_${id}`);
            return;
          }
          record.actor_login = actorName;
        }
        stream.push(record);
        updateCor(platform, repoId, `${y}${m.toString().padStart(2, '0')}`, idStr === 'bg' ? repoId : idStr, openrank);
      };
      // const yyyymm = `${y}${m.toString().padStart(2, '0')}`;

      // const saveExportData = async (param: { platform: string, exportData: any }) => {
      //   const { platform, exportData } = param;
      //   const repoName = exportData.meta.repoName;
      //   const exportFileDir = join(config.export.path, platform.toLowerCase(), repoName);
      //   const exportFilePath = join(exportFileDir, 'community_openrank.json');
      //   mkdirSync(exportFileDir, { recursive: true });
      //   let data: ExportDataType = {
      //     meta: {
      //       repoId: +exportData.meta.repoId,
      //       platform,
      //       repoName,
      //       retentionFactor: 0.15,
      //       backgroundRatio: 0.05,
      //       nodes: [],
      //     },
      //     data: {},
      //   };
      //   try {
      //     data = JSON.parse(readFileSync(exportFilePath).toString());
      //   } catch { }
      //   try {
      //     const nodeArrayMap = new ArrayMap<string[]>(data.meta.nodes, n => n[0]);
      //     nodeArrayMap.add(['r' + exportData.meta.repoId, repoName]);
      //     for (let i = 0; i < exportData.nodes.length; i++) {
      //       const node = exportData.nodes[i];
      //       if (node.id[0] === 'u') {
      //         // set user login
      //         nodeArrayMap.add([node.id, actorNameMap.get(`${platform}_${node.id.slice(1)}`)!]);
      //       } else if (node.id[0] === 'i' || node.id[0] === 'p') {
      //         // set issue title
      //         nodeArrayMap.add([exportData.nodes[i].id, issueTitleMap.get(`${platform}_${exportData.meta.repoId}_${node.id.slice(1)}`)!]);
      //       }
      //     }
      //     data.meta.nodes = nodeArrayMap.getArray();
      //     data.data[yyyymm] = {
      //       openrank: exportData.meta.openrank,
      //       nodes: exportData.nodes.map(n => [nodeArrayMap.getIndex(n.id)!, n.i, n.v]),
      //       links: exportData.links.map(l => [nodeArrayMap.getIndex(l.s)!, nodeArrayMap.getIndex(l.t)!, l.w]),
      //     };
      //   } catch (e) {
      //     console.log(e, exportFilePath);
      //   }
      //   try {
      //     writeFileSync(exportFilePath, JSON.stringify(data));
      //   } catch (e) {
      //     logger.error(`Error on save export data, repoName=${repoName}, ${e}`);
      //   }
      // };
      for (const list of processLists) {
        localWorkerProcessing++;
        workerPool.exec({
          data: list,
          cor: prepareCor(list, ctx),
          ctx,
        }, -1).then(async res => {
          const results = res.results;
          for (const result of results) {
            const { status, values, repoId, platform, exportData } = result;
            if (status === CalcStatus.Normal) {
              for (const [idStr, openrank] of values) {
                saveRecord(platform, repoId, idStr, openrank);
              }
              // saveExportData({ platform, exportData });
            } else {
              neo4jWaitingNumber++;
              let calcFinished = false;
              while (!calcFinished) {
                // neo4j call may fail, retry until success
                try {
                  const res = await calcByNeo4j({ details: result.details, repoId, y, m });
                  const { size, stat, list } = res;
                  const nodeOpenrankMap = new Map<string, number>();
                  for (const item of list) {
                    saveRecord(platform, repoId, item.id, item.openrank);
                    nodeOpenrankMap.set(item.id, item.openrank);
                  }
                  exportData.nodes.forEach(n => n.v = +nodeOpenrankMap.get(n.id)!.toFixed(3));
                  if (!elpsMap.has(size)) elpsMap.set(size, { count: 0, elps: 0 });
                  Object.keys(stat).forEach(k => { elpsMap.get(size)![k] += stat[k]; });
                  // saveExportData({ platform, exportData });
                  calcFinished = true;
                } catch (e) {
                  logger.error(`Error on calc by neo4j, ${repoId}, ${e}`);
                } finally {
                  neo4jWorkerProcessing--;
                }
              }
              neo4jWaitingNumber--;
            }
          }
          const elps = res.elps;
          for (const [size, stat] of elps) {
            if (!elpsMap.has(size)) elpsMap.set(size, { count: 0, elps: 0 });
            Object.keys(stat).forEach(k => { elpsMap.get(size)![k] += stat[k]; });
          }
          localWorkerProcessing--;
        }).catch(e => logger.error(e));
      }
      waitUntil(() => localWorkerProcessing === 0 && neo4jWaitingNumber === 0).then(() => {
        logger.info('All insert finished, push the null to stop.');
        stream.push(null);
      });
      await client.insert({
        table: openrankTable,
        values: stream,
        format: 'JSONEachRow',
      });
      await client.close();
      const end = new Date().getTime();
      logger.info(`Total time for ${y}-${m} is ${end - start}ms`);
      logger.info(`${JSON.stringify(Array.from(elpsMap.entries()).map(v => ({ size: v[0], elps: Math.round(v[1].elps / v[1].count), count: v[1].count })))}`);
    }

    await createTable();
    await forEveryMonth(2015, 1, lastMonth.getFullYear(), lastMonth.getMonth() + 1, async (y, m) => {
      await calculateForMonth(y, m);
    });
  },
};

const localCalcTask = (param: { data: any[], cor: any, ctx: any[], exportPath: string }) => {
  const { multiply, inv, subtract, add, identity, zeros } = require('mathjs');
  const elpsMap = new Map();
  const { data, cor, ctx } = param;
  const retentionFactor = 0.15;
  const backgroundRatio = 0.05;
  const prMergeRatio = 1.5;
  const attenuationFactor = 0.85;
  const nodeSizeThreshold = 200;

  const calculateForRepo = (row: any[]) => {
    const start = new Date().getTime();
    const [_platform, repoId, repoName, openrank, rels] = row;
    const nodes = new Set<any>();
    const activityMap = new Map();
    const mergeSet = new Set();
    rels.forEach(r => {
      const isPull = +r[4] > 0;
      const uId = 'u' + r[0];
      const iId = (isPull ? 'p' : 'i') + r[1];
      nodes.add(uId);
      nodes.add(iId);
      r[0] = uId;
      r[1] = iId;
      activityMap.set(uId, (activityMap.get(uId) ?? 0) + r[2]);
      activityMap.set(iId, (activityMap.get(iId) ?? 0) + r[2]);
      if (r[3] === 1) {
        mergeSet.add(iId);
      }
    });
    const size = Math.ceil(Math.log(nodes.size));
    const nodesArr = Array.from(nodes);
    nodesArr.push(`r${repoId}`);
    const c0: any = add(zeros(nodesArr.length), nodesArr.map(id => {
      const lagecyIndex = ctx.findIndex(c => cor[`${repoId}_${id}_${c}`] > 0);
      let openrank = lagecyIndex >= 0 ? cor[`${repoId}_${id}_${ctx[lagecyIndex]}`] * Math.pow(attenuationFactor, lagecyIndex) : 1;
      if (mergeSet.has(id)) openrank *= prMergeRatio;
      return openrank;
    }));  // initial value
    const nodeIndexMap = new Map(nodesArr.map((k, i) => [k, i]));
    const exportLinks: { s: any; t: any; w: number }[] = [];
    rels.forEach(r => {
      const [uId, iId, activity] = r;
      exportLinks.push({ s: iId, t: uId, w: +((1 - backgroundRatio) * activity / activityMap.get(iId)).toFixed(3) });
      exportLinks.push({ s: uId, t: iId, w: +((1 - backgroundRatio) * activity / activityMap.get(uId)).toFixed(3) });
    });
    const averagePartial = 1 / nodes.size;
    const exportNodes: any[] = nodesArr.map((n) => ({ id: n, i: +c0.get([nodeIndexMap.get(n)!]).toFixed(3) }));

    if (nodesArr.length < nodeSizeThreshold) {
      const e: any = identity(nodesArr.length);
      const am: any = zeros(nodesArr.length, nodesArr.length);  // damping factor
      const s: any = zeros(nodesArr.length, nodesArr.length);   // adjacency matrix

      rels.forEach(r => {
        const [uId, iId, activity] = r;
        s.set([nodeIndexMap.get(uId), nodeIndexMap.get(iId)], (1 - backgroundRatio) * activity / activityMap.get(iId));
        s.set([nodeIndexMap.get(iId), nodeIndexMap.get(uId)], (1 - backgroundRatio) * activity / activityMap.get(uId));
      });
      for (let i = 0; i < nodes.size; i++) {
        s.set([i, nodes.size], averagePartial);
        s.set([nodes.size, i], backgroundRatio);
        am.set([i, i], 1 - retentionFactor);
      }
      am.set([nodes.size, nodes.size], 1 - retentionFactor);

      const res = multiply(multiply(inv(subtract(e, multiply(am, s))), subtract(e, am)), c0);
      const end = new Date().getTime();
      const elps = end - start;
      if (!elpsMap.has(size)) elpsMap.set(size, { count: 0, elps: 0, matrixElps: 0 });
      const origin = elpsMap.get(size);
      elpsMap.set(size, {
        count: origin.count + 1,
        elps: origin.elps + elps,
      });
      res._data.forEach((v, i) => exportNodes[i].v = +v.toFixed(3));
      return {
        status: 1,
        values: nodesArr.map((v, i) => [v, res._data[i]]),
        exportData: {
          meta: {
            repoId,
            repoName,
            openrank,
            retentionFactor,
            backgroundRatio,
          },
          nodes: exportNodes,
          links: exportLinks,
        },
      };
    }
    const relationships: any[] = [];
    rels.forEach(r => {
      const [uId, iId, activity] = r;
      relationships.push({
        s: nodeIndexMap.get(iId),
        t: nodeIndexMap.get(uId),
        w: (1 - backgroundRatio) * activity / activityMap.get(iId),
      });
      relationships.push({
        s: nodeIndexMap.get(uId),
        t: nodeIndexMap.get(iId),
        w: (1 - backgroundRatio) * activity / activityMap.get(uId),
      });
    });
    for (let i = 0; i < nodesArr.length - 1; i++) {
      relationships.push({
        s: nodeIndexMap.get(nodesArr[i]),
        t: nodesArr.length - 1,
        w: backgroundRatio,
      });
      relationships.push({
        s: nodesArr.length - 1,
        t: nodeIndexMap.get(nodesArr[i]),
        w: averagePartial,
      });
    }
    return {
      status: 2,
      exportData: {
        meta: {
          repoId,
          repoName,
          openrank,
          retentionFactor,
          backgroundRatio,
        },
        nodes: exportNodes,
        links: exportLinks,
      },
      details: {
        ids: nodesArr,
        nodes: nodesArr.map((_, index) => {
          return {
            id: index,
            i: c0.get([index]),
            r: retentionFactor,
          };
        }),
        rels: relationships,
      },
    };

  };
  const results: any[] = [];
  for (const row of data) {
    const [platform, repoId] = row;
    const res = calculateForRepo(row);
    results.push({ platform, repoId, ...res });
  }
  return {
    results,
    elps: Array.from(elpsMap.entries()),
  };
};

module.exports = task;
