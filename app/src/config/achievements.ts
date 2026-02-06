// Achievement System Configuration
// Track user watching activity and award badges

// Achievement System Configuration

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'special';
export type AchievementCategory = 'watcher' | 'rater' | 'streak' | 'social' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  tier: AchievementTier;
  category: AchievementCategory;
  requirement: number; // Target value to unlock
  unit: string; // 'episodes', 'hours', 'days', 'anime', etc.
  hidden?: boolean; // Secret achievement
}

export const ACHIEVEMENTS: Achievement[] = [
  // === WATCHER TIER ===
  {
    id: 'watcher_bronze',
    name: 'Pemula',
    description: 'Tonton 50 episode anime',
    icon: 'Play',
    tier: 'bronze',
    category: 'watcher',
    requirement: 50,
    unit: 'episodes',
  },
  {
    id: 'watcher_silver',
    name: 'Otaku Pemula',
    description: 'Tonton 200 episode anime',
    icon: 'Tv',
    tier: 'silver',
    category: 'watcher',
    requirement: 200,
    unit: 'episodes',
  },
  {
    id: 'watcher_gold',
    name: 'Otaku Sejati',
    description: 'Tonton 500 episode anime',
    icon: 'MonitorPlay',
    tier: 'gold',
    category: 'watcher',
    requirement: 500,
    unit: 'episodes',
  },
  {
    id: 'watcher_platinum',
    name: 'Legenda Nonton',
    description: 'Tonton 1000 episode anime',
    icon: 'Crown',
    tier: 'platinum',
    category: 'watcher',
    requirement: 1000,
    unit: 'episodes',
  },

  // === TIME TIER ===
  {
    id: 'time_bronze',
    name: 'Maraton Kecil',
    description: 'Habiskan 24 jam menonton',
    icon: 'Clock',
    tier: 'bronze',
    category: 'watcher',
    requirement: 24,
    unit: 'hours',
  },
  {
    id: 'time_silver',
    name: 'Maraton Besar',
    description: 'Habiskan 100 jam menonton',
    icon: 'Timer',
    tier: 'silver',
    category: 'watcher',
    requirement: 100,
    unit: 'hours',
  },
  {
    id: 'time_gold',
    name: 'Manusia Nonton',
    description: 'Habiskan 500 jam menonton',
    icon: 'Hourglass',
    tier: 'gold',
    category: 'watcher',
    requirement: 500,
    unit: 'hours',
  },
  {
    id: 'time_platinum',
    name: 'Dimensi Lain',
    description: 'Habiskan 1000 jam menonton',
    icon: 'Infinity',
    tier: 'platinum',
    category: 'watcher',
    requirement: 1000,
    unit: 'hours',
  },

  // === COMPLETION TIER ===
  {
    id: 'completion_bronze',
    name: 'Penamat',
    description: 'Selesaikan 5 anime',
    icon: 'CheckCircle',
    tier: 'bronze',
    category: 'watcher',
    requirement: 5,
    unit: 'anime',
  },
  {
    id: 'completion_silver',
    name: 'Completionist',
    description: 'Selesaikan 20 anime',
    icon: 'ListChecks',
    tier: 'silver',
    category: 'watcher',
    requirement: 20,
    unit: 'anime',
  },
  {
    id: 'completion_gold',
    name: 'Master Completionist',
    description: 'Selesaikan 50 anime',
    icon: 'Award',
    tier: 'gold',
    category: 'watcher',
    requirement: 50,
    unit: 'anime',
  },
  {
    id: 'completion_platinum',
    name: 'Dewa Anime',
    description: 'Selesaikan 100 anime',
    icon: 'Trophy',
    tier: 'platinum',
    category: 'watcher',
    requirement: 100,
    unit: 'anime',
  },

  // === RATER TIER ===
  {
    id: 'rater_bronze',
    name: 'Kritikus Pemula',
    description: 'Beri rating 10 anime',
    icon: 'Star',
    tier: 'bronze',
    category: 'rater',
    requirement: 10,
    unit: 'ratings',
  },
  {
    id: 'rater_silver',
    name: 'Kritikus',
    description: 'Beri rating 30 anime',
    icon: 'ThumbsUp',
    tier: 'silver',
    category: 'rater',
    requirement: 30,
    unit: 'ratings',
  },
  {
    id: 'rater_gold',
    name: 'Kritikus Senior',
    description: 'Beri rating 60 anime',
    icon: 'MessageSquare',
    tier: 'gold',
    category: 'rater',
    requirement: 60,
    unit: 'ratings',
  },
  {
    id: 'rater_platinum',
    name: 'Kritikus Legendaris',
    description: 'Beri rating 100 anime',
    icon: 'ScrollText',
    tier: 'platinum',
    category: 'rater',
    requirement: 100,
    unit: 'ratings',
  },

  // === STREAK TIER ===
  {
    id: 'streak_3',
    name: 'On Fire!',
    description: 'Nonton 3 hari berturut-turut',
    icon: 'Flame',
    tier: 'bronze',
    category: 'streak',
    requirement: 3,
    unit: 'days',
  },
  {
    id: 'streak_7',
    name: 'Streak Master',
    description: 'Nonton 7 hari berturut-turut',
    icon: 'Zap',
    tier: 'silver',
    category: 'streak',
    requirement: 7,
    unit: 'days',
  },
  {
    id: 'streak_14',
    name: 'Unstoppable',
    description: 'Nonton 14 hari berturut-turut',
    icon: 'TrendingUp',
    tier: 'gold',
    category: 'streak',
    requirement: 14,
    unit: 'days',
  },
  {
    id: 'streak_30',
    name: 'Addicted',
    description: 'Nonton 30 hari berturut-turut',
    icon: 'Sparkles',
    tier: 'platinum',
    category: 'streak',
    requirement: 30,
    unit: 'days',
  },

  // === SOCIAL TIER ===
  {
    id: 'bookmarks_10',
    name: 'Kolektor',
    description: 'Simpan 10 anime ke bookmark',
    icon: 'Bookmark',
    tier: 'bronze',
    category: 'social',
    requirement: 10,
    unit: 'bookmarks',
  },
  {
    id: 'bookmarks_50',
    name: 'Hoarder',
    description: 'Simpan 50 anime ke bookmark',
    icon: 'Library',
    tier: 'silver',
    category: 'social',
    requirement: 50,
    unit: 'bookmarks',
  },
  {
    id: 'watchlist_10',
    name: 'Planner',
    description: 'Tambah 10 anime ke watchlist',
    icon: 'ListVideo',
    tier: 'bronze',
    category: 'social',
    requirement: 10,
    unit: 'watchlist',
  },

  // === SPECIAL TIER ===
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Nonton 50 episode di jam 22:00 - 04:00',
    icon: 'Moon',
    tier: 'special',
    category: 'special',
    requirement: 50,
    unit: 'episodes',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Nonton 50 episode di jam 04:00 - 08:00',
    icon: 'Sun',
    tier: 'special',
    category: 'special',
    requirement: 50,
    unit: 'episodes',
  },
  {
    id: 'binge_watcher',
    name: 'Binge Watcher',
    description: 'Tonton 12+ episode dalam 1 hari',
    icon: 'Popcorn',
    tier: 'special',
    category: 'special',
    requirement: 12,
    unit: 'episodes_day',
  },
  {
    id: 'perfect_score',
    name: 'Perfect Taste',
    description: 'Beri rating 10/10 sebanyak 10 kali',
    icon: 'Heart',
    tier: 'special',
    category: 'special',
    requirement: 10,
    unit: 'perfect_ratings',
  },
  {
    id: 'genre_master',
    name: 'Genre Explorer',
    description: 'Tonton anime dari 10 genre berbeda',
    icon: 'Compass',
    tier: 'special',
    category: 'special',
    requirement: 10,
    unit: 'genres',
  },
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Selesaikan anime pertama Anda',
    icon: 'Footprints',
    tier: 'bronze',
    category: 'special',
    requirement: 1,
    unit: 'anime',
  },
];

// Tier styling configuration
export const TIER_STYLES: Record<AchievementTier, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  label: string;
}> = {
  bronze: {
    bgColor: 'bg-amber-700/20',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-600/30',
    glowColor: 'shadow-amber-600/20',
    label: 'Bronze',
  },
  silver: {
    bgColor: 'bg-slate-400/20',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-400/30',
    glowColor: 'shadow-slate-400/20',
    label: 'Silver',
  },
  gold: {
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-400/30',
    glowColor: 'shadow-yellow-400/30',
    label: 'Gold',
  },
  platinum: {
    bgColor: 'bg-cyan-400/20',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-400/30',
    glowColor: 'shadow-cyan-400/40',
    label: 'Platinum',
  },
  special: {
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    glowColor: 'shadow-purple-400/30',
    label: 'Special',
  },
};

// Category icons mapping
export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  watcher: 'Tv',
  rater: 'Star',
  streak: 'Flame',
  social: 'Users',
  special: 'Sparkles',
};

// Calculate progress percentage
export const getAchievementProgress = (
  achievement: Achievement,
  currentValue: number
): number => {
  return Math.min(100, Math.round((currentValue / achievement.requirement) * 100));
};

// Check if achievement is unlocked
export const isAchievementUnlocked = (
  achievement: Achievement,
  currentValue: number
): boolean => {
  return currentValue >= achievement.requirement;
};

// Get next tier achievement
export const getNextTierAchievement = (
  category: AchievementCategory,
  currentTier: AchievementTier
): Achievement | undefined => {
  const tierOrder: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) return undefined;
  
  const nextTier = tierOrder[currentIndex + 1];
  return ACHIEVEMENTS.find(
    a => a.category === category && a.tier === nextTier
  );
};

// Get unlocked achievements
export const getUnlockedAchievements = (
  achievements: Achievement[],
  stats: Record<string, number>
): Achievement[] => {
  return achievements.filter(a => {
    const value = stats[a.category] || 0;
    return isAchievementUnlocked(a, value);
  });
};

// Calculate total achievement points
export const calculateAchievementPoints = (
  unlockedAchievements: Achievement[]
): number => {
  const tierPoints: Record<AchievementTier, number> = {
    bronze: 10,
    silver: 25,
    gold: 50,
    platinum: 100,
    special: 75,
  };
  
  return unlockedAchievements.reduce((total, a) => total + tierPoints[a.tier], 0);
};
