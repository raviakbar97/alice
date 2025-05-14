export const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY!,
  weatherApiKey: process.env.WEATHER_API_KEY!,
  cronSchedule: '*/1 * * * *',
  decayRate: 0.05,
  energyThreshold: 0.2,
  moodDrift: 0.05
} as const; 