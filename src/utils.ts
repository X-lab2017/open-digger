import { createReadStream, existsSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import pWaitFor from 'p-wait-for';
const dateformat = require('dateformat');
const CsvReadableStream = require('csv-reader');

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

export async function readCsvLine(path: string, online: (row: string[]) => any): Promise<void> {
  return new Promise(resolve => {
    const inputStream = createReadStream(path, 'utf-8');
    inputStream
      .pipe(new CsvReadableStream({ trim: true, skipHeader: true }))
      .on('data', (row: string[]) => {
        online(row);
      })
      .on('end', () => {
        resolve();
      });
  });
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

export const getLogger = (tag: string) => {
  const log = (level: string, ...args: any[]) =>
    console.log(`${dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss')} ${level} [${tag}]`, ...args);
  return {
    info: (...args: any[]) => log('INFO', ...args),
    warn: (...args: any[]) => log('WARN', ...args),
    error: (...args: any[]) => log('ERROR', ...args),
  };
};

export class ArrayMap<T> {
  private array: T[];
  private map: Map<any, number>;
  private keyGetter: (item: T) => any;

  constructor(arr: T[], keyGetter?: (item: T) => any) {
    this.array = [];
    this.map = new Map();
    this.keyGetter = keyGetter ?? (i => i);
    arr.forEach(i => this.add(i));
  }

  public get length() {
    return this.array.length;
  }

  public get(key: any): T | undefined {
    const index = this.map.get(key);
    return index === undefined ? undefined : this.array[index];
  }

  public getIndex(key: any): number {
    return this.map.get(key) ?? -1;
  }

  public add(item: T) {
    const key = this.keyGetter(item);
    if (this.map.has(key)) {
      this.array[this.map.get(key)!] = item;
    } else {
      this.map.set(key, this.array.length);
      this.array.push(item);
    }
  }

  public getArray(): T[] {
    return [...this.array];
  }
}
