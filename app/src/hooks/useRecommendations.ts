import { useMemo } from 'react';
import type { WatchHistory, Rating } from '@/context/AppContext';
import type { Anime } from '@/data/animeData';

export interface RecommendedAnime extends Anime {
  relevanceScore: number;
  reason: string;
  basedOnAnime?: string;
  matchPercentage?: number;
}

export interface GenrePreference {
  genre: string;
  count: number;
  avgRating: number;
  weight: number;
}

export function useRecommendations(
  animeList: Anime[],
  watchHistory: WatchHistory[],
  ratings: Rating[],
  bookmarks: string[],
  limit: number = 10
) {
  return useMemo((): {
    recommendations: RecommendedAnime[];
    genrePreferences: GenrePreference[];
    becauseYouWatched: { anime: Anime; recommendations: RecommendedAnime[] }[];
  } => {
    // Get watched anime IDs
    const watchedAnimeIds = new Set(watchHistory.map(h => h.animeId));
    const bookmarkedIds = new Set(bookmarks);

    // Calculate genre preferences based on watch history and ratings
    const genreStats = new Map<string, { count: number; totalRating: number; ratings: number[] }>();

    watchHistory.forEach(history => {
      const anime = animeList.find(a => a.id === history.animeId);
      if (!anime?.genres) return;

      // Get user's rating for this anime (if exists)
      const userRating = ratings.find(r => r.animeId === history.animeId)?.rating || 7; // Default to 7 if not rated

      anime.genres.forEach(genre => {
        const key = genre.toLowerCase();
        const existing = genreStats.get(key);
        if (existing) {
          existing.count++;
          existing.totalRating += userRating;
          existing.ratings.push(userRating);
        } else {
          genreStats.set(key, {
            count: 1,
            totalRating: userRating,
            ratings: [userRating]
          });
        }
      });
    });

    // Calculate genre preferences with weights
    const genrePreferences: GenrePreference[] = Array.from(genreStats.entries())
      .map(([genre, stats]) => ({
        genre,
        count: stats.count,
        avgRating: stats.totalRating / stats.count,
        weight: (stats.count * stats.totalRating) / stats.ratings.length // Weight by both count and rating
      }))
      .sort((a, b) => b.weight - a.weight);

    // Get top 3 genres for reason text
    const topGenres = genrePreferences.slice(0, 3).map(g => g.genre);

    // Calculate recommendations
    const scoredAnime = animeList
      .filter(anime => !watchedAnimeIds.has(anime.id) && !bookmarkedIds.has(anime.id)) // Exclude watched/bookmarked
      .map(anime => {
        let relevanceScore = 0;
        let matchedGenres: string[] = [];

        // Score based on genre matching
        if (anime.genres) {
          anime.genres.forEach(genre => {
            const genreKey = genre.toLowerCase();
            const preference = genrePreferences.find(p => p.genre === genreKey);
            if (preference) {
              relevanceScore += preference.weight;
              matchedGenres.push(genre);
            }
          });
        }

        // Boost by anime rating
        relevanceScore *= (anime.rating / 10) * 1.5;

        // Boost by status (completed anime might be more appealing)
        if (anime.status === 'Completed') {
          relevanceScore *= 1.2;
        }

        // Calculate match percentage
        const matchPercentage = anime.genres?.length 
          ? Math.round((matchedGenres.length / anime.genres.length) * 100)
          : 0;

        // Generate reason text
        let reason = '';
        if (matchedGenres.length > 0) {
          const mainGenre = matchedGenres[0];
          reason = `Karena Anda suka ${mainGenre}`;
        } else if (topGenres.length > 0) {
          reason = `Untuk fans ${topGenres[0]}`;
        } else {
          reason = 'Populer saat ini';
        }

        return {
          ...anime,
          relevanceScore,
          reason,
          matchPercentage
        };
      });

    // Sort by relevance and take top N
    const recommendations = scoredAnime
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Generate "Because you watched X" recommendations
    const becauseYouWatched: { anime: Anime; recommendations: RecommendedAnime[] }[] = [];

    // Get recently watched anime (last 5)
    const recentWatched = watchHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    recentWatched.forEach(history => {
      const sourceAnime = animeList.find(a => a.id === history.animeId);
      if (!sourceAnime?.genres) return;

      // Find similar anime to this one
      const similar = animeList
        .filter(a => 
          a.id !== sourceAnime.id && 
          !watchedAnimeIds.has(a.id) && 
          !bookmarkedIds.has(a.id)
        )
        .map(a => {
          let similarity = 0;
          const sourceGenres = sourceAnime.genres?.map(g => g.toLowerCase()) || [];
          const targetGenres = a.genres?.map(g => g.toLowerCase()) || [];

          // Count matching genres
          sourceGenres.forEach(genre => {
            if (targetGenres.includes(genre)) {
              similarity += 1;
            }
          });

          // Normalize by total unique genres
          const totalUniqueGenres = new Set([...sourceGenres, ...targetGenres]).size;
          const similarityPercentage = totalUniqueGenres > 0 
            ? (similarity / totalUniqueGenres) * 100 
            : 0;

          return {
            ...a,
            relevanceScore: similarity * (a.rating / 10),
            reason: `Mirip dengan ${sourceAnime.title}`,
            basedOnAnime: sourceAnime.title,
            matchPercentage: Math.round(similarityPercentage)
          };
        })
        .filter(a => a.matchPercentage && a.matchPercentage > 30) // At least 30% match
        .sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
        .slice(0, 4);

      if (similar.length > 0) {
        becauseYouWatched.push({
          anime: sourceAnime,
          recommendations: similar
        });
      }
    });

    return {
      recommendations,
      genrePreferences,
      becauseYouWatched
    };
  }, [animeList, watchHistory, ratings, bookmarks, limit]);
}

// Hook for getting trending/recommended anime when user has no history
export function useTrendingRecommendations(
  animeList: Anime[],
  limit: number = 10
) {
  return useMemo(() => {
    return animeList
      .filter(a => a.views && a.views > 1000)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit)
      .map(anime => ({
        ...anime,
        relevanceScore: (anime.views || 0) * (anime.rating / 10),
        reason: 'Sedang populer',
        matchPercentage: 0
      }));
  }, [animeList, limit]);
}

// Hook for getting personalized greeting based on watch patterns
export function useWatchInsights(
  watchHistory: WatchHistory[],
  ratings: Rating[]
) {
  return useMemo(() => {
    if (watchHistory.length === 0) {
      return {
        greeting: 'Selamat datang!',
        insight: 'Mulai petualangan anime Anda',
        streak: 0,
        avgEpisodesPerDay: 0
      };
    }

    // Calculate average episodes per day
    const uniqueDays = new Set(
      watchHistory.map(h => new Date(h.timestamp).toDateString())
    ).size;
    const avgEpisodesPerDay = watchHistory.length / Math.max(uniqueDays, 1);

    // Get most active time
    const hourCounts = new Array(24).fill(0);
    watchHistory.forEach(h => {
      const hour = new Date(h.timestamp).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    let timeLabel = '';
    if (peakHour >= 5 && peakHour < 12) timeLabel = 'pagi';
    else if (peakHour >= 12 && peakHour < 17) timeLabel = 'siang';
    else if (peakHour >= 17 && peakHour < 21) timeLabel = 'sore';
    else timeLabel = 'malam';

    // Generate greeting
    const currentHour = new Date().getHours();
    let greeting = 'Halo!';
    if (currentHour >= 5 && currentHour < 12) greeting = 'Selamat pagi!';
    else if (currentHour >= 12 && currentHour < 17) greeting = 'Selamat siang!';
    else if (currentHour >= 17 && currentHour < 21) greeting = 'Selamat sore!';
    else greeting = 'Selamat malam!';

    // Generate insight
    let insight = '';
    if (avgEpisodesPerDay >= 5) {
      insight = `Anda adalah marathoner! Rata-rata ${avgEpisodesPerDay.toFixed(1)} episode/hari`;
    } else if (avgEpisodesPerDay >= 2) {
      insight = `Penggemar setia! Biasanya nonton di waktu ${timeLabel}`;
    } else {
      insight = 'Nikmati setiap episode dengan santai';
    }

    return {
      greeting,
      insight,
      streak: 0, // Would need streak calculation from useAchievements
      avgEpisodesPerDay,
      peakHour,
      timeLabel
    };
  }, [watchHistory, ratings]);
}

export default useRecommendations;
