import { useMemo, useCallback } from 'react';
import {
  ACHIEVEMENTS,
  TIER_STYLES,
  isAchievementUnlocked,
  getAchievementProgress,
  calculateAchievementPoints,
  type Achievement,
  type AchievementCategory,
  type AchievementTier,
} from '@/config/achievements';
import type { WatchHistory, Rating } from '@/context/AppContext';
import type { Anime } from '@/data/animeData';

export interface UserStats {
  totalEpisodes: number;
  totalHours: number;
  completedAnime: number;
  ratingsCount: number;
  bookmarksCount: number;
  watchlistCount: number;
  currentStreak: number;
  longestStreak: number;
  nightOwlEpisodes: number;
  earlyBirdEpisodes: number;
  maxEpisodesInDay: number;
  perfectRatings: number;
  uniqueGenres: number;
}

export interface AchievementWithProgress extends Achievement {
  progress: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export function useAchievements(
  watchHistory: WatchHistory[],
  ratings: Rating[],
  bookmarks: string[],
  watchlist: string[],
  animeList: Anime[]
) {
  // Calculate user statistics
  const stats = useMemo((): UserStats => {
    // Total episodes watched
    const totalEpisodes = watchHistory.length;
    
    // Total hours (avg 24 min per episode)
    const totalHours = Math.round((totalEpisodes * 24) / 60);
    
    // Count episodes per day for streak calculation
    const episodesByDay = new Map<string, number>();
    const episodesByHour = new Map<number, number>();
    
    watchHistory.forEach(h => {
      const date = new Date(h.timestamp);
      const dayKey = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      episodesByDay.set(dayKey, (episodesByDay.get(dayKey) || 0) + 1);
      episodesByHour.set(hour, (episodesByHour.get(hour) || 0) + 1);
    });
    
    // Calculate max episodes in a single day
    const maxEpisodesInDay = Math.max(...Array.from(episodesByDay.values()), 0);
    
    // Night owl: 22:00 - 04:00
    let nightOwlEpisodes = 0;
    for (let h = 22; h <= 23; h++) nightOwlEpisodes += episodesByHour.get(h) || 0;
    for (let h = 0; h <= 4; h++) nightOwlEpisodes += episodesByHour.get(h) || 0;
    
    // Early bird: 04:00 - 08:00
    let earlyBirdEpisodes = 0;
    for (let h = 4; h <= 8; h++) earlyBirdEpisodes += episodesByHour.get(h) || 0;
    
    // Calculate streak
    const sortedDays = Array.from(episodesByDay.keys()).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if streak is active (watched today or yesterday)
    const hasWatchedRecently = sortedDays.includes(today) || sortedDays.includes(yesterday);
    
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDays[i - 1]);
        const currDate = new Date(sortedDays[i]);
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Current streak (only if watched today or yesterday)
    if (hasWatchedRecently) {
      // Count backwards from today
      currentStreak = 0;
      const checkDate = new Date();
      while (true) {
        const dateKey = checkDate.toISOString().split('T')[0];
        if (episodesByDay.has(dateKey)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Check if it's yesterday and we haven't found any gap
          const yesterdayCheck = new Date();
          yesterdayCheck.setDate(yesterdayCheck.getDate() - 1);
          if (dateKey === yesterdayCheck.toISOString().split('T')[0] && currentStreak > 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
    }
    
    // Count unique genres
    const watchedAnimeIds = new Set(watchHistory.map(h => h.animeId));
    const genresSet = new Set<string>();
    watchedAnimeIds.forEach(id => {
      const anime = animeList.find(a => a.id === id);
      if (anime?.genres) {
        anime.genres.forEach((g: string) => genresSet.add(g.toLowerCase()));
      }
    });
    
    // Count completed anime (watched all episodes)
    const animeEpisodeCount = new Map<string, Set<number>>();
    watchHistory.forEach(h => {
      if (!animeEpisodeCount.has(h.animeId)) {
        animeEpisodeCount.set(h.animeId, new Set());
      }
      animeEpisodeCount.get(h.animeId)!.add(h.episodeNumber);
    });
    
    let completedAnime = 0;
    animeEpisodeCount.forEach((episodes, animeId) => {
      const anime = animeList.find(a => a.id === animeId);
      if (anime && episodes.size >= anime.episodes) {
        completedAnime++;
      }
    });
    
    // Perfect ratings (10/10)
    const perfectRatings = ratings.filter(r => r.rating === 10).length;
    
    return {
      totalEpisodes,
      totalHours,
      completedAnime,
      ratingsCount: ratings.length,
      bookmarksCount: bookmarks.length,
      watchlistCount: watchlist.length,
      currentStreak,
      longestStreak,
      nightOwlEpisodes,
      earlyBirdEpisodes,
      maxEpisodesInDay,
      perfectRatings,
      uniqueGenres: genresSet.size,
    };
  }, [watchHistory, ratings, bookmarks, watchlist, animeList]);

  // Get stat value by category/unit
  const getStatValue = useCallback((achievement: Achievement): number => {
    switch (achievement.id) {
      // Watcher achievements
      case 'watcher_bronze':
      case 'watcher_silver':
      case 'watcher_gold':
      case 'watcher_platinum':
        return stats.totalEpisodes;
      
      // Time achievements
      case 'time_bronze':
      case 'time_silver':
      case 'time_gold':
      case 'time_platinum':
        return stats.totalHours;
      
      // Completion achievements
      case 'completion_bronze':
      case 'completion_silver':
      case 'completion_gold':
      case 'completion_platinum':
      case 'first_step':
        return stats.completedAnime;
      
      // Rater achievements
      case 'rater_bronze':
      case 'rater_silver':
      case 'rater_gold':
      case 'rater_platinum':
        return stats.ratingsCount;
      
      // Streak achievements
      case 'streak_3':
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
        return stats.longestStreak;
      
      // Bookmark achievements
      case 'bookmarks_10':
      case 'bookmarks_50':
        return stats.bookmarksCount;
      
      // Watchlist achievements
      case 'watchlist_10':
        return stats.watchlistCount;
      
      // Special achievements
      case 'night_owl':
        return stats.nightOwlEpisodes;
      case 'early_bird':
        return stats.earlyBirdEpisodes;
      case 'binge_watcher':
        return stats.maxEpisodesInDay;
      case 'perfect_score':
        return stats.perfectRatings;
      case 'genre_master':
        return stats.uniqueGenres;
      
      default:
        return 0;
    }
  }, [stats]);

  // Get all achievements with progress
  const achievementsWithProgress = useMemo((): AchievementWithProgress[] => {
    return ACHIEVEMENTS.map(achievement => {
      const currentValue = getStatValue(achievement);
      return {
        ...achievement,
        currentValue,
        progress: getAchievementProgress(achievement, currentValue),
        unlocked: isAchievementUnlocked(achievement, currentValue),
      };
    });
  }, [getStatValue]);

  // Get unlocked achievements
  const unlockedAchievements = useMemo(() => {
    return achievementsWithProgress.filter(a => a.unlocked);
  }, [achievementsWithProgress]);

  // Get locked achievements
  const lockedAchievements = useMemo(() => {
    return achievementsWithProgress.filter(a => !a.unlocked);
  }, [achievementsWithProgress]);

  // Get recent achievements (last 5 unlocked)
  const recentAchievements = useMemo(() => {
    return unlockedAchievements.slice(-5);
  }, [unlockedAchievements]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: AchievementCategory) => {
    return achievementsWithProgress.filter(a => a.category === category);
  }, [achievementsWithProgress]);

  // Get achievements by tier
  const getAchievementsByTier = useCallback((tier: AchievementTier) => {
    return achievementsWithProgress.filter(a => a.tier === tier);
  }, [achievementsWithProgress]);

  // Calculate total points
  const totalPoints = useMemo(() => {
    return calculateAchievementPoints(unlockedAchievements);
  }, [unlockedAchievements]);

  // Get next closest achievement to unlock
  const nextAchievement = useMemo(() => {
    return lockedAchievements
      .filter(a => a.progress > 0)
      .sort((a, b) => b.progress - a.progress)[0];
  }, [lockedAchievements]);

  // Get completion percentage
  const completionPercentage = useMemo(() => {
    return Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100);
  }, [unlockedAchievements.length]);

  return {
    stats,
    achievements: achievementsWithProgress,
    unlockedAchievements,
    lockedAchievements,
    recentAchievements,
    totalPoints,
    completionPercentage,
    nextAchievement,
    getAchievementsByCategory,
    getAchievementsByTier,
    TIER_STYLES,
  };
}

export default useAchievements;
