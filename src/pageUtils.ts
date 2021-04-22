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
