import { Task } from '../../index';

/**
 * This task is used to fetch github data by open-share-data-app
 */

const task: Task = {
  cron: '* */1 * * *',
  singleInstance: false,
  callback: async () => {
  },
};

export default task;
