import { addMemory, getRecentMemories, summarizeLongTerm } from '../src/engines/memory';
import { MemoryEntry } from '../src/types';

describe('Memory', () => {
  describe('addMemory', () => {
    it('adds entry to short term memory', () => {
      const entry: MemoryEntry = { timestamp: new Date().toISOString(), summary: 'test' };
      addMemory(entry);
      const memories = getRecentMemories();
      expect(memories).toContainEqual(entry);
    });
  });

  describe('getRecentMemories', () => {
    it('returns only memories from last 60 minutes', () => {
      const oldEntry: MemoryEntry = {
        timestamp: new Date(Date.now() - 61 * 60000).toISOString(),
        summary: 'old'
      };
      const newEntry: MemoryEntry = {
        timestamp: new Date().toISOString(),
        summary: 'new'
      };
      addMemory(oldEntry);
      addMemory(newEntry);
      const memories = getRecentMemories();
      expect(memories).toContainEqual(newEntry);
      expect(memories).not.toContainEqual(oldEntry);
    });
  });

  describe('summarizeLongTerm', () => {
    it('returns a string', async () => {
      const summary = await summarizeLongTerm();
      expect(typeof summary).toBe('string');
    });
  });
}); 