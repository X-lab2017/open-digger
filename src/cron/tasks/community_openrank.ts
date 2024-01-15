import { Task } from '..';
import { forEveryMonth } from '../../metrics/basic';
import { getLogger, waitUntil } from '../../utils';
import { StaticPool } from 'node-worker-threads-pool';
import { query as queryClickhouse, queryStream as queryStreamClickhouse, getNewClient } from '../../db/clickhouse';
import { query as queryNeo4j, queryStream as queryStreamNeo4j } from '../../db/neo4j';
import { Readable } from 'stream';

enum CalcStatus {
  Normal = 1,
  TooLarge = 2,
}

const task: Task = {
  cron: '0 0 15 1 * *',
  callback: async () => {
    const logger = getLogger('CommunityOpenRankTask');

    const openrankTable = 'community_openrank';
    const localWorkerNumber = 12;
    const neo4jWorkerNumber = 4;
    const lagecyOpenrankMonthCount = 3;
    const localCalcBatch = 2000;

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
    \`platform\` Enum8('GitHub' = 1, 'Gitee' = 2, 'AtomGit' = 3, 'GitLab.com' = 4, 'Gitea' = 5, 'GitLab.cn' = 6),
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
    };

    const loadCalculateRepos = async (y: number, m: number) => {
      const yyyymm = `${y}${m.toString().padStart(2, '0')}`;
      const q = `SELECT platform, repo_id, groupArray((actor_id, issue_number, activity, merged)) AS rels FROM
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
  MAX(pull_merged) AS merged
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
GROUP BY repo_id, platform`;
      const list: any[] = await queryClickhouse(q, { format: 'JSONCompactEachRow' });
      return list;
    }

    const splitArrayIntoChunks = <T = any>(array: T[], chunkSize: number): T[][] => {
      const chunks: T[][] = [];
      const length = array.length;
      let index = 0;

      while (index < length) {
        const chunk = array.slice(index, index + chunkSize);
        chunks.push(chunk);
        index += chunkSize;
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
      logger.info(`Loaded ${actorNameMap.size} actors, ${repoNameMap.size} repos.`);

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

      for (const list of processLists) {
        localWorkerProcessing++;
        list.sort((a, b) => b[1].length - a[1].length);
        workerPool.exec({
          data: list,
          cor: prepareCor(list, ctx),
          ctx,
        }, -1).then(async res => {
          const results = res.results;
          for (const result of results) {
            const { status, values, repoId, platform } = result;
            if (status === CalcStatus.Normal) {
              for (const [idStr, openrank] of values) {
                saveRecord(platform, repoId, idStr, openrank);
              }
            } else {
              neo4jWaitingNumber++;
              calcByNeo4j({ details: result.details, repoId, y, m }).then(res => {
                const { size, stat, list } = res;
                for (const item of list) {
                  saveRecord(platform, repoId, item.id, item.openrank);
                }
                if (!elpsMap.has(size)) elpsMap.set(size, { count: 0, elps: 0 });
                Object.keys(stat).forEach(k => { elpsMap.get(size)![k] += stat[k]; });
                neo4jWorkerProcessing--;
                neo4jWaitingNumber--;
              });
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
      waitUntil(() => localWorkerProcessing === 0 && neo4jWaitingNumber === 0).then(() => stream.push(null));
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

const localCalcTask = (param: { data: any[], cor: any, ctx: any[] }) => {
  const { multiply, inv, subtract, add, identity, zeros } = require('mathjs');
  const elpsMap = new Map();
  const { data, cor, ctx } = param;

  const calculateForRepo = (repoId: string, rels: any[]) => {
    const start = new Date().getTime();
    const nodes = new Set();
    const activityMap = new Map();
    const mergeSet = new Set();
    rels.forEach(r => {
      const uId = 'u' + r[0];
      const iId = 'i' + r[1];
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
    nodesArr.push('bg');
    const c0: any = add(zeros(nodesArr.length), nodesArr.map(id => {
      const lagecyIndex = ctx.findIndex(c => cor[`${repoId}_${id}_${c}`] > 0);
      let openrank = lagecyIndex >= 0 ? cor[`${repoId}_${id}_${ctx[lagecyIndex]}`] * Math.pow(0.85, lagecyIndex) : 1;
      if (mergeSet.has(id)) openrank *= 1.5;
      return openrank;
    }));
    const nodeIndexMap = new Map(nodesArr.map((k, i) => [k, i]));

    if (nodesArr.length < 200) {
      const e: any = identity(nodesArr.length);
      const am: any = zeros(nodesArr.length, nodesArr.length);
      const s: any = zeros(nodesArr.length, nodesArr.length);

      rels.forEach(r => {
        const [uId, iId, activity] = r;
        s.set([nodeIndexMap.get(uId), nodeIndexMap.get(iId)], 0.95 * activity / activityMap.get(iId));
        s.set([nodeIndexMap.get(iId), nodeIndexMap.get(uId)], 0.95 * activity / activityMap.get(uId));
      });
      const averagePartial = 1 / nodes.size;
      for (let i = 0; i < nodes.size; i++) {
        s.set([i, nodes.size], averagePartial);
        s.set([nodes.size, i], 0.05);
        am.set([i, i], 0.85);
      }
      am.set([nodes.size, nodes.size], 0.85);

      const res = multiply(multiply(inv(subtract(e, multiply(am, s))), subtract(e, am)), c0);
      const end = new Date().getTime();
      const elps = end - start;
      if (!elpsMap.has(size)) elpsMap.set(size, { count: 0, elps: 0, matrixElps: 0 });
      const origin = elpsMap.get(size);
      elpsMap.set(size, {
        count: origin.count + 1,
        elps: origin.elps + elps,
      });
      return {
        status: 1,
        values: nodesArr.map((v, i) => [v, res._data[i]]),
      };
    }
    const relationships: any[] = [];
    rels.forEach(r => {
      const [uId, iId, activity] = r;
      relationships.push({
        s: nodeIndexMap.get(iId),
        t: nodeIndexMap.get(uId),
        w: 0.95 * activity / activityMap.get(iId),
      });
      relationships.push({
        s: nodeIndexMap.get(uId),
        t: nodeIndexMap.get(iId),
        w: 0.95 * activity / activityMap.get(uId),
      });
    });
    return {
      status: 2,
      details: {
        ids: nodesArr,
        nodes: nodesArr.map((_, index) => {
          return {
            id: index,
            i: c0.get([index]),
            r: 0.15,
          };
        }),
        rels: relationships,
      },
    };

  };
  const results: any[] = [];
  for (const row of data) {
    const [platform, repoId, rels] = row;
    const res = calculateForRepo(repoId, rels);
    results.push({ platform, repoId, ...res });
  }
  return {
    results,
    elps: Array.from(elpsMap.entries()),
  };
};


module.exports = task;
