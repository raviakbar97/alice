import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { config } from '../config/default';
import { ActivityAnalysis } from '../types';

dotenv.config();

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'AI Character Engine';

export async function analyzeActivity(activity: string, currentEnergy: number): Promise<ActivityAnalysis> {
  const prompt = `You are an activity analyzer that determines the type, intensity, and impact of activities.
Your task is to analyze activities and provide realistic assessments based on the given guidelines.

Activity to analyze: "${activity}"
Current energy level: ${(currentEnergy * 100).toFixed(1)}%

Respond with a JSON object that EXACTLY matches this format:
{
  "activityType": "work" | "rest" | "eating" | "social" | "passive",
  "intensity": number,      // 0.1 to 1.0
  "energyImpact": number,   // -0.1 to 0.1
  "moodImpact": number,     // -0.1 to 0.1
  "isAppropriate": boolean  // whether this activity makes sense for current energy level
}

Activity Type Guidelines:
- "work": Activities requiring focus and effort (studying, designing, coding, etc.)
- "rest": Activities for recovery (sleeping, napping, relaxing)
- "eating": Activities involving food (meals, snacks, cooking)
- "social": Activities involving interaction (chatting, calling, messaging)
- "passive": Activities requiring minimal effort (scrolling, watching, reading)

Energy Level Guidelines:
- High energy (>0.8): Appropriate for intense activities, exercise, work
- Medium energy (0.4-0.8): Appropriate for moderate activities, social, passive
- Low energy (<0.4): Appropriate for rest, eating, passive activities

Intensity Guidelines:
- 0.1-0.3: Very light activities (scrolling, watching, basic tasks)
- 0.4-0.6: Moderate activities (chatting, reading, casual work)
- 0.7-0.9: Intense activities (focused work, exercise, complex tasks)
- 1.0: Maximum intensity (high-stress situations, emergencies)

Impact Guidelines:
- energyImpact: How much the activity affects energy (-0.1 to 0.1)
  * Positive: Resting, eating, enjoyable activities
  * Negative: Work, exercise, stressful activities
  * Consider both physical and mental energy
  * Example: "Work on portfolio" might be -0.05 (mentally draining)
  * Example: "Take a nap" might be +0.08 (physically restorative)

- moodImpact: How much the activity affects mood (-0.1 to 0.1)
  * Positive: Social activities, hobbies, achievements
  * Negative: Boring tasks, conflicts, failures
  * Consider both immediate and long-term effects
  * Example: "Chat with friends" might be +0.06 (social connection)
  * Example: "Job rejection" might be -0.08 (disappointment)

Example Analysis for "Open laptop and log into Indeed":
{
  "activityType": "work",
  "intensity": 0.2,
  "energyImpact": -0.02,
  "moodImpact": -0.01,
  "isAppropriate": true
}

Example Analysis for "Work on portfolio design":
{
  "activityType": "work",
  "intensity": 0.8,
  "energyImpact": -0.05,
  "moodImpact": 0.03,
  "isAppropriate": true
}

Example Analysis for "Take a power nap" (at high energy):
{
  "activityType": "rest",
  "intensity": 0.1,
  "energyImpact": 0.08,
  "moodImpact": 0.02,
  "isAppropriate": false
}

Example Analysis for "Scroll through TikTok":
{
  "activityType": "passive",
  "intensity": 0.2,
  "energyImpact": -0.03,
  "moodImpact": 0.04,
  "isAppropriate": true
}

Example Analysis for "Chat with friends on Discord":
{
  "activityType": "social",
  "intensity": 0.4,
  "energyImpact": -0.04,
  "moodImpact": 0.06,
  "isAppropriate": true
}

Remember to:
1. Consider the current energy level for appropriateness
2. Provide balanced impact values that make sense for the activity
3. Use the most specific activity type that matches the action
4. Consider both physical and mental aspects of energy impact
5. Consider both immediate and long-term effects on mood`;

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
          { role: 'system', content: prompt },
          { role: 'user', content: 'Analyze this activity' }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content) as ActivityAnalysis;
  } catch (error) {
    console.error('Error analyzing activity:', error);
    // Return a default analysis for error cases
    return {
      activityType: 'passive',
      intensity: 0.1,
      energyImpact: -0.02,
      moodImpact: 0,
      isAppropriate: true
    };
  }
}

export function calculateEnergyChange(analysis: ActivityAnalysis): number {
  // Base energy change from the analysis
  let energyChange = analysis.energyImpact;

  // Adjust based on intensity
  energyChange *= (1 + analysis.intensity);

  // If the activity is inappropriate for current energy, make it more draining
  if (!analysis.isAppropriate) {
    energyChange *= 1.5;
  }

  return energyChange;
}

export function calculateMoodChange(analysis: ActivityAnalysis): number {
  // Base mood change from the analysis
  let moodChange = analysis.moodImpact;

  // Adjust based on intensity and appropriateness
  if (analysis.isAppropriate) {
    // Appropriate activities have a positive multiplier
    moodChange *= (1 + analysis.intensity * 0.5);
  } else {
    // Inappropriate activities have a negative multiplier
    moodChange *= (1 - analysis.intensity * 0.5);
  }

  return moodChange;
} 