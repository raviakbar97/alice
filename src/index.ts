import { config } from './config/default';
import { startScheduler } from './services/scheduler';
import { getCurrentTime, getCurrentWeather } from './services/fetcher';
import { initializeTraits, updateMood, updateEnergy, mapTraitsToHyperparams } from './engines/personality';
import { addMemory, getRecentMemories, summarizeLongTerm } from './engines/memory';
import { appendLog } from './utils/logger';
import OpenRouter from 'openrouter';

let traits = initializeTraits();

export async function runTick(): Promise<void> {
  if (traits.energy < config.energyThreshold) {
    traits = updateEnergy(traits, -config.moodDrift * 2);
    await appendLog({
      timestamp: new Date().toISOString(),
      weather: { desc: '', temp: 0 },
      energy: traits.energy,
      mood: traits.mood,
      thoughts: 'Resting',
      actions: 'sleep'
    });
    return;
  }
  const time = await getCurrentTime();
  const weather = await getCurrentWeather();
  traits = updateMood(traits);
  const shortMem = getRecentMemories();
  const summary = await summarizeLongTerm();
  const hyper = mapTraitsToHyperparams(traits);

  const messages = [
    { role: 'system', content: `You are Selena… Mood: ${traits.mood}, Energy: ${traits.energy}` },
    { role: 'system', content: `Summary: ${summary}` },
    { role: 'user', content: `Time: ${time}\nWeather: ${weather.desc}, ${weather.temp}°C\nMemories: ${JSON.stringify(shortMem)}` },
    { role: 'user', content: 'Describe your next thoughts and actions in JSON with keys thoughts and actions.' }
  ];

  const client = new OpenRouter({ apiKey: config.openRouterApiKey });
  const resp = await client.complete({ model: 'gpt-4o-mini', messages, ...hyper, response_format: { type: 'json_object' } });
  const { thoughts, actions } = resp.choices[0].message as any;

  traits = updateEnergy(traits, 0.1);
  addMemory({ timestamp: time, summary: actions });

  await appendLog({ timestamp: time, weather, energy: traits.energy, mood: traits.mood, thoughts, actions });
}

startScheduler(); 