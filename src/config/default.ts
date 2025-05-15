import 'dotenv/config';

export const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY!,
  weatherApiKey: process.env.WEATHER_API_KEY!,
  rapidApiKey: process.env.RAPIDAPI_KEY!,
  rapidApiHost: process.env.RAPIDAPI_HOST!,
  weatherLocation: process.env.WEATHER_LOCATION || 'Jakarta',
  cronSchedule: '*/1 * * * *',
  decayRate: 0.05,
  energyThreshold: 0.2,
  moodDrift: 0.05,
  modelName: process.env.MODEL_NAME || 'gpt-4o-mini'
} as const; 