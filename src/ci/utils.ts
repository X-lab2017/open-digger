import { Octokit } from '@octokit/core';
import request from 'request';
import getConfig from '../config';

export async function getGitHubClient(): Promise<Octokit> {
  const config = await getConfig();
  const octokit = new Octokit({ auth: config.ci.token });
  return octokit;
}

type IdNameArr = {id: number, name: string}[];

export async function getNames(ids: number[], type: 'user' | 'org' | 'repo', client: Octokit): Promise<IdNameArr> {
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

export async function requestPullFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (!err && res.statusCode === 200) {
        resolve(body);
      } else {
        reject(err);
      }
    });
  });
}
