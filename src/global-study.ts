import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateReport, readFileAsObj } from './utils';

export async function globalStudy() {
  console.log('Start to generate global study.');

  const config = readFileAsObj(join(__dirname, '../global-study/config.yaml')) ?? {};
  const reportContent = await generateReport({
    sqlsDir: join(__dirname, '../global-study/sqls'),
    customConfig: config,
    sqls: config.sqls,
  });

  if (reportContent === null) return;

  const distDir = join(__dirname, '../dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir);
  }
  const globalStudyFile = join(distDir, 'global-study.html');
  writeFileSync(globalStudyFile, reportContent);

  console.log(`Generate global study into ${globalStudyFile}`);
  return globalStudy;
}
