import { getLogger } from "../../utils";
import getConfig from "../../config";
import { Task } from "..";

const task: Task = {
  cron: '20 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('UpdateGithubPullsInfoTask');
    const config: any = await getConfig();

    const updateCount = 4000;
    const concurrentRequestNumber = 10;

    logger.info('UpdateGithubPullsInfoTask done.');
  }
};

module.exports = task;
