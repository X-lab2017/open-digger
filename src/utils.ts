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

export async function readCsvArray(path: string, keys: Array<{ name: string, type: 'string' | 'number' }>): Promise<any[]> {
  const res: any[] = [];
  await new Promise<void>(resolve => {
    const inputStream = createReadStream(path, 'utf-8');
    inputStream
      .pipe(new CsvReadableStream({ trim: true, skipHeader: true }))
      .on('data', (row: string[]) => {
        const item: any = {};
        keys.forEach((key, index) => {
          let value: any = row[index];
          if (key.type === 'number') value = +value;
          item[key.name] = value;
        });
        res.push(item);
      })
      .on('end', () => {
        resolve();
      });
  });
  return res;
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

/**
 * Converts an ISO 8601 date string to a database-friendly format ("YYYY-MM-DD HH:MM:SS").
 *
 * @param {string} date - The date string in ISO 8601 format (e.g., "2024-06-01T12:34:56Z").
 * @returns {string} The formatted date string ("YYYY-MM-DD HH:MM:SS").
 *
 * @example
 * // returns "2024-06-01 12:34:56"
 * formatDate("2024-06-01T12:34:56Z");
 * formatDate("2024-06-01T12:34:56.213Z");
 */
export const formatDate = (date: string) => {
  return date.replace('T', ' ').replace('Z', '').slice(0, 19);
};

export const getLogger = (tag: string) => {
  const log = (level: string, ...args: any[]) =>
    console.log(`${dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss')} ${level} [${tag}]`, ...args);
  return {
    info: (...args: any[]) => log('INFO', ...args),
    warn: (...args: any[]) => log('WARN', ...args),
    error: (...args: any[]) => log('ERROR', ...args),
  };
};

/**
 * Executes an array of asynchronous task functions with a specified concurrency limit.
 *
 * @param {Array<() => Promise<any>>} tasks - An array of functions, each returning a Promise. Each function represents an asynchronous task to execute.
 * @param {number} concurrencyLimit - The maximum number of tasks to execute concurrently.
 * @returns {Promise<any[]>} A promise that resolves to an array of results from the tasks, in the order they were started.
 *
 * Important behavior:
 * - If any task throws or rejects, the error will propagate and reject the returned promise.
 * - Results are collected in the order tasks are started, not necessarily the order they complete.
 */
export async function runTasks(tasks: Array<() => Promise<any>>, concurrencyLimit: number): Promise<any[]> {
  const results: any[] = [];
  const executing = new Set();

  for (const task of tasks) {
    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }

    const promise = task().then(result => {
      executing.delete(promise);
      results.push(result);
    }).catch(error => {
      executing.delete(promise);
      throw error;
    });

    executing.add(promise);
  }

  await Promise.all(executing);
  return results;
}

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
