import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateReport, readFileAsObj } from './utils';

export async function caseStudy(): Promise<string[]> {
  console.log('Start to generate case study.');

  const files: string[] = [];
  
  const casesDir = join(__dirname, '../case-study/cases');
  if (!existsSync(casesDir)) {
    return files;
  }

  const cases = readdirSync(casesDir);
  for (const c of cases) {
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
    files.push(outputFile);
  }
  return files;
}
