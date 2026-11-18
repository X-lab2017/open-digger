import { Task } from '../../index';
import { GithubIssuePullRunner } from './runner';

const runner = new GithubIssuePullRunner();

const task: Task = {
  cron: '*/5 * * * *',
  singleInstance: true,
  callback: async () => {
    await runner.runRound();
  },
};

module.exports = task;
