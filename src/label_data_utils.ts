import { readdirSync, statSync } from "fs";
import path from "path";
import { readFileAsObj } from "./utils";

const labelInputDir = '../labeled_data';
const labelInputPath = path.join(__dirname, labelInputDir);

const supportedTypes = new Set<string>([
  'Region', 'Company', 'Community', 'Project', 'Foundation'
]);

const supportedKey = new Set<string>([
  'label', 'github_repo', 'github_org',
]);
interface GitHubData {
  githubRepos: number[],
  githubOrgs: number[],
  githubUsers: number[],
}

const emptyData: GitHubData = {
  githubRepos: [],
  githubOrgs: [],
  githubUsers: [],
};

interface LabelItem extends GitHubData {
  identifier: string;
  content: {
    name: string;
    type: string;
    data: any;
  },
  parsed: boolean;
}

interface ParsedLabelItem extends GitHubData {
  identifier: string;
  type: string;
  name: string;
}

export function getLabelData() {
  if (!statSync(labelInputPath).isDirectory()) {
    console.error(`${labelInputPath} input path is not a directory.`);
    return;
  }
  const labelMap = new Map<string, LabelItem>();
  const indexFileName = '/index.yml';
  const labelFileSuffix = '.yml';
  readPath(labelInputPath, '', f => {
    if (!f.endsWith('.yml')) return;
    const identifier = `:${(f.endsWith(indexFileName) ? f.slice(0, f.indexOf(indexFileName)) : f.slice(0, f.indexOf(labelFileSuffix)))}`;
    const content = readFileAsObj(path.join(labelInputPath, f));
    labelMap.set(identifier, {
      identifier,
      content,
      parsed: false,
      githubOrgs: [],
      githubRepos: [],
      githubUsers: [],
    });
  });
  const data = processLabelItems(labelMap);
  return data;
}

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
      githubOrgs: Array.from(new Set(item.githubOrgs)),
      githubUsers: Array.from(new Set(item.githubUsers)),
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
        item.githubOrgs.push(...item.content.data[key]);
        break;
      case 'github_user':
        item.githubUsers.push(...item.content.data[key]);
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
          item.githubOrgs.push(...innerItem.githubOrgs);
          item.githubRepos.push(...innerItem.githubRepos);
          item.githubUsers.push(...innerItem.githubUsers);
        }
        break;
      default:
        break;
    }
  }
  item.parsed = true;
}

function labelDataToGitHubData(data: ParsedLabelItem[]): GitHubData {
  const repoSet = new Set<number>();
  const orgSet = new Set<number>();
  const userSet = new Set<number>();
  for (const item of data) {
    item.githubRepos.forEach(r => repoSet.add(r));
    item.githubOrgs.forEach(o => orgSet.add(o));
    item.githubUsers.forEach(u => userSet.add(u));
  }
  return {
    githubRepos: Array.from(repoSet),
    githubOrgs: Array.from(orgSet),
    githubUsers: Array.from(userSet),
  };
}

export function getGitHubData(typeOrIds: string[]): GitHubData {
  if (typeOrIds.length === 0) return emptyData;
  const data = getLabelData();
  if (!data) return emptyData;
  const arr = data.filter(i => typeOrIds.includes(i.type) || typeOrIds.includes(i.identifier));
  return labelDataToGitHubData(arr);
}
