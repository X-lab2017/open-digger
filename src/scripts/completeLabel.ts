import { readdirSync, statSync, writeFileSync } from "fs";
import path from "path";
import { readFileAsObj } from "../utils";
import { Octokit } from '@octokit/rest';
import getConfig from '../config';
import { dump } from 'js-yaml';

/** Ensure YAML serialization order: id, then name, then other keys (js-yaml follows insertion order). */
function orderIdNameKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const { id, name, ...rest } = obj;
  const out: Record<string, unknown> = {};
  if (id !== undefined) out.id = id;
  if (name !== undefined) out.name = name;
  Object.assign(out, rest);
  return out;
}

function normalizePlatformEntities(items: Record<string, unknown>[] | undefined) {
  if (!items?.length) return;
  for (let i = 0; i < items.length; i++) {
    items[i] = orderIdNameKeys(items[i]);
  }
}

async function readPath(p: string, base: string, fileProcessor: (f: string) => Promise<void>) {
  if (!statSync(p).isDirectory()) {
    await fileProcessor(base);
  } else {
    for (const f of readdirSync(p)) {
      await readPath(path.join(p, f), path.join(base, f), fileProcessor);
    }
  }
}

(async () => {
  const labelInputPath = 'labeled_data';
  if (!statSync(labelInputPath).isDirectory()) {
    throw new Error(`${labelInputPath} input path is not a directory.`);
  }
  const labelFileSuffix = '.yml';
  const config = await getConfig();
  const oct = new Octokit({ auth: config.github.tokens[0] });
  await readPath(labelInputPath, '', async f => {
    if (!f.endsWith(labelFileSuffix)) return;
    const filePath = path.join(labelInputPath, f);
    const label = readFileAsObj(filePath);
    for (const p of label.data?.platforms ?? []) {
      if (p.repos) {
        for (const r of p.repos) {
          if (!r.id) {
            try {
              if (p.name !== 'GitHub') {
                throw new Error('Only GitHub supported now.');
              }
              const data = await oct.repos.get({ owner: r.name.split('/')[0], repo: r.name.split('/')[1] });
              r.id = data.data.id;
              console.log(`Get repo id of ${r.name} for ${p.name}: ${r.id}`);
            } catch (e: any) {
              console.log(`Error processing repo in ${f}, e=${e.message}, repo=${JSON.stringify(r)}`);
            }
          }
        }
      }
      if (p.orgs) {
        for (const o of p.orgs) {
          if (!o.id) {
            try {
              if (p.name !== 'GitHub') {
                throw new Error('Only GitHub supported now.');
              }
              const data = await oct.orgs.get({ org: o.name });
              o.id = data.data.id;
              console.log(`Get org id of ${o.name} for ${p.name}: ${o.id}`);
            } catch (e: any) {
              console.log(`Error processing org in ${f}, e=${e.message}, org=${JSON.stringify(o)}`);
            }
          }
        }
      }
      if (p.users) {
        for (const u of p.users) {
          if (!u.id) {
            try {
              if (p.name !== 'GitHub') {
                throw new Error('Only GitHub supported now.');
              }
              const data = await oct.users.getByUsername({ username: u.name });
              u.id = data.data.id;
              console.log(`Get user id of ${u.name} for ${p.name}: ${u.id}`);
            } catch (e: any) {
              console.log(`Error processing user in ${f}, e=${e.message}, user=${JSON.stringify(u)}`);
            }
          }
        }
      }
      normalizePlatformEntities(p.repos);
      normalizePlatformEntities(p.orgs);
      normalizePlatformEntities(p.users);
    }
    if (label.data && label.data.labels) {
      label.data.labels = label.data.labels.sort();
    }
    writeFileSync(filePath, dump(label, { noRefs: true, lineWidth: -1 }));
  });
})();
