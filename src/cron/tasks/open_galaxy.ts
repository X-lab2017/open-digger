import { Task } from "..";
import { runQueryStream } from "../../db/neo4j";
import { forEveryMonth } from "../../metrics/basic";
import getConfig from '../../config';
import createGraph from 'ngraph.graph';
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
var createLayout = require('ngraph.offline.layout');
var save = require('ngraph.tobinary');

/**
 * This task is used to generate data for open galaxy
 * https://github.com/X-lab2017/open-galaxy
 */
const task: Task = {
  cron: '0 0 5 * *',
  enable: true,
  immediate: true,
  callback: async () => {
    const forceClear = true;

    const config = await getConfig();
    const exportBasePath = config.export.galaxyPath;
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    await forEveryMonth(2015, 1, lastMonth.getFullYear(), lastMonth.getMonth() + 1, async (y, m) => {
      console.log(`Gonna export ${y}-${m}`);
      const nodeMap = new Map<string, any>();
      const edgeArr: any[] = [];
      await runQueryStream(`MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE r.open_rank_${y}${m} > e() AND u.open_rank_${y}${m} > e() AND a.activity_${y}${m} > 2 RETURN id(r) AS rid, r.name AS repoName, ROUND(r.open_rank_${y}${m}, 2) AS ror, id(u) AS uid, u.login AS userName, ROUND(u.open_rank_${y}${m}, 2) AS uor, a.activity_${y}${m} AS activity`, async r => {
        nodeMap.set(r.rid, { t: 'r', n: r.repoName, or: r.ror });
        nodeMap.set(r.uid, { t: 'u', n: r.userName, or: r.uor });
        edgeArr.push({ from: r.uid, to: r.rid, weight: r.activity });
      });
      console.log(`Load graph done, node size is ${nodeMap.size}, edge size is ${edgeArr.length}`);
      const g = createGraph();
      for (const n of nodeMap.entries()) {
        g.addNode(n[0], n[1]);
      }
      var maxWeight = 0;
      for (const e of edgeArr) {
        const link: any = g.addLink(e.from, e.to);
        link.length = e.weight;
        if (e.weight > maxWeight) maxWeight = e.weight;
      }
      // adjust link length
      const maxLength = 30, minLength = 10;
      g.forEachLink(link => {
        (link as any).length = maxLength - (((link as any).length / maxWeight) * (maxLength - minLength) + minLength) + minLength;
      });

      const exportPath = join(exportBasePath, `${y}-${m}`);
      if (forceClear && existsSync(exportPath)) {
        rmSync(exportPath, { recursive: true });
      }
      if (!existsSync(exportPath)) {
        mkdirSync(exportPath, { recursive: true });
      }
      save(g, {
        outDir: exportPath,
        labels: 'labels_origin.json',
      });

      const nodeIds = JSON.parse(readFileSync(join(exportPath, 'labels_origin.json')).toString());
      writeFileSync(join(exportPath, 'labels.json'), JSON.stringify(nodeIds.map(id => nodeMap.get(id))));
      rmSync(join(exportPath, 'labels_origin.json'));

      const layout = createLayout(g, {
        iterations: 3000,
        saveEach: 3000,
        timeStep: 2,
        outDir: exportPath,
        layoutOptions: {
          nodeMass: id => g.getNode(id)?.data.or,
        }
      });
      layout.run(true);
    });
  },
};

module.exports = task;
