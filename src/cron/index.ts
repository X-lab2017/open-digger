import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import cron from 'node-cron';
import { getLogger } from '../utils';
import getConfig from '../config';

export interface Task {
  cron: string;
  callback: (date: Date) => Promise<void>;
}

(async () => {
  const logger = getLogger('TaskRunner');
  const config = await getConfig();

  const taskDir = join(__dirname, './tasks');
  if (!existsSync(taskDir)) {
    logger.info('Task dir not exists.');
    return;
  }

  const enableTasks = new Set<string>(config.task.enable);
  const immediateTasks = new Set<string>(config.task.immediate);

  const taskFiles = readdirSync(taskDir);
  taskFiles.forEach(async taskFile => {
    const p = join(taskDir, taskFile);
    const task: Task = await import(p);
    if (!task.cron || !task.callback) {
      logger.error(`Task in ${taskFile} is not a valid task.`);
      return;
    }
    const taskName = taskFile.slice(0, -3); // remove suffix
    if (enableTasks.has(taskName)) {
      logger.info(`Enable task: ${taskName}`);
      cron.schedule(task.cron, t => {
        return new Promise<void>(async resolve => {
          try {
            logger.info(`Start to run task for ${taskName}`);
            await task.callback(t);
            logger.info(`Task ${taskName} finished.`);
          } catch (e) {
            logger.error(e);
          }
          resolve();
        });
      });
      if (immediateTasks.has(taskName)) {
        try {
          logger.info(`Start to run task for ${taskName}`);
          await task.callback(new Date());
          logger.info(`Task ${taskName} finished.`);
        } catch (e) {
          logger.error(e);
        }
      }
    }
  });
})();
