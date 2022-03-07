import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import cron from 'node-cron';

export interface Task {
  cron: string;
  enable: boolean;
  immediate: boolean;
  callback: (date: Date) => void;
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
      console.log(`Task in ${p} is not a valid task.`);
      return;
    }
    if (task.enable) {
      cron.schedule(task.cron, task.callback);
      if (task.immediate) {
        task.callback(new Date());
      }
    }
  });
})();
