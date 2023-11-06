import { Task } from '..';
import getConfig from '../../config';
import { Readable } from 'stream';
import { createClient } from '@clickhouse/client';
import { readFileSync } from 'fs';
import { Octokit } from '@octokit/rest';
import { App } from '@octokit/app';
import { query } from '../../db/clickhouse';

/**
 * This task is used to update user location to standard address
 */
const task: Task = {
  cron: '0 3 * * *',
  enable: false,
  immediate: false,
  callback: async () => {
    const config = await getConfig();

    const githubApp = new App({
      id: config.github.appId,
      privateKey: readFileSync(config.github.appPrivateKeyPath).toString(),
    });

    const gettInstalledRepos = async (): Promise<{ iid: any, id: any, name: string }[]> => {
      // get repo list from GitHub App
      const octokit = new Octokit({
        auth: `Bearer ${githubApp.getSignedJsonWebToken()}`,
      });
      const repos: { iid: number, id: number, name: string }[] = [];
      const installations = await octokit.paginate('GET /app/installations');
      for (const i of installations) {
        const oct = new Octokit({
          auth: `Bearer ${await githubApp.getInstallationAccessToken({ installationId: i.id })}`,
        });
        const installationRepos = await oct.paginate('GET /installation/repositories');
        console.log(`Got ${installationRepos.length} repos for installation ${i?.account?.login}`);
        repos.push(...installationRepos.map(r => ({ iid: i.id, id: r.id, name: r.full_name })));
      }
      return repos;
    };

    const getOctokitClient = async (repo: { iid: number, id: number, name: string }): Promise<Octokit> => {
      return new Octokit({
        auth: `Bearer ${await githubApp.getInstallationAccessToken({
          installationId: repo.iid,
          repositoryIds: [repo.id],
        })}`,
      });
    };

    const getUpdateIssues = async (id: number): Promise<number[]> => {
      const q = `SELECT DISTINCT issue_number FROM gh_events WHERE repo_id=${id} AND issue_number > 0 AND created_at > (SELECT MAX(created_at) FROM gh_events WHERE repo_id=${id} AND type='IssuesReactionEvent')`;
      const issues = await query<number[]>(q);
      return issues.map(i => i[0]);
    };

    const getReactions = async (r: { iid: number, id: number, name: string }, issues: number[]): Promise<any[]> => {
      const [owner, name] = r.name.split('/');
      const result: any[] = [];
      let oct = await getOctokitClient(r);
      let count = 0;
      for (let i = 0; i < issues.length;) {
        const number = issues[i];
        try {
          const reactions: { id: number, created_at: string, content: string, user: { id: number, login: string } | null }[] = await oct.paginate('GET /repos/{owner}/{repo}/issues/{issue_number}/reactions', {
            owner, repo: name, issue_number: number,
          });
          for (const reaction of reactions) {
            if (!reaction.user) continue;
            const item = {
              id: reaction.id,
              repo_id: r.id,
              repo_name: r.name,
              actor_id: reaction.user.id,
              actor_login: reaction.user.login,
              type: 'IssuesReactionEvent',
              issue_number: number,
              body: reaction.content,
              created_at: reaction.created_at.replace('T', ' ').replace('Z', ''),
            };
            result.push(item);
          }
          i++;
        } catch (e: any) {
          console.log(`Error on fetching reactions for ${r.name}#${number}, e=${e}`);
          if (e.toString().includes('Bad credentials')) {
            // rate limit hit, get new client and retry
            oct = await getOctokitClient(r);
            continue;
          }
        }
        if (count++ > 3000) {
          // re-generate client for every 3000 requests in case hit rate limit
          count = 0;
          oct = await getOctokitClient(r);
        }
      }
      return result;
    };

    const insertReactions = async (reactions: any[]): Promise<void> => {
      const clickhouseClient = createClient(config.db.clickhouse);
      const stream = new Readable({
        objectMode: true,
        read: () => { },
      });
      for (const r of reactions) stream.push(r);
      stream.push(null);
      await clickhouseClient.insert({
        table: 'gh_events',
        values: stream,
        format: 'JSONEachRow',
      });
      await clickhouseClient.close();
    };

    const repos = await gettInstalledRepos();
    console.log(`Got ${repos.length} repos to update.`);
    for (const r of repos) {
      const issues = await getUpdateIssues(r.id);
      if (issues.length === 0) continue;
      const reactions = await getReactions(r, issues);
      if (reactions.length === 0) continue;
      console.log(`Goona insert ${reactions.length} reactions for ${r.name}`);
      await insertReactions(reactions);
    }
  }
};

module.exports = task;
