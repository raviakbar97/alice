import { promises as fs } from 'fs';
import { appendLog } from '../src/utils/logger';
import { ActivityLogEntry } from '../src/types';

describe('Logger', () => {
  const testEntry: ActivityLogEntry = {
    timestamp: new Date().toISOString(),
    weather: { desc: 'test', temp: 25 },
    energy: 0.8,
    mood: 0.7,
    thoughts: 'test thoughts',
    actions: 'test actions'
  };

  afterEach(async () => {
    try {
      await fs.unlink('logs/activity-log.json');
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('appendLog', () => {
    it('creates log file and appends entry', async () => {
      await appendLog(testEntry);
      const content = await fs.readFile('logs/activity-log.json', 'utf-8');
      const logs = JSON.parse(content);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(testEntry);
    });

    it('appends to existing log file', async () => {
      await appendLog(testEntry);
      await appendLog(testEntry);
      const content = await fs.readFile('logs/activity-log.json', 'utf-8');
      const logs = JSON.parse(content);
      expect(logs).toHaveLength(2);
    });
  });
}); 