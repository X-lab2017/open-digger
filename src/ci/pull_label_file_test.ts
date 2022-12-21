import { existsSync, readFileSync } from 'fs';
import { EOL } from 'os';
import { load } from 'js-yaml';
import { getGitHubClient, getNames, requestPullFile } from './utils';

interface LabelContent {
  name: string;
  type: string;
  data: {
    github_repo?: number[];
    github_org?: number[];
    github_user?: number[];
  }
}

(async () => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    console.log(`Not in GitHub actions env or event file not found at path=${eventPath}.`);
    return;
  }

  const event = JSON.parse(readFileSync(eventPath).toString());

  if (!event?.issue?.number || !event?.issue?.pull_request || !event?.repository) {
    console.log(`Event not currect, need event to be in pull request, event=${JSON.stringify(event)}`);
    return;
  }

  const pullNumber = event.issue.number;
  const owner = event.repository.owner.login;
  const repo = event.repository.name;

  const octokit = await getGitHubClient();

  try {
    const pullDetail = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
      owner,
      repo,
      pull_number: pullNumber,
    });
    const changedLabelFiles = pullDetail.data.filter(f => f.filename.startsWith('labeled_data/') && f.filename.endsWith('.yml'));
    if (changedLabelFiles.length === 0) {
      console.log('No label files changed in this pr');
      return;
    }

    let comment = `I found ${changedLabelFiles.length} label file(s) changed in this PR. The contents are parsed as below:${EOL}`;
    for (const f of changedLabelFiles) {
      comment += `### Pasered result for \`${f.filename}\` is:${EOL}`;
      try {
        const content = await requestPullFile(f.raw_url);
        const item: LabelContent = load(content, { json: true }) as any;
        comment += `- Name: ${item.name}${EOL}- Type: ${item.type}${EOL}`;
        if (item.data.github_org) {
          comment += `- Org:${EOL}`;
          const orgNames = await getNames(item.data.github_org, 'org', octokit);
          for (const o of orgNames) {
            comment += `  - id: ${o.id}, name: ${o.name}${EOL}`;
          }
        }
        if (item.data.github_repo) {
          comment += `- Repo:${EOL}`;
          const repoNames = await getNames(item.data.github_repo, 'repo', octokit);
          for (const r of repoNames) {
            comment += `  - id: ${r.id}, name: ${r.name}${EOL}`;
          }
        }
        if (item.data.github_user) {
          comment += `- Org:${EOL}`;
          const userNames = await getNames(item.data.github_user, 'user', octokit);
          for (const u of userNames) {
            comment += `  - id: ${u.id}, name: ${u.name}${EOL}`;
          }
        }
      } catch (e) {
        comment = `Parse YAML file format error, please check the file content. e=${e}${EOL}`;
      }
    }

    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner,
      repo,
      issue_number: pullNumber,
      body: comment,
    });
  } catch (e) {
    console.log(`Request pull detail error, err=${e}`);
  }

})();
