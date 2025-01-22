import * as fs from 'fs';
import * as path from 'path';
import { readCsvArray, readFileAsObj } from '../utils';
import { dump } from 'js-yaml';

const chinaParts = ['MO', 'HK', 'TW'];
interface DivisionItem {
  name: string;
  type: 'Division-0' | 'Division-1';
  meta: {
    alpha2: string;
    name_full?: string;
    name_zh?: string;
    includes: string[];
    category?: string;
    developers?: {
      year: number;
      quarter: number;
      count: number;
    }[];
  };
  data?: {
    labels: string[];
  }
};

(async () => {
  const rootDir = path.resolve(__dirname, '../../labeled_data/divisions');

  const developers = await readCsvArray('./src/static/developers.csv', [
    { name: 'count', type: 'number' },
    { name: 'alpha2', type: 'string' },
    { name: 'year', type: 'number' },
    { name: 'quarter', type: 'number' }
  ]);

  const folders = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => path.join(rootDir, dirent.name));

  for (const folder of folders) {
    const filePath = path.join(folder, 'index.yml');
    const content: DivisionItem = readFileAsObj(filePath);
    const alpha2 = content.meta.alpha2;
    const devs = developers.filter(i => i.alpha2 === alpha2)
      .map(i => ({ year: i.year, quarter: i.quarter, count: i.count }));
    if (alpha2 === 'CN') {
      chinaParts.forEach(p => {
        developers.filter(i => i.alpha2 === p).forEach(i => {
          devs.find(j => j.year === i.year && j.quarter === i.quarter)!.count += i.count;
        });
      });
    }
    content.meta.developers = devs;
    fs.writeFileSync(filePath, dump(content, { noRefs: true, lineWidth: -1 }));
  }
})();
