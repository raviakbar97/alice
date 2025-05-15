import https from 'https';
import { config } from '../config/default';
import { getJakartaTimestamp } from '../utils/logger';

interface Weather {
  desc: string;
  temp: number;
}

export async function getCurrentTime(): Promise<string> {
  return getJakartaTimestamp();
}

export async function getCurrentWeather(): Promise<Weather> {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: 'api.weatherapi.com',
      path: `/v1/current.json?key=${config.weatherApiKey}&q=${encodeURIComponent(config.weatherLocation)}&aqi=no`,
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks);
          const data = JSON.parse(body.toString());
          
          if (!data.current) {
            throw new Error('No current weather data available');
          }

          resolve({
            desc: data.current.condition.text.toLowerCase(),
            temp: data.current.temp_c // Temperature in Celsius
          });
        } catch (error) {
          console.error('Error parsing weather data:', error);
          // Fallback to default weather if API fails
          resolve({
            desc: 'clear sky',
            temp: 20
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error fetching weather:', error);
      // Fallback to default weather if API fails
      resolve({
        desc: 'clear sky',
        temp: 20
      });
    });

    req.end();
  });
} 