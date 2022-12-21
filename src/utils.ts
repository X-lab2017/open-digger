import { existsSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import pWaitFor from 'p-wait-for';

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

export async function waitFor(mill: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, mill);
  });
}

export async function waitUntil(func: () => boolean, options?: object): Promise<void> {
  if (func()) return;
  return pWaitFor(func, Object.assign({ interval: 1000 }, options));
}

interface rankDataResultItem<T> {
  item: T;
  rank: number;
  value: number;
  rankDelta: number;
  valueDelta: number;
};
export function rankData<T = any>(data: T[], iterArr: any[], getter: (item: T, iterItem: any, iterIndex: number) => number, itemIdentifiterGetter: (item: T, iterIndex: number) => any): Map<any, rankDataResultItem<T>[]> {
  const result = new Map<any, rankDataResultItem<T>[]>();
  const lastRankMap = new Map<any, { rank: number; value: number; }>();
  data.forEach(i => lastRankMap.set(i, { rank: -1, value: 0 }));
  for (let iterIndex = 0; iterIndex < iterArr.length; iterIndex++) {
    const iterItem = iterArr[iterIndex];
    const iterResult: any[] = [];
    data = data.sort((a, b) => (getter(b, iterItem, iterIndex) ?? 0) - (getter(a, iterItem, iterIndex) ?? 0));
    data.forEach((i: any, index) => {
      const rank = getter(i, iterItem, iterIndex) ? index + 1 : -1;
      const value = parseFloat((getter(i, iterItem, iterIndex) ?? 0).toFixed(2));
      const lastRank = lastRankMap.get(i)!;
      lastRankMap.set(i, { rank, value });

      if (rank === -1) return;
      iterResult.push({
        item: itemIdentifiterGetter(i, iterIndex),
        rank,
        value,
        rankDelta: lastRank.rank === -1 ? 0 : lastRank.rank - rank,
        valueDelta: parseFloat((value - lastRank.value).toFixed(2)),
      });
    });
    result.set(iterItem, iterResult);
  }
  return result;
}
