import request from 'request';
import { Task } from '..';
import { getLogger, readCsvLine } from '../../utils';
import getConfig from '../../config';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { load, dump } from 'js-yaml';
import { Octokit } from '@octokit/core';

interface Options {
  foundationName: string;
  foundationKey: string;
  projects: {
    name: string;
    urls: {
      url: string;
      type: 'repo' | 'org',
    }[];
  }[];
  topLevelData?: any;
};

/**
 * This task is used to update foundations labeled data
 */
const task: Task = {
  cron: '0 0 1 * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateFoundationsTask');

    const config = await getConfig();
    const oct = new Octokit({ auth: config.github.tokens[0] });

    const generateLabels = async (options: Options) => {
      const indexData: any = {
        name: options.foundationName,
        type: 'Foundation',
        data: Object.assign({}, options.topLevelData || {}, {
          labels: [],
        }),
      };

      const basePath = `labeled_data/foundations/linux_foundation/${options.foundationKey}`;
      if (existsSync(basePath)) {
        rmSync(basePath, { recursive: true });
      }
      mkdirSync(basePath);

      for (const proj of options.projects) {
        const name = proj.name;
        const repos: { id: number; name: string; }[] = [];
        const orgs: { id: number; name: string; }[] = [];

        for (const u of proj.urls) {
          try {
            const url = new URL(u.url);
            if (u.type === 'repo') {
              const pathParts = url.pathname.split('/');
              const owner = pathParts[1];
              const repo = pathParts[2];
              const githubData = await oct.request('GET /repos/{owner}/{repo}', { owner, repo });
              repos.push({ id: githubData.data.id, name: `${owner}/${repo}` });
            } else if (u.type === 'org') {
              const pathParts = url.pathname.split('/');
              const owner = pathParts[1];
              const githubData = await oct.request('GET /orgs/{org}', { org: owner });
              orgs.push({ id: githubData.data.id, name: owner });
            }
          } catch (e) {
            logger.error(`Error on processing ${proj.name}(${u.url}): ${e}`);
          }
        }

        const key = name.toLowerCase().replace(/-/g, '_').replace(/\(.*\)$/g, '').trim().replace(/ /g, '_');
        writeFileSync(join(basePath, `${key}.yml`), dump({
          name,
          type: 'Project',
          data: {
            platforms: [
              {
                name: 'GitHub',
                type: 'Code Hosting',
                orgs: orgs.length > 0 ? orgs : undefined,
                repos: repos.length > 0 ? repos : undefined,
              }
            ]
          }
        }));
        indexData.data.labels.push(key);
      }

      writeFileSync(join(basePath, 'index.yml'), dump(indexData));
    };

    // CNCF labels
    // @ts-ignore
    const generateCncfLabels = async (): Promise<void> => {
      return new Promise(resolve => {
        logger.info('Start processing CNCF foundation');
        request.get('https://landscape.cncf.io/data/full.json', async (err, req, body) => {
          if (err || req.statusCode !== 200) {
            logger.error('Failed to fetch CNCF data');
            return resolve();
          }
          try {
            const data = JSON.parse(body);
            if (!data.items) {
              logger.error('Can not find items field in data.');
              return resolve();
            }
            const projects = data.items.filter(i =>
              ['CNCF Incubating', 'CNCF Graduated'].includes(i.featured?.label)
              && !i.name.endsWith('(Serverless)')
              && i.repositories?.[0].url
            ).map(i => ({ name: i.name, urls: [{ url: i.repositories[0].url, type: 'org' }] }));
            logger.info(projects.length, 'projects found in CNCF foundation');
            await generateLabels({
              foundationName: 'Cloud Native Computing Foundation (CNCF)',
              foundationKey: 'cncf', projects,
              topLevelData: {
                platforms: [{
                  name: 'GitHub',
                  type: 'Code Hosting',
                  orgs: [{
                    id: 13455738,
                    name: 'cncf',
                  }],
                }],
              },
            });
            logger.info('Finished processing CNCF foundation');
          } catch (e: any) {
            logger.error(`Error on processing CNCF foundation: ${e}`);
          }
          resolve();
        });
      });
    };

    // openjs labels
    // @ts-ignore
    const generateOpenjsLabels = async (): Promise<void> => {
      logger.info('Start processing OpenJS foundation');
      const projects: { name: string, urls: { url: string; type: 'org' | 'repo' }[] }[] = [];
      await readCsvLine('local_files/openjs_landscape.csv', async row => {
        const org = row[1];
        if (org !== 'OpenJS Foundation') {
          return;
        }
        const name = row[0];
        const githubUrl = row[29];
        projects.push({ name, urls: [{ url: githubUrl, type: 'org' }] });
      });
      logger.info(projects.length, 'projects found in OpenJS foundation');
      await generateLabels({
        foundationName: 'OpenJS Foundation',
        foundationKey: 'openjs', projects,
        topLevelData: {
          platforms: [{
            name: 'GitHub',
            type: 'Code Hosting',
            orgs: [{
              id: 48335322,
              name: 'openjs-foundation',
            }],
          }],
        },
      });
      logger.info('Finished processing OpenJS foundation');
    };

    // LF AI labels
    // @ts-ignore
    const generateLfaiLabels = async (): Promise<void> => {
      return new Promise(resolve => {
        logger.info('Start processing LF AI foundation');
        request.get('https://raw.githubusercontent.com/lfai/lfai-landscape/main/landscape.yml', async (err, req, body) => {
          if (err || req.statusCode !== 200) {
            logger.error('Failed to fetch LF AI data');
            return resolve();
          }
          try {
            const data: any = load(body);
            const projects: { name: string, urls: { url: string; type: 'org' | 'repo' }[] }[] = [];
            for (const category of data.landscape) {
              for (const subcategory of category.subcategories) {
                for (const item of subcategory.items) {
                  if (['graduated', 'incubating'].includes(item.project)) {
                    if (item.repo_url.startsWith('https://github.com/Trusted-AI/')) {
                      const urls: { url: string; type: 'org' | 'repo' }[] = [{ url: item.repo_url, type: 'repo' }];
                      if (item.additional_repos?.length > 0) {
                        for (const repo of item.additional_repos) {
                          urls.push({ url: repo.repo_url, type: 'repo' });
                        }
                      }
                      projects.push({ name: item.name, urls });
                    } else {
                      projects.push({ name: item.name, urls: [{ url: item.repo_url, type: 'org' }] });
                    }
                  }
                }
              }
            }
            logger.info(projects.length, 'projects found in LF AI foundation');
            await generateLabels({
              foundationName: 'LF AI & Data Foundation',
              foundationKey: 'lfai', projects,
              topLevelData: {
                platforms: [{
                  name: 'GitHub',
                  type: 'Code Hosting',
                  orgs: [{
                    id: 45347303,
                    name: 'lfai',
                  }],
                }],
              },
            });
            logger.info('Finished processing LF AI foundation');
          } catch (e: any) {
            logger.error(`Error on processing LF AI foundation: ${e}`);
          }
          resolve();
        });
      });
    };

    // hyperledger labels
    // @ts-ignore
    const generateHyperledgerLabels = async (): Promise<void> => {
      return new Promise(resolve => {
        logger.info('Start processing Hyperledger foundation');
        request.get('https://raw.githubusercontent.com/hyperledger-dlt-landscape/hyperledger-dlt-landscape/main/landscape.yml', async (err, req, body) => {
          if (err || req.statusCode !== 200) {
            logger.error('Failed to fetch Hyperledger data');
            return resolve();
          }
          try {
            const data: any = load(body);
            const projects: { name: string, urls: { url: string; type: 'org' | 'repo' }[] }[] = [];
            for (const category of data.landscape) {
              for (const subcategory of category.subcategories) {
                for (const item of subcategory.items) {
                  if (['graduated', 'incubating'].includes(item.project)) {
                    if (item.repo_url.startsWith('https://github.com/hyperledger/')) {
                      const urls: { url: string; type: 'org' | 'repo' }[] = [{ url: item.repo_url, type: 'repo' }];
                      if (item.additional_repos?.length > 0) {
                        for (const repo of item.additional_repos) {
                          urls.push({ url: repo.repo_url, type: 'repo' });
                        }
                      }
                      projects.push({ name: item.name, urls });
                    } else {
                      projects.push({ name: item.name, urls: [{ url: item.repo_url, type: 'org' }] });
                    }
                  }
                }
              }
            }
            logger.info(projects.length, 'projects found in Hyperledger foundation');
            await generateLabels({
              foundationName: 'Hyperledger Foundation',
              foundationKey: 'hyperledger', projects,
              topLevelData: {
                platforms: [{
                  name: 'GitHub',
                  type: 'Code Hosting',
                  orgs: [{
                    id: 7657900,
                    name: 'hyperledger',
                  }],
                }],
              },
            });
            logger.info('Finished processing Hyperledger foundation');
          } catch (e: any) {
            logger.error(`Error on processing Hyperledger foundation: ${e}`);
          }
          resolve();
        });
      });
    };

    // LF Edge labels
    // @ts-ignore
    const generateLfedLabels = async (): Promise<void> => {
      return new Promise(resolve => {
        logger.info('Start processing LF Edge foundation');
        request.get('https://raw.githubusercontent.com/State-of-the-Edge/lfedge-landscape/master/landscape.yml', async (err, req, body) => {
          if (err || req.statusCode !== 200) {
            logger.error('Failed to fetch LF Edge data');
            return resolve();
          }
          try {
            const data: any = load(body);
            const projects: { name: string, urls: { url: string; type: 'org' | 'repo' }[] }[] = [];
            for (const category of data.landscape) {
              for (const subcategory of category.subcategories) {
                for (const item of subcategory.items) {
                  if (['growth', 'at_large', 'impact'].includes(item.project)) {
                    if (['lf-edge', 'State-of-the-Edge'].some(i =>
                      item.repo_url.startsWith(`https://github.com/${i}`))) {
                      const urls: { url: string; type: 'org' | 'repo' }[] = [{ url: item.repo_url, type: 'repo' }];
                      if (item.additional_repos?.length > 0) {
                        for (const repo of item.additional_repos) {
                          urls.push({ url: repo.repo_url, type: 'repo' });
                        }
                      }
                      projects.push({ name: item.name, urls });
                    } else {
                      projects.push({ name: item.name, urls: [{ url: item.repo_url, type: 'org' }] });
                    }
                  }
                }
              }
            }
            logger.info(projects.length, 'projects found in LF Edge foundation');
            await generateLabels({
              foundationName: 'LF Edge Foundation',
              foundationKey: 'lfed', projects,
              topLevelData: {
                platforms: [{
                  name: 'GitHub',
                  type: 'Code Hosting',
                  orgs: [{
                    id: 47366123,
                    name: 'lf-edge',
                  }, {
                    id: 39313637,
                    name: 'State-of-the-Edge',
                  }],
                }],
              },
            });
            logger.info('Finished processing LF Edge foundation');
          } catch (e: any) {
            logger.error(`Error on processing LF Edge foundation: ${e}`);
          }
          resolve();
        });
      });
    };

    await generateCncfLabels();
    await generateOpenjsLabels();
    await generateLfaiLabels();
    await generateHyperledgerLabels();
    await generateLfedLabels();
  },
};

module.exports = task;
