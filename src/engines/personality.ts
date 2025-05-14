import { Traits, Hyperparams } from '../types';
import { config } from '../config/default';

export function initializeTraits(): Traits {
  return { curiosity: 0.7, empathy: 0.5, humor: 0.2, mood: 0.5, energy: 1.0 };
}

export function updateMood(traits: Traits): Traits {
  traits.mood = Math.min(1, Math.max(0, traits.mood + (Math.random() * 2 - 1) * config.moodDrift));
  return traits;
}

export function updateEnergy(traits: Traits, cost: number): Traits {
  traits.energy = Math.min(1, Math.max(0, traits.energy - cost));
  return traits;
}

export function mapTraitsToHyperparams(traits: Traits): Hyperparams {
  const temp = traits.mood > 0.7 ? 1.0 : traits.mood < 0.3 ? 0.4 : 0.7;
  return {
    temperature: temp,
    top_p: temp + 0.2,
    max_tokens: 256,
    frequency_penalty: traits.empathy < 0.3 ? 0.2 : 0.0,
    presence_penalty: traits.curiosity < 0.3 ? 0.2 : 0.0
  };
} 