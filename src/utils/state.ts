import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface AIState {
  energy: number;  // 0 to 1
  mood: number;    // 0 to 1
  lastUpdate: string;
}

const STATE_FILE = 'logs/ai-state.json';

// Initialize with default values if file doesn't exist
function initializeState(): AIState {
  return {
    energy: 1.0,
    mood: 0.8,
    lastUpdate: new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  };
}

// Load current state or create new if doesn't exist
export function loadState(): AIState {
  try {
    if (!existsSync(STATE_FILE)) {
      const initialState = initializeState();
      writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
      return initialState;
    }
    
    const content = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(content) as AIState;
  } catch (error) {
    console.error('Error loading AI state:', error);
    return initializeState();
  }
}

// Save state with new values
export function saveState(energy: number, mood: number): void {
  try {
    // Ensure values stay within bounds
    const boundedEnergy = Math.max(0, Math.min(1, energy));
    const boundedMood = Math.max(0, Math.min(1, mood));
    
    const state: AIState = {
      energy: boundedEnergy,
      mood: boundedMood,
      lastUpdate: new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    };
    
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving AI state:', error);
  }
}

// Update state with changes
export function updateState(energyChange: number, moodChange: number): AIState {
  const currentState = loadState();
  
  // Apply changes with smaller impact
  const newEnergy = Math.max(0, Math.min(1, currentState.energy + (energyChange * 0.1)));
  const newMood = Math.max(0, Math.min(1, currentState.mood + (moodChange * 0.1)));
  
  saveState(newEnergy, newMood);
  return { ...currentState, energy: newEnergy, mood: newMood };
} 