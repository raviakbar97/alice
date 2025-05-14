import { getCurrentTime, getCurrentWeather } from '../src/services/fetcher';

describe('Fetcher', () => {
  describe('getCurrentTime', () => {
    it('returns a valid ISO string', async () => {
      const time = await getCurrentTime();
      expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('getCurrentWeather', () => {
    it('returns weather object with required fields', async () => {
      const weather = await getCurrentWeather();
      expect(weather).toHaveProperty('desc');
      expect(weather).toHaveProperty('temp');
      expect(typeof weather.desc).toBe('string');
      expect(typeof weather.temp).toBe('number');
    });
  });
}); 