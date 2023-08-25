import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import cron from 'node-cron';

export interface Task {
  cron: string;
  enable: boolean;
  immediate: boolean;
  callback: (date: Date) => Promise<void>;
}

(async () => {
  const taskDir = join(__dirname, './tasks');
  if (!existsSync(taskDir)) {
    console.log('Task dir not exists.');
    return;
  }

  const taskFiles = readdirSync(taskDir);
  taskFiles.forEach(async taskFile => {
    const p = join(taskDir, taskFile);
    const task: Task = await import(p);
    if (!task.cron || !task.callback) {
      console.log(`Task in ${taskFile} is not a valid task.`);
      return;
    }
    if (task.enable) {
      console.log(`Enable task: ${taskFile}`);
      cron.schedule(task.cron, t => {
        return new Promise<void>(async resolve => {
          try {
            console.log(`Start to run task for ${taskFile}`);
            await task.callback(t);
            console.log(`Task ${taskFile} finished.`);
          } catch (e) {
            console.log(e);
          }
          resolve();
        });
      });
      if (task.immediate) {
        try {
          console.log(`Start to run task for ${taskFile}`);
          await task.callback(new Date());
          console.log(`Task ${taskFile} finished.`);
        } catch (e) {
          console.log(e);
        }
      }
    }
  });
})();
