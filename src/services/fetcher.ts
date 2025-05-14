import axios from 'axios';
import { Weather } from '../types';
import { config } from '../config/default';

export async function getCurrentTime(): Promise<string> {
  return new Date().toISOString();
}

export async function getCurrentWeather(): Promise<Weather> {
  try {
    const resp = await axios.get(
      `https://${config.rapidApiHost}/fivedaysforcast`, {
        params: {
          latitude: -6.183234852638808,
          longitude: 106.63616429949393,
          lang: 'EN'
        },
        headers: {
          'x-rapidapi-key': config.rapidApiKey,
          'x-rapidapi-host': config.rapidApiHost
        }
      }
    );
    const now = resp.data.list?.[0];
    return { desc: now.weather[0].description, temp: now.main.temp };
  } catch (err) {
    console.error('RapidAPI weather error:', err);
    throw err;
  }
} 