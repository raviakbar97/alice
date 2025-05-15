import cron from 'node-cron';
import { logger, getRecentActivityLog, ActivityLog, appendLog } from '../utils/logger';
import { runTick } from '../index';
import { config } from '../config/default';
import { getTimeOfDay } from '../utils/time';

export class Scheduler {
  private tasks: Map<string, import('node-cron').ScheduledTask>;
  private isPaused: boolean = false;
  private restStartTime: Date | null = null;

  // Time-based rest durations (in milliseconds)
  private readonly MORNING_REST_DURATION = 15 * 60 * 1000;  // 15 minutes for morning rest
  private readonly NOON_REST_DURATION = 60 * 60 * 1000;     // 1 hour for power nap
  private readonly NIGHT_REST_DURATION = 8 * 60 * 60 * 1000; // 8 hours for night sleep

  // Energy recovery rates per minute
  private readonly MORNING_ENERGY_RECOVERY = 0.1;  // 10% per minute
  private readonly NOON_ENERGY_RECOVERY = 0.05;    // 5% per minute
  private readonly NIGHT_ENERGY_RECOVERY = 0.15;   // 15% per minute

  constructor() {
    this.tasks = new Map();
  }

  scheduleTask(name: string, cronExpression: string, task: () => Promise<void>): void {
    if (this.tasks.has(name)) {
      this.tasks.get(name)?.stop();
    }

    const scheduledTask = cron.schedule(cronExpression, async () => {
      if (!this.isPaused) {
        try {
          await task();
        } catch (error) {
          logger.error(`Error in scheduled task ${name}:`, error);
        }
      }
    });

    this.tasks.set(name, scheduledTask);
    logger.info(`Scheduled task ${name} with cron expression: ${cronExpression}`);
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

  pauseForRest(thoughts: string[]): void {
    if (!this.isPaused) {
      this.stopAllTasks();
      this.isPaused = true;
      this.restStartTime = new Date();
      
      const timeOfDay = getTimeOfDay();
      const restReason = thoughts.find((thought: string) => 
        thought.toLowerCase().includes('sleep') || 
        thought.toLowerCase().includes('rest') ||
        thought.toLowerCase().includes('tired')
      ) || 'Feeling tired and needing rest';

      // Determine rest duration based on time of day
      let restDuration: number;
      let energyRecoveryRate: number;
      let restType: string;

      switch (timeOfDay) {
        case 'morning':
          restDuration = this.MORNING_REST_DURATION;
          energyRecoveryRate = this.MORNING_ENERGY_RECOVERY;
          restType = 'morning rest';
          break;
        case 'day':
          restDuration = this.NOON_REST_DURATION;
          energyRecoveryRate = this.NOON_ENERGY_RECOVERY;
          restType = 'power nap';
          break;
        case 'night':
        case 'evening':
          restDuration = this.NIGHT_REST_DURATION;
          energyRecoveryRate = this.NIGHT_ENERGY_RECOVERY;
          restType = 'night sleep';
          break;
        default:
          restDuration = this.NOON_REST_DURATION;
          energyRecoveryRate = this.NOON_ENERGY_RECOVERY;
          restType = 'rest';
      }

      const restEndTime = new Date(this.restStartTime.getTime() + restDuration);
      
      logger.info(`Scheduler paused for ${restType} at ${this.restStartTime.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`);
      logger.info(`Reason: "${restReason}"`);
      logger.info(`Rest duration: ${restDuration / (60 * 1000)} minutes`);
      logger.info(`Will resume at: ${restEndTime.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`);
      logger.info(`Energy recovery rate: ${energyRecoveryRate * 100}% per minute`);

      // Calculate and apply energy recovery
      const recentLogs = getRecentActivityLog(1) as ActivityLog[];
      if (recentLogs.length > 0) {
        const lastLog = recentLogs[0];
        const minutesResting = restDuration / (60 * 1000);
        const energyRecovery = Math.min(1, lastLog.energy + (energyRecoveryRate * minutesResting));
        
        // Schedule the resume with the new energy level
        setTimeout(() => {
          this.resumeFromRest(energyRecovery);
        }, restDuration);
      } else {
        // If no logs, just resume after duration
        setTimeout(() => {
          this.resumeFromRest(1); // Full energy if no previous state
        }, restDuration);
      }
    }
  }

  resumeFromRest(newEnergy: number): void {
    if (this.isPaused && this.restStartTime) {
      const resumeTime = new Date();
      const timeOfDay = getTimeOfDay();
      const restDuration = resumeTime.getTime() - this.restStartTime.getTime();
      const restType = this.getRestType(timeOfDay);
      
      this.isPaused = false;
      this.restStartTime = null;
      
      // Log the energy recovery
      logger.info(`Rest completed at ${resumeTime.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}. Energy recovered to: ${(newEnergy * 100).toFixed(1)}%`);
      
      // Create a wake-up log entry based on rest type
      const wakeUpThoughts = this.getWakeUpThoughts(restType, timeOfDay);
      const wakeUpActions = this.getWakeUpActions(restType, timeOfDay);
      
      // Log the wake-up state
      appendLog({
        timestamp: resumeTime.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
        weather: { desc: '', temp: 0 }, // Weather will be updated in runTick
        energy: newEnergy,
        mood: 0.8, // Wake up in a good mood
        thoughts: wakeUpThoughts,
        actions: wakeUpActions,
        duration: 1 // Default duration for wake-up state, will be updated in next runTick
      }).catch((error: Error) => logger.error('Error logging wake-up state:', error));
      
      // Display wake-up countdown
      console.log('\n=== Wake Up Countdown ===');
      console.log(`Current activity: ${wakeUpActions.join(', ')}`);
      console.log(`Duration: 1 minute`);
      
      let remainingMinutes = 1;
      const countdownInterval = setInterval(() => {
        remainingMinutes--;
        process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear line
        process.stdout.write(`⏳ ${remainingMinutes}m remaining until next activity`);
        
        if (remainingMinutes <= 0) {
          clearInterval(countdownInterval);
          process.stdout.write('\n');
        }
      }, 60000);

      // Schedule next tick after wake-up
      setTimeout(() => {
        clearInterval(countdownInterval);
        runTick();
      }, 60000);
    }
  }

  private getRestType(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'morning': return 'morning rest';
      case 'day': return 'power nap';
      case 'night':
      case 'evening': return 'night sleep';
      default: return 'rest';
    }
  }

  private getWakeUpThoughts(restType: string, timeOfDay: string): string[] {
    switch (restType) {
      case 'morning rest':
        return [
          "That was a refreshing short rest. I feel more alert now.",
          "A quick morning rest was just what I needed to start the day right."
        ];
      case 'power nap':
        return [
          "That power nap really helped me recharge.",
          "I feel more focused after that short nap."
        ];
      case 'night sleep':
        if (timeOfDay === 'morning') {
          return [
            "I had such a good night's sleep. I feel refreshed and ready for the day.",
            "I wonder what I dreamed about last night... I remember something about [AI will fill in dream details]",
            "Morning already? I feel well-rested and energetic."
          ];
        } else {
          return [
            "I feel much better after that sleep.",
            "That was a good rest. I'm ready to continue my day."
          ];
        }
      default:
        return ["I feel better after that rest."];
    }
  }

  private getWakeUpActions(restType: string, timeOfDay: string): string[] {
    switch (restType) {
      case 'morning rest':
        return [
          "I stretch my arms and take a deep breath, feeling more awake.",
          "I get up from my quick rest, feeling refreshed and ready to start the day."
        ];
      case 'power nap':
        return [
          "I wake up from my power nap, feeling more alert.",
          "I sit up and rub my eyes, feeling recharged after the short nap."
        ];
      case 'night sleep':
        if (timeOfDay === 'morning') {
          return [
            "I slowly wake up, stretching and yawning as the morning light filters through my window.",
            "I get out of bed, feeling refreshed after a good night's sleep.",
            "I make my bed and open the curtains, ready to start a new day."
          ];
        } else {
          return [
            "I wake up feeling refreshed and ready to continue my day.",
            "I get up, feeling much better after that sleep."
          ];
        }
      default:
        return ["I get up, feeling better after the rest."];
    }
  }

  isSchedulerPaused(): boolean {
    return this.isPaused;
  }
}

export function startScheduler(): void {
  const scheduler = new Scheduler();
  
  // Schedule the main task to run every 15 minutes instead of every minute
  scheduler.scheduleTask('main', '*/15 * * * *', async () => {
    const recentLogs = getRecentActivityLog(1) as ActivityLog[];
    if (recentLogs.length > 0) {
      const lastLog = recentLogs[0];
      const timeOfDay = getTimeOfDay();
      
      // Check if the last action was actually resting/sleeping
      const isResting = lastLog.actions.some(action => 
        action.toLowerCase().includes('rest') ||
        action.toLowerCase().includes('sleep') ||
        action.toLowerCase().includes('nap') ||
        action.toLowerCase().includes('lying down') ||
        action.toLowerCase().includes('going to bed')
      );

      // Only pause if the AI is actually resting/sleeping
      if (isResting) {
        scheduler.pauseForRest(lastLog.thoughts);
      } else {
        await runTick();
      }
    } else {
      await runTick();
    }
  });
} 