import { Octokit } from '@octokit/core';
import { getLabelData } from "../label_data_utils";
import getConfig from '../config';
import { writeFileSync } from 'fs';
import { EOL } from 'os';

type IdNameArr = {id: number, name: string}[];

async function getNames(ids: number[], type: 'user' | 'org' | 'repo', client: Octokit): Promise<IdNameArr> {
  const resultArr: IdNameArr = [];
  let baseUrl = 'https://api.github.com/organizations/';  // org
  if (type === 'user') {
    baseUrl = 'https://api.github.com/user/'; // user
  } else if (type === 'repo') {
    baseUrl = 'https://api.github.com/repositories/'; // repo
  }
  for (const id of ids) {
    let name = '';
    try {
      const result = await client.request({ url: `${baseUrl}${id}`});
      name = result.data.login;
      if (type === 'repo') name = result.data.full_name;
    } catch {
      name = '!Not Found!'
    }
    resultArr.push({ id, name });
  }
  return resultArr;
}

(async () => {
  const labelData = getLabelData();
  const config = await getConfig();

  console.log(`Gonna generate ${labelData.length} labels to ${config.ci.labelDocPath}`);
  const octokit = new Octokit({ auth: config.ci.token });

  console.log((await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
    owner: 'frank-zsy',
    repo: 'open-digger',
    pull_number: 5
  })).data.map(i => i.filename));

  if (1 === 1) return;

  const contents: string[] = [];
  contents.push('|Type|Name|UserId|UserLogin|RepoId|RepoName|OrgId|OrgLogin|');
  contents.push('|---|---|---|---|---|---|---|---|');
  const ids = (arr: IdNameArr) => arr.map(i => i.id).join('<br>');
  const ns = (arr: IdNameArr) => arr.map(i => i.name).join('<br>');
  for (const l of labelData) {
    const ua = await getNames(l.githubUsers, 'user', octokit);
    const ra = await getNames(l.githubRepos, 'repo', octokit);
    const oa = await getNames(l.githubOrgs, 'org', octokit);
    const mk = `|${l.type}|${l.name}|${ids(ua)}|${ns(ua)}|${ids(ra)}|${ns(ra)}|${ids(oa)}|${ns(oa)}|`;
    contents.push(mk);
    console.log(`Get ${l.identifier} data done.`);
  }
  writeFileSync(config.ci.labelDocPath, contents.join(EOL));
  
})();
