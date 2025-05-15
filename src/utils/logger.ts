import { promises as fs } from 'fs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ActivityAnalysis } from '../types';
import { JAKARTA_TIMEZONE } from './time';

export interface ActivityLog {
  timestamp: string;
  weather: { desc: string; temp: number };
  energy: number;
  mood: number;
  thoughts: string[];
  actions: string[];
  duration: number;
}

const LOG_PATH = 'logs/activity-log.json';

export function getJakartaTimestamp(): string {
  return new Date().toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE });
}

export async function appendLog(entry: ActivityLog): Promise<void> {
  try {
    const logPath = join(process.cwd(), 'logs', 'activity-log.json');
    let logs: ActivityLog[] = [];
    
    try {
      const data = readFileSync(logPath, 'utf8');
      logs = JSON.parse(data);
    } catch (err) {
      // If file doesn't exist or is empty, start with empty array
      logs = [];
    }
    
    logs.push(entry);
    
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error appending to activity log:', err);
  }
}

export async function appendAnalyzerLog(entry: {
  timestamp: string;
  activity: string;
  analysis: ActivityAnalysis;
  energyChange: number;
  moodChange: number;
  finalEnergy: number;
  finalMood: number;
}): Promise<void> {
  const logPath = join(__dirname, '../../logs/analyzer-log.json');
  let logs: any[] = [];

  try {
    if (existsSync(logPath)) {
      const content = readFileSync(logPath, 'utf-8');
      logs = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading analyzer log:', err);
  }

  logs.push(entry);
  
  // Keep only last 100 entries to prevent log from growing too large
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }

  try {
    writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error writing analyzer log:', err);
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = getJakartaTimestamp();
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

export function getRecentActivityLog(minutes: number = 60): ActivityLog[] {
  try {
    const logPath = 'logs/activity-log.json';
    if (!existsSync(logPath)) {
      return [];
    }
    
    const content = readFileSync(logPath, 'utf-8');
    const logs: ActivityLog[] = JSON.parse(content);
    
    if (logs.length === 0) {
      return [];
    }
    
    const now = new Date();
    const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
    
    return logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= cutoff;
    });
  } catch (error) {
    console.error('Error reading activity log:', error);
    return [];
  }
} 