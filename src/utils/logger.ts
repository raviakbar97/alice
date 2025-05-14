import { promises as fs } from 'fs';
import { ActivityLogEntry } from '../types';

const LOG_PATH = 'logs/activity-log.json';

export async function appendLog(entry: ActivityLogEntry): Promise<void> {
  await fs.mkdir('logs', { recursive: true });
  const existing = await fs.readFile(LOG_PATH, 'utf-8').catch(() => '[]');
  const arr = JSON.parse(existing) as ActivityLogEntry[];
  arr.push(entry);
  await fs.writeFile(LOG_PATH, JSON.stringify(arr, null, 2));
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...args);
        break;
      case 'info':
        console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger(); 