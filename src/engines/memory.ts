import { config } from '../config/default';
import { logger } from '../utils/logger';

export interface MemoryEntry {
  id: string;
  timestamp: number;
  content: any;
  type: string;
}

export class MemoryEngine {
  private entries: MemoryEntry[];

  constructor() {
    this.entries = [];
  }

  addEntry(content: any, type: string): void {
    const entry: MemoryEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      content,
      type,
    };

    this.entries.push(entry);
    logger.info(`Added memory entry of type ${type}`);

    if (this.entries.length > config.memory.maxEntries) {
      const removed = this.entries.shift();
      logger.debug(`Removed oldest memory entry: ${removed?.id}`);
    }
  }

  getEntries(type?: string): MemoryEntry[] {
    if (type) {
      return this.entries.filter(entry => entry.type === type);
    }
    return [...this.entries];
  }

  clearEntries(): void {
    this.entries = [];
    logger.info('Cleared all memory entries');
  }
} 