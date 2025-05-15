export * from '../engines/personality';
export * from '../engines/memory';

export interface Weather {
  desc: string;
  temp: number;
}

export interface ActivityLogEntry {
  timestamp: string;
  weather: Weather;
  energy: number;
  mood: number;
  thoughts: string[];
  actions: string[];
  duration: number;
}

export interface ActivityAnalysis {
  activityType: 'work' | 'rest' | 'eating' | 'social' | 'passive';
  intensity: number;
  energyImpact: number;
  moodImpact: number;
  isAppropriate: boolean;
} 