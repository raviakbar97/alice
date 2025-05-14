import axios from 'axios';
import { Weather } from '../types';
import { config } from '../config/default';

export async function getCurrentTime(): Promise<string> {
  return new Date().toISOString();
}

export async function getCurrentWeather(): Promise<Weather> {
  const resp = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=Jakarta&appid=${config.weatherApiKey}&units=metric`
  );
  return { desc: resp.data.weather[0].description, temp: resp.data.main.temp };
} 