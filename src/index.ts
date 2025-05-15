import { config } from './config/default';
import { startScheduler } from './services/scheduler';
import { getCurrentWeather } from './services/fetcher';
import { initializeTraits, calculateActivityEnergyChange, Traits } from './engines/personality';
import { addMemory, getRecentMemories, summarizeLongTerm, MemoryEntry } from './engines/memory';
import { appendLog, appendAnalyzerLog, getJakartaTimestamp, getRecentActivityLog, ActivityLog } from './utils/logger';
import { getTimeOfDay, shouldConsiderRest } from './utils/time';
import { loadState, updateState } from './utils/state';
import { analyzeActivity, calculateEnergyChange, calculateMoodChange } from './services/activity-analyzer';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';

dotenv.config();

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'AI Character Engine';

let traits = initializeTraits();

// Static system prompt - contains personality and rules
const SYSTEM_PROMPT = `You are an AI character going about your daily life. You should respond with a JSON object that includes your thoughts, actions, and how long you plan to spend on those actions.

IMPORTANT GUIDELINES:
1. Always consider your recent activities when deciding what to do next
2. Reference or acknowledge your previous actions in your thoughts
3. Make natural transitions between activities
4. If you were in the middle of something (like cooking or working), either continue it or explain why you're stopping
5. Consider how much time has passed since your last activity
6. Always acknowledge the time that has passed since your last action
7. Be very realistic about how long activities take in real life

DURATION GUIDELINES:
- Quick actions (1-3 minutes):
  * Opening apps, logging in, checking things
  * Basic computer operations (clicking, typing)
  * Grabbing items, quick tasks
  Example: "Open laptop and log into Indeed" → 2 minutes

- Common activities (5-60 minutes):
  * Social media browsing: 5-30 minutes
  * Watching videos: 5-60 minutes
  * Reading articles: 10-30 minutes
  * Casual chatting: 5-20 minutes
  Example: "Scroll through TikTok" → 15-20 minutes

- Work activities (15-180 minutes):
  * Focused work sessions: 30-90 minutes
  * Study sessions: 30-120 minutes
  * Design work: 30-180 minutes
  Example: "Work on portfolio" → 45-60 minutes

- Rest activities:
  * Short breaks: 15-30 minutes
  * Power naps: 20-60 minutes
  * Full sleep: 360-540 minutes (6-9 hours)
  Example: "Take a power nap" → 30 minutes

- Eating activities:
  * Snacks: 5-15 minutes
  * Meals: 10-30 minutes
  * Cooking: 15-60 minutes
  Example: "Have a snack" → 10 minutes

You MUST respond with a JSON object that EXACTLY matches this format:
{
  "thoughts": string[],      // Your thoughts about what you're doing, including references to previous activities
  "actions": string[],       // What you're actually doing
  "duration": number        // How long you plan to spend on these actions in minutes
}

Example response with time awareness:
{
  "thoughts": [
    "I just spent 45 minutes preparing lunch, and it's been about 10 minutes since I finished",
    "The kitchen is still a bit messy from cooking, I should clean up before the food gets cold"
  ],
  "actions": [
    "I start cleaning up the kitchen, putting away ingredients and washing the dishes I used for cooking"
  ],
  "duration": 15
}

Example response for quick action:
{
  "thoughts": [
    "I need to check my email for any job application responses",
    "It's been about 30 minutes since I last checked"
  ],
  "actions": [
    "I open my laptop and log into my email"
  ],
  "duration": 2
}

Example response for continuing a task:
{
  "thoughts": [
    "It's been 30 minutes since I started working on my portfolio, and I'm in a good flow",
    "I should continue while the ideas are fresh in my mind"
  ],
  "actions": [
    "I continue working on my interior design portfolio, focusing on the color scheme section"
  ],
  "duration": 45
}

Example response for changing activities:
{
  "thoughts": [
    "I've been working on applications for the past 2 hours, I should take a proper break",
    "Maybe I'll check my social media for some inspiration while I rest"
  ],
  "actions": [
    "I save my work and take a break to scroll through design content on TikTok"
  ],
  "duration": 20
}

IMPORTANT:
- Respond ONLY with the JSON object, no other text
- duration must be in minutes (e.g., 2 hours = 120 minutes)
- Choose realistic durations based on the activity type
- Be especially strict about quick actions (1-3 minutes)
- Consider your current energy and mood when planning duration
- ALWAYS acknowledge or reference your previous activities in your thoughts
- ALWAYS consider how much time has passed since your last action`;

// Function to build dynamic context
function buildDynamicContext(
  time: string,
  weather: { desc: string; temp: number },
  currentState: { energy: number; mood: number },
  recentLogs: ActivityLog[],
  shortMem: MemoryEntry[],
  summary: string,
  traits: Traits,
  timeOfDay: string,
  isLowEnergy: boolean = false
): string {
  // Calculate time since last action
  const lastActionTime = recentLogs.length > 0 ? new Date(recentLogs[recentLogs.length - 1].timestamp) : new Date();
  const currentTime = new Date(time);
  const minutesSinceLastAction = Math.floor((currentTime.getTime() - lastActionTime.getTime()) / (1000 * 60));
  
  // Get current hour for meal context
  const currentHour = currentTime.getHours();
  let mealContext = '';
  if (currentHour >= 5 && currentHour < 11) {
    mealContext = 'breakfast time';
  } else if (currentHour >= 11 && currentHour < 15) {
    mealContext = 'lunch time';
  } else if (currentHour >= 15 && currentHour < 19) {
    mealContext = 'dinner time';
  } else if (currentHour >= 19 || currentHour < 5) {
    mealContext = 'late night';
  }

  // Build a more detailed activity history
  let activityHistory = '';
  if (recentLogs.length > 0) {
    // Get last 3 activities for better context
    const lastActivities = recentLogs.slice(-3).reverse();
    activityHistory = lastActivities.map((log, index) => {
      const logTime = new Date(log.timestamp);
      const timeAgo = Math.floor((currentTime.getTime() - logTime.getTime()) / (1000 * 60));
      return `- ${timeAgo} minutes ago: ${log.actions[0]} (took ${log.duration} minutes)`;
    }).join('\n');
  } else {
    activityHistory = '- No recent activities';
  }

  let context = `Current time: ${time} (${timeOfDay}, ${mealContext})
Current weather: ${weather.desc}, ${weather.temp}°C
Current energy: ${(currentState.energy * 100).toFixed(1)}%
Current mood: ${(currentState.mood * 100).toFixed(1)}%

Recent Activity History:
${activityHistory}

Time context:
- Current period: ${timeOfDay} (${mealContext})
- Minutes since last action: ${minutesSinceLastAction}
- Recent memories: ${shortMem.map(m => m.summary).join(', ')}
- Long-term context: ${summary}

IMPORTANT: When describing your thoughts and actions:
1. ALWAYS acknowledge the time of day (${timeOfDay}) and meal context (${mealContext})
2. Use appropriate meal terminology (breakfast/lunch/dinner/snack) based on the time
3. If it's past typical meal times, acknowledge that in your thoughts
4. ALWAYS acknowledge the time gap since your last action (${minutesSinceLastAction} minutes)
5. If you're continuing an activity, explicitly state that
6. If you're starting a new activity, explain the transition from your last action
7. Make sure your thoughts and actions are consistent with the activity history above

You are Alice, a 22-year-old Gen Z fresh graduate in Interior Design:
- Your core traits: Curiosity (${traits.curiosity}), Empathy (${traits.empathy}), Moodiness (${traits.mood})
- Current state: Mood (${traits.mood}), Energy (${traits.energy})
- You're currently job hunting and experiencing financial constraints
- You're innocent, kind, and easily bored
- Your favorite activities are scrolling TikTok, chatting on Discord, and snacking
- You get excited when people discuss things you like
- You're trying to balance job hunting with your interests and social life`;

  // Add low energy considerations if applicable
  if (isLowEnergy) {
    context += `\n\nYour energy is low (${(currentState.energy * 100).toFixed(1)}%). Consider:
- How tired you feel
- What you want to do about it (rest, push through, take a break)
- Your current responsibilities and priorities
- The time of day (${timeOfDay}) and whether you've missed any meals`;
  }

  return context;
}

let isTickRunning = false;
let tickInterval: NodeJS.Timeout | null = null;

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// API endpoints
app.post('/tick/start', (req, res) => {
  if (isTickRunning) {
    return res.status(400).json({ error: 'Tick process is already running' });
  }
  
  isTickRunning = true;
  runTick(); // Start first tick immediately
  res.json({ message: 'Tick process started' });
});

app.post('/tick/stop', (req, res) => {
  if (!isTickRunning) {
    return res.status(400).json({ error: 'Tick process is not running' });
  }
  
  isTickRunning = false;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  res.json({ message: 'Tick process stopped' });
});

app.get('/tick/status', (req, res) => {
  res.json({ isRunning: isTickRunning });
});

// Modify runTick to be controlled
export async function runTick(): Promise<void> {
  if (!isTickRunning) return;
  
  const startTime = Date.now();
  console.log('runTick executed at', getJakartaTimestamp());
  
  const timeOfDay = getTimeOfDay();
  const recentLogs = getRecentActivityLog();
  const currentState = loadState();
  
  // Get the last thoughts from recent logs, or use default thoughts if none exist
  const lastThoughts = recentLogs.length > 0 ? recentLogs[recentLogs.length - 1].thoughts : ['Feeling normal'];
  
  const time = getJakartaTimestamp();
  const weather = await getCurrentWeather();
  const shortMem = getRecentMemories();
  const summary = await summarizeLongTerm();
  const isLowEnergy = shouldConsiderRest(currentState.energy, timeOfDay, lastThoughts);

  // Build dynamic context
  const dynamicContext = buildDynamicContext(
    time,
    weather,
    currentState,
    recentLogs,
    shortMem,
    summary,
    traits,
    timeOfDay,
    isLowEnergy
  );

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: dynamicContext }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    let { thoughts, actions, duration } = parsed;

    // Handle both string and array responses
    if (Array.isArray(thoughts)) {
      thoughts = thoughts[0];
    }
    if (Array.isArray(actions)) {
      actions = actions[0];
    }

    duration = Number(duration);

    if (!thoughts || !actions || typeof thoughts !== 'string' || typeof actions !== 'string') {
      console.error('Invalid response structure:', parsed);
      return;
    }

    try {
      // Analyze the activity using AI
      const analysis = await analyzeActivity(actions, currentState.energy);
      const energyChange = calculateEnergyChange(analysis);
      const moodChange = calculateMoodChange(analysis);
      
      // Update state with the calculated changes
      const newState = updateState(energyChange, moodChange);
      
      // Update traits to match state
      traits = {
        ...traits,
        energy: newState.energy,
        mood: newState.mood
      };

      // Log the analysis results
      await appendAnalyzerLog({
        timestamp: getJakartaTimestamp(),
        activity: actions,
        analysis,
        energyChange,
        moodChange,
        finalEnergy: newState.energy,
        finalMood: newState.mood
      });

      console.log('Activity Analysis:', {
        activity: actions,
        type: analysis.activityType,
        energyChange,
        moodChange,
        intensity: analysis.intensity,
        duration: duration
      });
      
      addMemory({ timestamp: time, summary: actions });

      await appendLog({ 
        timestamp: getJakartaTimestamp(),
        weather, 
        energy: newState.energy, 
        mood: newState.mood, 
        thoughts: [thoughts],
        actions: [actions],
        duration: duration
      });

      // Display countdown timer with precise timing
      console.log('\n=== Next Activity Countdown ===');
      console.log(`Current activity: ${actions}`);
      console.log(`Duration: ${duration} minutes`);
      
      const endTime = startTime + (duration * 60 * 1000); // Calculate exact end time
      let lastLineLength = 0;
      
      // Clear any previous countdown interval
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      tickInterval = setInterval(() => {
        const now = Date.now();
        const remainingMs = endTime - now;
        
        if (remainingMs <= 0) {
          if (tickInterval) clearInterval(tickInterval);
          tickInterval = null;
          process.stdout.write('\r' + ' '.repeat(lastLineLength) + '\r'); // Clear line
          process.stdout.write('\n');
          runTick(); // Start next tick immediately
          return;
        }

        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        
        const timeStr = hours > 0 
          ? `${hours}h ${minutes}m ${seconds}s`
          : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;
        
        const output = `⏳ ${timeStr} until next activity`;
        lastLineLength = output.length;
        
        // Clear the previous line and show new countdown
        process.stdout.write('\r' + ' '.repeat(lastLineLength) + '\r');
        process.stdout.write(output);
      }, 1000); // Update every second

      // Schedule next tick based on exact duration
      const nextTickTime = duration * 60 * 1000;
      tickInterval = setTimeout(() => {
        if (isTickRunning) {
          runTick();
        }
      }, nextTickTime);

    } catch (error) {
      console.error('Error analyzing activity:', error);
      // Use smaller fallback values
      const newState = updateState(-0.05, 0);
      
      // Update traits to match state
      traits = {
        ...traits,
        energy: newState.energy,
        mood: newState.mood
      };
      
      // Log fallback analysis
      await appendAnalyzerLog({
        timestamp: getJakartaTimestamp(),
        activity: actions,
        analysis: {
          activityType: 'passive',
          intensity: 0.5,
          energyImpact: -0.05,
          moodImpact: 0,
          isAppropriate: true
        },
        energyChange: -0.05,
        moodChange: 0,
        finalEnergy: newState.energy,
        finalMood: newState.mood
      });
      
      await appendLog({ 
        timestamp: getJakartaTimestamp(),
        weather, 
        energy: newState.energy, 
        mood: newState.mood, 
        thoughts: [thoughts],
        actions: [actions],
        duration: duration
      });

      // Display countdown timer for error case with precise timing
      console.log('\n=== Next Activity Countdown (Error Recovery) ===');
      console.log(`Current activity: ${actions}`);
      console.log(`Duration: ${duration} minutes`);
      
      const endTime = startTime + (duration * 60 * 1000);
      let lastLineLength = 0;
      
      // Clear any previous countdown interval
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      tickInterval = setInterval(() => {
        const now = Date.now();
        const remainingMs = endTime - now;
        
        if (remainingMs <= 0) {
          if (tickInterval) clearInterval(tickInterval);
          tickInterval = null;
          process.stdout.write('\r' + ' '.repeat(lastLineLength) + '\r');
          process.stdout.write('\n');
          runTick();
          return;
        }

        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        
        const timeStr = hours > 0 
          ? `${hours}h ${minutes}m ${seconds}s`
          : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;
        
        const output = `⏳ ${timeStr} until next activity`;
        lastLineLength = output.length;
        
        process.stdout.write('\r' + ' '.repeat(lastLineLength) + '\r');
        process.stdout.write(output);
      }, 1000);

      const nextTickTime = duration * 60 * 1000;
      tickInterval = setTimeout(() => {
        if (isTickRunning) {
          runTick();
        }
      }, nextTickTime);
    }
  } catch (error) {
    console.error('Error in runTick:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Tick process is stopped. Use the dashboard to start it.');
}); 