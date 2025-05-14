export const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    timeout: 30000,
  },
  scheduler: {
    defaultInterval: '*/5 * * * *', // Every 5 minutes
  },
  memory: {
    maxEntries: 60,
  },
  personality: {
    defaultTraits: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.75,
      neuroticism: 0.4,
    },
  },
}; 