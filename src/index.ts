const fetch = require('node-fetch');
import { config } from './config/default';
import { startScheduler } from './services/scheduler';
import { getCurrentTime, getCurrentWeather } from './services/fetcher';
import { initializeTraits, updateMood, updateEnergy, mapTraitsToHyperparams } from './engines/personality';
import { addMemory, getRecentMemories, summarizeLongTerm } from './engines/memory';
import { appendLog } from './utils/logger';

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

  const promptText = [
    `You are Selena… Mood: ${traits.mood}, Energy: ${traits.energy}`,
    `Summary: ${summary}`,
    `Time: ${time}\nWeather: ${weather.desc}, ${weather.temp}°C\nMemories: ${JSON.stringify(shortMem)}`,
    'Describe your next thoughts and actions in JSON with keys thoughts and actions.'
  ].join('\n');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://topupin.site',
      'X-Title': 'Topupin Assistant',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: promptText,
        },
      ],
    }),
  });

  const data = await res.json();
  const { thoughts, actions } = JSON.parse(data.choices[0].message.content || '{}');

  traits = updateEnergy(traits, 0.1);
  addMemory({ timestamp: time, summary: actions });

  await appendLog({ timestamp: time, weather, energy: traits.energy, mood: traits.mood, thoughts, actions });
}

startScheduler(); 