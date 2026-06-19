import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import cron from 'node-cron';
import { getLogger } from '../utils';
import getConfig from '../config';

export interface Task {
  cron: string;
  singleInstance: boolean;
  callback: (date: Date | 'manual' | 'init') => Promise<void>;
}

(async () => {
  const logger = getLogger('TaskRunner');
  const config = await getConfig();

  const taskDir = join(__dirname, './tasks');
  if (!existsSync(taskDir)) {
    logger.info('Task dir not exists.');
    return;
  }

  // If a task name is passed as a CLI argument, run that task immediately
  // and ignore enable/immediate/cron config as well as all other tasks.
  const targetTaskName = process.argv[2];
  if (targetTaskName) {
    const normalizedName = targetTaskName.endsWith('.js') ? targetTaskName.slice(0, -3) : targetTaskName;
    const taskFiles = readdirSync(taskDir);
    const matchedFile = taskFiles.find(taskFile => {
      const name = taskFile.endsWith('.js') ? taskFile.slice(0, -3) : taskFile;
      return name === normalizedName;
    });
    if (!matchedFile) {
      logger.error(`Task ${normalizedName} not found in ${taskDir}.`);
      return;
    }
    const task: Task = await import(join(taskDir, matchedFile));
    if (!task.callback) {
      logger.error(`Task in ${matchedFile} is invalid.`);
      return;
    }
    logger.info(`Manually run task: ${normalizedName}`);
    try {
      await task.callback('manual');
      logger.info(`Task ${normalizedName} finished.`);
    } catch (e) {
      logger.error(`Error on running ${normalizedName}, e=${e}`);
    }
    return;
  }

  const enableTasks = new Set<string>(config.task.enable);
  const immediateTasks = new Set<string>(config.task.immediate);

  const taskFiles = readdirSync(taskDir);
  taskFiles.forEach(async taskFile => {
    let path = join(taskDir, taskFile);
    if (statSync(path).isDirectory()) {
      path = join(path, 'index.js');
    }
    if (!existsSync(path)) {
      logger.error(`Task not exists for ${path}`);
      return;
    }
    const task: Task = await import(join(taskDir, taskFile));
    if (!task.cron || !task.callback) {
      logger.error(`Task in ${taskFile} is invalid.`);
      return;
    }
    const taskName = taskFile.endsWith('.js') ? taskFile.slice(0, -3) : taskFile;
    const runningTasksSet = new Set<string>();
    if (enableTasks.has(taskName)) {
      logger.info(`Enable task: ${taskName}`);
      cron.schedule(task.cron, t => new Promise<void>(async resolve => {
        try {
          if (task.singleInstance && runningTasksSet.has(taskName)) {
            logger.info(`Task ${taskName} is running, skip.`);
            return;
          }
          logger.info(`Start to run task: ${taskName}`);
          runningTasksSet.add(taskName);
          await task.callback(t);
          runningTasksSet.delete(taskName);
        } catch (e) {
          logger.error(`Error on running ${taskName}, e=${e}`);
          runningTasksSet.delete(taskName);
        }
        logger.info(`Task ${taskName} finished.`);
        resolve();
      }), { runOnInit: immediateTasks.has(taskName) });
    }
  });
})();
