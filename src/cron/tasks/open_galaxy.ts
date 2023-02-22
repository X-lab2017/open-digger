import { Task } from "..";
import { runQueryStream } from "../../db/neo4j";
import { forEveryMonth } from "../../metrics/basic";
import getConfig from '../../config';
import createGraph from 'ngraph.graph';
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
var createLayout = require('ngraph.offline.layout');
var save = require('ngraph.tobinary');

interface Node {
  id: string; // id of the node
  t: string;  // type of the node
  n: string;  // name of the node
  or: Number; // OpenRank of the node
};
/**
 * This task is used to generate data for open galaxy
 * https://github.com/X-lab2017/open-galaxy
 */
const task: Task = {
  cron: '0 0 5 * *',
  enable: true,
  immediate: true,
  callback: async () => {
    const forceClear = false;

    const config = await getConfig();
    const exportBasePath = config.export.galaxyPath;
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const labelsFileName = 'labels.json', originLabelsFileName = 'labels_origin.json', linksFileName = 'links.bin', positionsFileName = 'positions.bin';

    const lastPositionMap = new Map<string, Number[]>();

    await forEveryMonth(2015, 1, lastMonth.getFullYear(), lastMonth.getMonth() + 1, async (y, m) => {
      console.log(`Gonna export ${y}-${m}`);

      // save the graph
      const exportPath = join(exportBasePath, `${y}${m.toString().padStart(2, '0')}`);
      if (forceClear && existsSync(exportPath)) {
        rmSync(exportPath, { recursive: true });
      }
      if (!existsSync(exportPath)) {
        mkdirSync(exportPath, { recursive: true });
      }

      // generate the graph if files not exists or deleted
      if (![labelsFileName, linksFileName, positionsFileName].every(f => existsSync(join(exportPath, f)))) {
        const nodeMap = new Map<string, Node>();
        const edgeArr: any[] = [];

        // export nodes and edges
        await runQueryStream(`MATCH (r:Repo)<-[a:ACTION]-(u:User) WHERE r.open_rank_${y}${m} > e() AND u.open_rank_${y}${m} > e() AND a.activity_${y}${m} > 2 RETURN id(r) AS rid, r.name AS repoName, ROUND(r.open_rank_${y}${m}, 2) AS ror, id(u) AS uid, u.login AS userName, ROUND(u.open_rank_${y}${m}, 2) AS uor, a.activity_${y}${m} AS activity`, async r => {
          nodeMap.set(r.rid, { id: r.rid, t: 'r', n: r.repoName, or: r.ror });
          nodeMap.set(r.uid, { id: r.uid, t: 'u', n: r.userName, or: r.uor });
          edgeArr.push({ from: r.uid, to: r.rid, weight: r.activity });
        });
        console.log(`Load graph done, node size is ${nodeMap.size}, edge size is ${edgeArr.length}`);

        // build graph in ngraph
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
        save(g, {
          outDir: exportPath,
          labels: originLabelsFileName,
        });

        // regenerate label file
        const nodeIds = JSON.parse(readFileSync(join(exportPath, originLabelsFileName)).toString());
        writeFileSync(join(exportPath, labelsFileName), JSON.stringify(nodeIds.map(id => nodeMap.get(id))));
        rmSync(join(exportPath, originLabelsFileName));

        // create layout
        const layout = createLayout(g, {
          iterations: 1000,
          saveEach: 1000,
          outDir: exportPath,
          layoutOptions: {
            nodeMass: id => g.getNode(id)?.data.or,
          }
        });
        // set node position to last month positions
        nodeIds.forEach(id => {
          if (lastPositionMap.has(id)) {
            layout.getLayout().setNodePosition(id, ...lastPositionMap.get(id)!);
          }
        });
        layout.run(true);
      }

      // load the position info for next month
      const nodes = JSON.parse(readFileSync(join(exportPath, labelsFileName)).toString());
      const buf = readFileSync(join(exportPath, positionsFileName));
      nodes.forEach((node, index) => {
        const offset = index * 4 * 3;
        const coordinates = [0, 4, 8].map(i => buf.readInt32LE(offset + i));
        lastPositionMap.set(node.id, coordinates);
      });
      console.log(`Find ${lastPositionMap.size} nodes' positions from ${y}-${m}`);
    });
  },
};

module.exports = task;
