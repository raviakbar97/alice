export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export const JAKARTA_TIMEZONE = 'Asia/Jakarta';

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  // Convert to Jakarta time
  const jakartaDate = new Date(date.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }));
  const hour = jakartaDate.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'day';
  } else if (hour >= 18 && hour < 22) {
    return 'evening';
  } else {
    return 'night';  // This covers 22:00-04:59
  }
}

export function getTimeBasedEnergyModifier(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'morning':
      return 0.2;  // More energetic in morning
    case 'day':
      return 0.1;  // Normal energy during day
    case 'evening':
      return 0.0;  // Neutral energy in evening
    case 'night':
      return -0.2; // Less energetic at night
    default:
      return 0.0;  // Default case to satisfy TypeScript
  }
}

export function shouldConsiderRest(energy: number, timeOfDay: TimeOfDay, thoughts: string[]): boolean {
  // Base energy threshold - this is the main trigger for rest consideration
  const baseThreshold = 0.2;
  
  // Adjust threshold based on time of day
  const timeThreshold = timeOfDay === 'night' ? 0.3 : baseThreshold;
  
  // First check: Is energy low enough to consider rest?
  if (energy >= timeThreshold) {
    return false; // Energy is fine, no need to consider rest
  }

  // Second check: If energy is low, check if AI wants to rest
  // This is a softer check - just looking for rest-related thoughts
  const restIndicators = [
    'sleep', 'rest', 'tired', 'exhausted', 'bed', 'nap',
    'need to rest', 'going to sleep', 'time to sleep',
    'feeling sleepy', 'wanna sleep', 'wanna rest'
  ];
  
  return thoughts.some(thought => 
    restIndicators.some(indicator => 
      thought.toLowerCase().includes(indicator)
    )
  );
} 