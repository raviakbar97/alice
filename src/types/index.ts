export * from '../engines/personality';
export * from '../engines/memory';

export interface Traits {
  curiosity: number;
  empathy: number;
  humor: number;
  mood: number;
  energy: number;
}

export interface Weather {
  desc: string;
  temp: number;
}

export interface MemoryEntry {
  timestamp: string;
  summary: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  weather: Weather;
  energy: number;
  mood: number;
  thoughts: string;
  actions: string;
}

export interface Hyperparams {
  temperature: number;
  top_p: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
} 