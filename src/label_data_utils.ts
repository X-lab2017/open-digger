import { readdirSync, statSync } from 'fs';
import path from 'path';
import { readFileAsObj } from './utils';

export type PlatformNames = 'GitHub' | 'Gitee' | 'AtomGit' | 'GitLab.com' | 'GitLab.cn' | 'Gitea';

const labelInputDir = '../labeled_data';
const labelInputPath = path.join(__dirname, labelInputDir);

const checkKeysAndTypes = {
  labelTypes: new Set<string>([
    'Region-0', 'Region-1', 'Company', 'Community', 'Project', 'Foundation', 'Tech-0', 'Tech-1', 'Tech-2', 'Tech-3', 'Domain-0', 'Bot'
  ]),
  labelKeys: new Set<string>([
    'labels', 'platforms'
  ]),
  platformsNames: new Set([
    'GitHub', 'Gitee', 'AtomGit', 'GitLab.com', 'GitLab.cn', 'Gitea',
  ]),
  platformTypes: new Set<string>([
    'Code Hosting'
  ]),
  platformKeys: new Set<string>([
    'repos', 'orgs', 'users'
  ]),
};

interface CodeHostingPlatformItem {
  id: number;
  name: string;
}

interface CodeHostingPlatformData {
  name: string;
  type: string;
  orgs: CodeHostingPlatformItem[],
  repos: CodeHostingPlatformItem[],
  users: CodeHostingPlatformItem[],
}

interface LabelItem {
  identifier: string;
  content: {
    name: string;
    type: string;
    data: any;
  },
  parents: string[];
  children: string[];
  parsed: boolean;
  platforms: CodeHostingPlatformData[];
}

interface ParsedLabelItem {
  identifier: string;
  type: string;
  name: string;
  parents: string[];
  children: string[];
  platforms: CodeHostingPlatformData[];
}

export function getLabelData(injectLabelData?: any[]): ParsedLabelItem[] {
  if (!statSync(labelInputPath).isDirectory()) {
    throw new Error(`${labelInputPath} input path is not a directory.`);
  }
  const labelMap = new Map<string, LabelItem>();
  const indexFileName = `${path.sep}index.yml`;
  const labelFileSuffix = '.yml';
  readPath(labelInputPath, '', f => {
    if (!f.endsWith('.yml')) return;
    // convert windows favor path to linux favor path
    const identifier = processLabelIdentifier(`:${(f.endsWith(indexFileName) ? f.slice(0, f.indexOf(indexFileName)) : f.slice(0, f.indexOf(labelFileSuffix)))}`);
    const content = readFileAsObj(path.join(labelInputPath, f));
    labelMap.set(identifier, {
      identifier,
      content,
      platforms: [],
      parents: [],
      children: [],
      parsed: false,
    });
  });
  const data = processLabelItems(labelMap);
  if (injectLabelData) injectLabelData.forEach(l => data.push(l));
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
    const ret = {
      identifier: item.identifier,
      type: item.content.type,
      name: item.content.name,
      platforms: item.platforms,
      parents: item.parents,
      children: item.children,
    };
    return ret;
  });
}

function mergePlatforms(...platformsArray: CodeHostingPlatformData[][]) {
  const platforms: CodeHostingPlatformData[] = [];
  platformsArray.forEach(ps => {
    ps.forEach(p => {
      const platform = platforms.find(pp => pp.name === p.name && pp.type === p.type);
      if (!platform) {
        platforms.push(JSON.parse(JSON.stringify(p)));
      } else {
        ['orgs', 'repos', 'users'].forEach(key => {
          if (p[key]) {
            p[key].forEach(i => {
              if (!platform[key].find(ii => ii.id === i.id)) platform[key].push(i);
            });
          }
        });
      }
    });
  });
  return platforms;
}

function parseItem(item: LabelItem, map: Map<string, LabelItem>) {
  if (item.parsed) return;
  if (item.content.type && !checkKeysAndTypes.labelTypes.has(item.content.type)) {
    throw new Error(`Not supported type ${item.content.type}`)
  }
  for (const key in item.content.data) {
    if (!checkKeysAndTypes.labelKeys.has(key)) {
      throw new Error(`Not supported element=${key}, identifier=${item.identifier}`);
    }
    switch (key) {
      case 'platforms':
        // process platforms first
        const platforms = JSON.parse(JSON.stringify(item.content.data[key]));
        item.platforms = mergePlatforms(item.platforms, platforms);
        ['orgs', 'repos', 'users'].forEach(k => item.platforms.forEach(p => p[k] = p[k] ?? []));
        break;
      case 'labels':
        const labels: string[] = item.content.data[key];
        for (const label of labels) {
          const identifier = label.startsWith(':') ? label : processLabelIdentifier(path.join(item.identifier, label));
          const innerItem = map.get(identifier);
          if (!innerItem) {
            throw new Error(`Can not find nest identifier ${identifier} for ${item.identifier}`);
          }
          if (!innerItem.parsed) {
            parseItem(innerItem, map);
          }

          // set parents and children relationships
          innerItem.parents.push(item.identifier);
          item.children.push(innerItem.identifier);
          // merge platforms
          item.platforms = mergePlatforms(item.platforms, innerItem.platforms);
        }
        break;
      default:
        break;
    }
  }
  item.parsed = true;
}

function processLabelIdentifier(identifier: string): string {
  return identifier.split(path.sep).join(path.posix.sep);
}

export function getPlatformData(typeOrIds: string[], injectLabelData?: any[]): CodeHostingPlatformData[] {
  if (typeOrIds.length === 0) return [];
  const data = getLabelData(injectLabelData);
  if (!data) return [];
  const arr = data.filter(i => typeOrIds.includes(i.type) || typeOrIds.includes(i.identifier));
  return mergePlatforms(...arr.map(item => item.platforms));
}
