import { getTimeOfDay, getTimeBasedEnergyModifier } from '../utils/time';

export interface Traits {
  curiosity: number;
  empathy: number;
  humor: number;
  mood: number;
  energy: number;
}

export interface Hyperparams {
  temperature: number;
  top_p: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export function initializeTraits(): Traits {
  return {
    curiosity: 0.7,
    empathy: 0.8,
    humor: 0.6,
    mood: 0.5,
    energy: 0.8
  };
}

export function updateMood(traits: Traits, amount: number = 0): Traits {
  const timeOfDay = getTimeOfDay();
  const timeModifier = getTimeBasedEnergyModifier(timeOfDay) * 0.5; // Time affects mood less than energy
  
  // Apply the provided mood change and time modifier
  const modifiedAmount = amount + timeModifier;
  
  return {
    ...traits,
    mood: Math.max(0, Math.min(1, traits.mood + modifiedAmount))
  };
}

export function updateEnergy(traits: Traits, amount: number): Traits {
  const timeOfDay = getTimeOfDay();
  const timeModifier = getTimeBasedEnergyModifier(timeOfDay);
  
  // Base energy change is now determined by activity type
  // Time modifier affects how much energy is gained/lost
  const modifiedAmount = amount * (1 + timeModifier);
  
  // Ensure energy stays within bounds and changes feel natural
  const newEnergy = Math.max(0, Math.min(1, traits.energy + modifiedAmount));
  
  return {
    ...traits,
    energy: newEnergy
  };
}

export function calculateActivityEnergyChange(action: string): number {
  const actionLower = action.toLowerCase();
  
  // Energy-consuming activities
  if (actionLower.includes('job') || actionLower.includes('work') || actionLower.includes('portfolio')) {
    return -0.2; // Work activities are more draining
  } 
  if (actionLower.includes('discord') || actionLower.includes('chat') || actionLower.includes('call')) {
    return -0.1; // Social activities are moderately draining
  }
  if (actionLower.includes('tiktok') || actionLower.includes('scroll')) {
    return -0.05; // Passive activities are less draining
  }
  if (actionLower.includes('rest') || actionLower.includes('sleep') || actionLower.includes('nap')) {
    return 0.2; // Resting increases energy
  }
  if (actionLower.includes('snack') || actionLower.includes('eat')) {
    return 0.1; // Snacking gives a small energy boost
  }
  
  return -0.1; // Default energy drain for other activities
}

export function mapTraitsToHyperparams(traits: Traits): Hyperparams {
  const timeOfDay = getTimeOfDay();
  const timeModifier = getTimeBasedEnergyModifier(timeOfDay);
  
  // Adjust temperature based on time of day and energy
  const baseTemp = 0.7 + (traits.energy * 0.3);
  const timeAdjustedTemp = baseTemp + (timeModifier * 0.2);
  
  return {
    temperature: Math.max(0.1, Math.min(1, timeAdjustedTemp)),
    top_p: 0.9,
    max_tokens: 150,
    frequency_penalty: 0.5,
    presence_penalty: 0.5
  };
} 