import { existsSync, lstatSync, readdirSync, readFileSync } from "fs";
import { load } from 'js-yaml';
import { join } from "path";
import requireFromString from 'require-from-string';
import * as pageUtils from './pageUtils';
import { globalConfig } from './config';
import { pope } from 'pope';

export function readFileAsObj(path: string) {
  if (!existsSync(path)) {
    return null;
  }
  const content = readFileSync(path).toString();
  if (path.toLocaleLowerCase().endsWith('.json')) {
    // json format
    try {
      return JSON.parse(content);
    } catch (e) {
      console.log(`Parse JSON content failed, e=${e}`);
      return null;
    }
  } else if (path.toLocaleLowerCase().endsWith('.yaml') || path.toLocaleLowerCase().endsWith('.yml')) {
    // yaml format
    try {
      return load(content, { json: true });
    } catch (e) {
      console.log(`Parse YAML content failed, e=${e}`);
      return null;
    }
  }
  return null;
}

interface GenerateReportConfig {
  sqlsDir: string;
  sqls?: string[];
  customConfig?: any;
}

export async function generateReport(config: GenerateReportConfig): Promise<string | null> {
  const templateFile = join(__dirname, '../REPORT_TEMPLATE.html');
  if (!existsSync(templateFile)) {
    console.log('Template file not exists.');
    return null;
  }
  const templateContent = readFileSync(templateFile).toString();

  if (!existsSync(config.sqlsDir)) {
    console.log('Sqls folder not exists.');
    return null;
  }

  const sqls = config.sqls || config.customConfig.sqls || readdirSync(config.sqlsDir);
  let html = '', css = '', js = '';
  for (const s of sqls) {
    const dirPath = join(config.sqlsDir, s);
    if (!lstatSync(dirPath).isDirectory()) {
      continue;
    }

    const jsonConfigFile = join(dirPath, 'config.json');
    const yamlConfigFile = join(dirPath, 'config.yaml');
    const processFile = join(dirPath, 'processor.js');
    if (!existsSync(processFile)) {
      console.log(`Processor not exists for ${dirPath}`);
      continue;
    }
    
    let sqlConfig = readFileAsObj(jsonConfigFile) || readFileAsObj(yamlConfigFile) || {};

    const processorFunc = requireFromString(readFileSync(processFile).toString());
    const postResult: { html: string; css: string; js: string; } = await processorFunc({
      ...sqlConfig,
      ...config.customConfig,
    }, pageUtils);

    html += postResult.html;
    css += postResult.css;
    js += postResult.js;
  }

  const studyContent = pope(templateContent, {
    html,
    css,
    js,
    ...globalConfig.general,
    ...config.customConfig,
  });
  return studyContent;
}
