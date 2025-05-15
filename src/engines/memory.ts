export interface MemoryEntry {
  timestamp: string;
  summary: string;
}

const shortTerm: MemoryEntry[] = [];

export function addMemory(entry: MemoryEntry): void {
  shortTerm.push(entry);
  if (shortTerm.length > 60) shortTerm.shift();
}

export function getRecentMemories(): MemoryEntry[] {
  const now = Date.now();
  return shortTerm.filter(e => (now - Date.parse(e.timestamp)) / 60000 < 60);
}

export async function summarizeLongTerm(): Promise<string> {
  if (shortTerm.length === 0) {
    return 'No recent activities to summarize.';
  }

  // Get the last 5 activities for a concise summary
  const recentActivities = shortTerm.slice(-5);
  
  // Group activities by type
  const activityGroups = recentActivities.reduce((groups, entry) => {
    const activity = entry.summary.toLowerCase();
    let type = 'other';
    
    if (activity.includes('work') || activity.includes('job') || activity.includes('portfolio')) {
      type = 'work';
    } else if (activity.includes('rest') || activity.includes('sleep') || activity.includes('nap')) {
      type = 'rest';
    } else if (activity.includes('eat') || activity.includes('snack') || activity.includes('food')) {
      type = 'eating';
    } else if (activity.includes('chat') || activity.includes('discord') || activity.includes('social')) {
      type = 'social';
    } else if (activity.includes('tiktok') || activity.includes('scroll') || activity.includes('watch')) {
      type = 'passive';
    }
    
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(entry);
    return groups;
  }, {} as Record<string, MemoryEntry[]>);

  // Build summary
  const summaryParts = [];
  
  for (const [type, activities] of Object.entries(activityGroups)) {
    if (activities.length > 0) {
      const lastActivity = activities[activities.length - 1];
      const timeAgo = Math.floor((Date.now() - Date.parse(lastActivity.timestamp)) / (1000 * 60));
      summaryParts.push(`Recently ${type} activities: Last ${type} was ${timeAgo} minutes ago`);
    }
  }

  return summaryParts.join('. ') + '.';
} 