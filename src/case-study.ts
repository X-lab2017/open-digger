import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateReport, readFileAsObj } from './utils';

export async function caseStudy(): Promise<void> {

  if (process.argv[2] && process.argv[2].toLocaleLowerCase() === 'global') return;

  console.log('Start to generate case study.');

  
  const casesDir = join(__dirname, '../case-study/cases');
  if (!existsSync(casesDir)) {
    return;
  }

  let caseParams: string[] = [];
  if (process.argv.length > 2) {
    caseParams = process.argv.slice(2);
    console.log(caseParams);
  }

  const cases = readdirSync(casesDir);
  for (const c of cases) {
    if (caseParams.length > 0 && !caseParams.some(p => p.toLocaleLowerCase() === c.toLocaleLowerCase().split('.')[0])) continue;
    const config = readFileAsObj(join(casesDir, c));
    if (config === null) continue;
    const reportContent = await generateReport({
      sqlsDir: join(__dirname, '../case-study/sqls'),
      customConfig: config,
    });

    if (reportContent === null) continue;

    const distDir = join(__dirname, '../dist');
    if (!existsSync(distDir)) {
      mkdirSync(distDir);
    }
    const outputFile = join(distDir, `case-study-${c.substr(0, c.indexOf('.'))}.html`);
    writeFileSync(outputFile, reportContent);

    console.log(`Generate case study into ${outputFile}`);
  }
}
