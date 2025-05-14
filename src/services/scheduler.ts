import cron from 'node-cron';
import { logger } from '../utils/logger';

export class Scheduler {
  private tasks: Map<string, cron.ScheduledTask>;

  constructor() {
    this.tasks = new Map();
  }

  scheduleTask(id: string, cronExpression: string, task: () => void): void {
    if (this.tasks.has(id)) {
      logger.warn(`Task ${id} already exists. Overwriting...`);
      this.tasks.get(id)?.stop();
    }

    const scheduledTask = cron.schedule(cronExpression, () => {
      try {
        task();
      } catch (error) {
        logger.error(`Error executing task ${id}:`, error);
      }
    });

    this.tasks.set(id, scheduledTask);
    logger.info(`Scheduled task ${id} with cron expression: ${cronExpression}`);
  }

  stopTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
      logger.info(`Stopped task ${id}`);
    } else {
      logger.warn(`Task ${id} not found`);
    }
  }

  stopAllTasks(): void {
    this.tasks.forEach((task, id) => {
      task.stop();
      logger.info(`Stopped task ${id}`);
    });
    this.tasks.clear();
  }
} 