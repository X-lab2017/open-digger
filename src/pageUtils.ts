import { globalConfig } from "./config";
import * as Clickhouse from './db/clickhouse';

export function constrainMetric(num: number) {
  const units = ['', 'K', 'M', 'B'];
  let unitIndex = 0;
  while (num > 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  let times = 1;
  while (num > 10) {
    num /= 10;
    times *= 10;
  }
  return {
    unit: units[unitIndex],
    divTimes: Math.pow(1000, unitIndex),
    max: Math.ceil(num) * times,
  };
}

export function constrainMetrics(nums: number[]) {
  const max = Math.max(...nums);
  const constrain = constrainMetric(max);
  return {
    unit: constrain.unit,
    max: constrain.max,
    nums: nums.map(n => n / constrain.divTimes),
  }
}

export async function queryGitHubEventLog(q: string): Promise<any> {
  try {
    const result: any = await Clickhouse.query(globalConfig.db['githubEventLog'], q);
    return result;
  } catch (e) {
    console.log(`Request data error, e=${e}`);
    return null;
  }
}

interface genTableConfig {
  keys: string[];
  header: any[];
  data: any[];
  tableClass: string;
}

export function genTable(config: genTableConfig): string {
  const tableRow: string[] = [];
  let h = '';
  for (const k of config.keys) {
    h += `<td>${(config.header && config.header[k]) ? config.header[k] : k}</td>`;
  }
  tableRow.push(h);
  for (const r of config.data) {
    let s = '';
    for (const k of config.keys) {
      s += `<td>${r[k]}</td>`;
    }
    tableRow.push(s);
  }
  return `<table class="${config.tableClass ?? 'table table-striped'}">
      ${tableRow.map((r, i) => `<tr ${i % 2 === 1 ? 'style="background-color: rgba(30, 161, 255, 0.1)"' : ''}>${r}</tr>\n`).join('')}
    </table>`
}

export function genComponentTitle(title: string): string {
  return `<div class="component-title-text">
  <text>${title}</text>
  </div>`;
}

export function genComponentContent(content: string): string {
  return `<div class="component-content-text">
  <text>${content}</text>
  </div>`;
}

export function genFigure(content: string): string {
  return `<div class="figure-text">
  <text>${content}</text>
  </div>`;
}
