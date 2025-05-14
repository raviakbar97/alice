import { MemoryEntry } from '../types';

const shortTerm: MemoryEntry[] = [];

export function addMemory(entry: MemoryEntry): void {
  shortTerm.push(entry);
  if (shortTerm.length > 60) shortTerm.shift();
}

export function getRecentMemories(): MemoryEntry[] {
  const now = Date.now();
  return shortTerm.filter(e => (now - Date.parse(e.timestamp)) / 60000 < 60);
}

export async function summarizeLongTerm(): Promise<string> {
  return ''; // stub
} 