import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import cron from 'node-cron';
import { getLogger } from '../utils';

export interface Task {
  cron: string;
  enable: boolean;
  immediate: boolean;
  callback: (date: Date) => Promise<void>;
}

(async () => {
  const logger = getLogger('TaskRunner');

  const taskDir = join(__dirname, './tasks');
  if (!existsSync(taskDir)) {
    logger.info('Task dir not exists.');
    return;
  }

  const taskFiles = readdirSync(taskDir);
  taskFiles.forEach(async taskFile => {
    const p = join(taskDir, taskFile);
    const task: Task = await import(p);
    if (!task.cron || !task.callback) {
      logger.error(`Task in ${taskFile} is not a valid task.`);
      return;
    }
    if (task.enable) {
      logger.info(`Enable task: ${taskFile}`);
      cron.schedule(task.cron, t => {
        return new Promise<void>(async resolve => {
          try {
            logger.info(`Start to run task for ${taskFile}`);
            await task.callback(t);
            logger.info(`Task ${taskFile} finished.`);
          } catch (e) {
            logger.error(e);
          }
          resolve();
        });
      });
      if (task.immediate) {
        try {
          logger.info(`Start to run task for ${taskFile}`);
          await task.callback(new Date());
          logger.info(`Task ${taskFile} finished.`);
        } catch (e) {
          logger.error(e);
        }
      }
    }
  });
})();
