import { existsSync, readFileSync } from "fs";
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
