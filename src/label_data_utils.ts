import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { readFileAsObj } from "./utils";

const labelInputDir = '../labeled_data';
const labelOutputFile = 'auto_generated.json';
const labelInputPath = path.join(__dirname, labelInputDir);

const supportedTypes = new Set<string>([
  'Region', 'Company', 'Community', 'Project', 'Foundation'
]);

const supportedKey = new Set<string>([
  'label', 'github_repo', 'github_org',
]);

interface LabelItem {
  identifier: string;
  content: {
    name: string;
    type: string;
    data: any;
  },
  parsed: boolean;
  githubRepos: number[],
  githubOrgsOrUsers: number[],
}

interface ParsedLabelItem {
  identifier: string;
  type: string;
  name: string;
  githubRepos: number[],
  githubOrgsOrUsers: number[],
}

export function parseLabelData() {
  if (!statSync(labelInputPath).isDirectory()) {
    console.error(`${labelInputPath} input path is not a directory.`);
    return;
  }
  const labelMap = new Map<string, LabelItem>();
  readPath(labelInputPath, '', f => {
    if (!f.endsWith('.yml')) return;
    const identifier = `:${(f.endsWith('/index.yml') ? f.slice(0, f.indexOf('/index.yml')) : f.slice(0, f.indexOf('.yml')))}`;
    const content = readFileAsObj(path.join(labelInputPath, f));
    labelMap.set(identifier, {
      identifier,
      content,
      parsed: false,
      githubOrgsOrUsers: [],
      githubRepos: [],
    });
  });
  const parsedResult = processLabelItems(labelMap);
  writeFileSync(path.join(labelInputPath, labelOutputFile), JSON.stringify(parsedResult));
}

parseLabelData();

function readPath(p: string, base: string, fileProcessor: (f: string) => void) {
  if (!statSync(p).isDirectory()) {
    fileProcessor(base);
  } else {
    for (const f of readdirSync(p)) {
      readPath(path.join(p, f), path.join(base, f), fileProcessor);
    }
  }
}

function processLabelItems(map: Map<string, LabelItem>): ParsedLabelItem[] {
  for (const item of map.values()) {
    parseItem(item, map);
  }
  return Array.from(map.values()).map(item => {
    return {
      identifier: item.identifier,
      type: item.content.type,
      name: item.content.name,
      githubRepos: Array.from(new Set(item.githubRepos)),
      githubOrgsOrUsers: Array.from(new Set(item.githubOrgsOrUsers)),
    };
  });
}

function parseItem(item: LabelItem, map: Map<string, LabelItem>) {
  if (item.parsed) return;
  if (!supportedTypes.has(item.content.type)) {
      throw new Error(`Not supported type ${item.content.type}`)
    }
  for (const key in item.content.data) {
    if (!supportedKey.has(key)) {
      throw new Error(`Not supported element=${key}, identifier=${item.identifier}`);
    }
    switch(key) {
      case 'github_repo':
        item.githubRepos.push(...item.content.data[key]);
        break;
      case 'github_org':
        item.githubOrgsOrUsers.push(...item.content.data[key]);
        break;
      case 'label':
        const labels: string[] = item.content.data[key];
        for (const label of labels) {
          const identifier = label.startsWith(':') ? label : path.join(item.identifier, label);
          const innerItem = map.get(identifier);
          if (!innerItem) {
            throw new Error(`Can not find nest identifier ${identifier} for ${item.identifier}`);
          }
          if (!innerItem.parsed) {
            parseItem(innerItem, map);
          }
          item.githubOrgsOrUsers.push(...innerItem.githubOrgsOrUsers);
          item.githubRepos.push(...innerItem.githubRepos);
        }
        break;
      default:
        break;
    }
  }
  item.parsed = true;
}

export interface LabelOperationResult {
  githubRepos: number[];
  githubOrgsOrUsers: number[];
}

export function getLabelUnion(labels: string[]): LabelOperationResult {
  const data = getLabelData();
  const repoSet = new Set<number>();
  const orgOrUserSet = new Set<number>();
  for (const item of data) {
    if (labels.includes(item.identifier)) {
      item.githubRepos.forEach(r => repoSet.add(r));
      item.githubOrgsOrUsers.forEach(o => orgOrUserSet.add(o));
    }
  }
  return {
    githubRepos: Array.from(repoSet),
    githubOrgsOrUsers: Array.from(orgOrUserSet),
  };
}

function getLabelData(): ParsedLabelItem[] {
  const dataPath = path.join(labelInputPath, labelOutputFile);
  parseLabelData();
  return JSON.parse(readFileSync(dataPath).toString());
}
