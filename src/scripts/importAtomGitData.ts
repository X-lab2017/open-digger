import { insertRecords } from '../db/clickhouse';
import { readline } from '../utils';
import path from 'path';
import getConfig from '../config';
import { forEveryMonth } from '../metrics/basic';

console.log('Importing AtomGit data...');

(async () => {
  const config = await getConfig();

  const importData = async (year: number, month: number) => {
    let items: any[] = [];
    await readline(path.join(config.atomgit.dataPath, `events_${year}-${month.toString().padStart(2, '0')}.ndjson`),
      async line => {
        const data = JSON.parse(line);
        const item: any = {
          platform: 'AtomGit',
          type: data.type,
          action: data.action ?? '',
          actor_id: +data.actor_id,
          actor_login: data.actor_login,
          repo_id: +data.repo_id,
          repo_name: data.repo_name,
          org_id: +data.org_id,
          org_login: data.org_login,
          created_at: data.created_at.replace('T', ' ').replace('Z', ''),
        };

        if (data.type === 'StarEvent') {
          item.type = 'WatchEvent';
        } else if (data.type === 'ForkEvent') {
          item.fork_forkee_id = +data.forkee_id;
          item.fork_forkee_name = data.forkee_name;
          item.fork_forkee_owner_id = +data.forkee_owner_id;
          item.fork_forkee_owner_login = data.forkee_owner_login;
        } else if (data.type === 'IssuesEvent') {
          item.issue_id = +data.issue_id;
          item.issue_number = +data.issue_number;
          item.issue_title = data.title ?? '';
          item.body = data.body ?? '';
          item.issue_author_id = +(data.issue_author_id ?? 0);
          item.issue_author_login = data.issue_author_login ?? '';
        } else if (data.type === 'IssueCommentEvent') {
          item.action = 'created';
          item.issue_id = +data.issue_id;
          item.issue_number = +data.issue_number;
          item.issue_comment_id = parseInt(data.issue_comment_id.slice(25), 16);
          item.body = data.body ?? '';
        } else if (data.type === 'PullRequestEvent') {
          if (data.action === 'merged') {
            item.action = 'closed';
            item.pull_merged = 1;
          }
          if (data.action === 'created') {
            item.action = 'opened';
          }
          item.issue_id = +data.pull_id;
          item.issue_number = +data.pull_number;
          item.issue_title = data.title ?? '';
          item.issue_author_id = +(data.pull_author_id ?? 0);
          item.issue_author_login = data.pull_author_login ?? '';
          item.body = data.body ?? '';
          item.pull_base_ref = data.base_ref ?? '';
          item.pull_head_repo_id = +(data.head_repo_id ?? 0);
          item.pull_head_repo_name = data.head_repo_name;
          item.pull_head_ref = data.head_ref ?? '';
        } else if (data.type === 'PullRequestReviewCommentEvent') {
          item.action = 'created';
          item.issue_id = +data.pull_id;
          item.issue_number = +data.pull_number;
          item.pull_review_comment_id = parseInt(data.pull_review_comment_id.slice(25), 16);
        } else if (data.type === 'ReleaseEvent') {
          item.release_id = +data.release_id;
          item.release_name = data.name ?? '';
          item.body = data.body ?? '';
          item.release_tag_name = data.tag_name ?? '';
        }
        items.push(item);
      });
    if (items.length === 0) return;
    console.log(`Get data from ${year}-${month}: ${items.length}, start to insert...`);
    await insertRecords(items, 'events');
  };

  await forEveryMonth(2023, 8, new Date().getFullYear(), new Date().getMonth() + 1, importData);

  console.log('Imported AtomGit data');
})();
