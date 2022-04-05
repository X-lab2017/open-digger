import { Octokit } from '@octokit/core';
import getConfig from '../config';
import { existsSync, readFileSync } from 'fs';
import { EOL } from 'os';

(async () => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    console.log('Not in GitHub actions env or event file not found.');
    return;
  }

  const event = JSON.parse(readFileSync(eventPath).toString());

  console.log(event);

  if (!event?.issue?.number || !event?.issue?.pull_request) {
    console.log(`Event not current, need event to be in pull request`);
    return;
  }

  const pullNumber = event.issue.number;
  const owner = event.repository.owner.login;
  const repo = event.repository.name;

  const config = await getConfig();
  const octokit = new Octokit({ auth: config.ci.token });

  try {
    const pullDetail = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
      owner,
      repo,
      pull_number: pullNumber,
    });
    console.log(pullDetail.data.filter(f => f.filename.startsWith('labeled_data/') && f.filename.endsWith('.yml')));
    const changedLabelFiles = pullDetail.data.map(i => i.filename).filter(f => f.startsWith('labeled_data/') && f.endsWith('.yml'));
    if (changedLabelFiles.length === 0) {
      console.log('No label files changed in this pr');
      return;
    }

    const commentBody = `The changed files are: ${EOL}${changedLabelFiles.map(f => `- ${f}`).join(EOL)}`;
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner,
      repo,
      issue_number: pullNumber,
      body: commentBody,
    });
  } catch (e) {
    console.log(`Request pull detail error, err=${e}`);
  }

})();
