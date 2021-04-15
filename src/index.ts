import { exec } from 'child_process';
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';
import { caseStudy } from './case-study';
import { globalStudy } from './global-study';

(async () => {
  await globalStudy();
  await caseStudy();

  const runType = process.env.RUN_TYPE;
  if (runType === 'test') {
    const distDir = join(__dirname, '../dist');
    const files = readdirSync(distDir);
    files.forEach(f => {
      if (f.endsWith('.html')) {
        exec(`open ${join(distDir, f)}`);
      }
    });
  } else if (runType === 'ci') {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (eventPath === undefined || !existsSync(eventPath)) {
      console.log(`GitHub event not found ${eventPath}`);
      return;
    }
    try {
      const ev = JSON.parse(readFileSync(eventPath, 'utf8'));
      const prNum = ev.pull_request.number;
      const distDir = join(__dirname, '../dist');
      const files = readdirSync(distDir);
      let comment = `The CI process generated ${files.length} reports for this PR, please check the links to find out whether the results are as expected or not:\n`;
      files.forEach(f => {
        if (f.endsWith('.html')) {
          const newFileName = `pull-${prNum}-${f}`;
          renameSync(join(distDir, f), join(distDir, newFileName));
          comment += `- [${newFileName}](http://opendigger-oss.x-lab.info/${newFileName})\n`;
        }
      });
      writeFileSync(join(distDir, 'pr-comment.md'), comment);
    } catch (e) {
      console.log(`Exception on rename dist files, e=${e}`);
      process.exit(-1);
    }
  } else if (runType === 'publish') {
  } else {
    console.log(`Unknown run type ${runType}`);
  }
})();
