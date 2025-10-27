import { readdirSync, statSync, writeFileSync } from "fs";
import path from "path";
import { readFileAsObj } from "../utils";
import { Octokit } from '@octokit/rest';
import getConfig from '../config';
import { dump } from 'js-yaml';

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
    try {
      for (const p of label.data?.platforms ?? []) {
        if (p.repos) {
          for (const r of p.repos) {
            if (!r.id) {
              if (p.name !== 'GitHub') {
                throw new Error('Only GitHub supported now.');
              }
              const data = await oct.repos.get({ owner: r.name.split('/')[0], repo: r.name.split('/')[1] });
              r.id = data.data.id;
              console.log(`Get repo id of ${r.name} for ${p.name}: ${r.id}`);
            }
          }
        }
        if (p.orgs) {
          for (const o of p.orgs) {
            if (!o.id) {
              if (p.name !== 'GitHub') {
                throw new Error('Only GitHub supported now.');
              }
              const data = await oct.orgs.get({ org: o.name });
              o.id = data.data.id;
              console.log(`Get org id of ${o.name} for ${p.name}: ${o.id}`);
            }
          }
        }
        if (p.users) {
          for (const u of p.users) {
            if (!u.id) {
              if (p.name !== 'GitHub') {
                throw new Error('Only GitHub supported now.');
              }
              const data = await oct.users.getByUsername({ username: u.name });
              u.id = data.data.id;
              console.log(`Get repo id of ${u.name} for ${p.name}: ${u.id}`);
            }
          }
        }
      }
      if (label.data && label.data.labels) {
        label.data.labels = label.data.labels.sort();
      }
      writeFileSync(filePath, dump(label, { noRefs: true, lineWidth: -1 }));
    } catch (e: any) {
      console.log(`Error processing ${f}, e=${e.message}, label=${JSON.stringify(label)}`);
    }
  });
})();
