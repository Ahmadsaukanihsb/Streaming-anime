import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Users, Star, Lock, Filter } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge, AchievementCard, TierBadge } from './AchievementBadge';
import { type AchievementCategory, type AchievementTier } from '@/config/achievements';
import type { WatchHistory, Rating } from '@/context/AppContext';
import type { Anime } from '@/data/animeData';

interface AchievementsTabProps {
  watchHistory: WatchHistory[];
  ratings: Rating[];
  bookmarks: string[];
  watchlist: string[];
  animeList: Anime[];
}

const categoryLabels: Record<AchievementCategory, string> = {
  watcher: 'Penonton',
  rater: 'Pemberi Rating',
  streak: 'Streak',
  social: 'Sosial',
  special: 'Spesial',
};

const categoryIcons: Record<AchievementCategory, typeof Trophy> = {
  watcher: Trophy,
  rater: Star,
  streak: Zap,
  social: Users,
  special: Target,
};

export default function AchievementsTab({
  watchHistory,
  ratings,
  bookmarks,
  watchlist,
  animeList,
}: AchievementsTabProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');

  const {
    stats,
    achievements,
    unlockedAchievements,
    totalPoints,
    completionPercentage,
    nextAchievement,
    getAchievementsByCategory,
  } = useAchievements(watchHistory, ratings, bookmarks, watchlist, animeList);

  // Filter achievements
  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  }).filter(a => {
    if (categoryFilter === 'all') return true;
    return a.category === categoryFilter;
  });

  // Count by tier
  const tierCounts = {
    bronze: unlockedAchievements.filter(a => a.tier === 'bronze').length,
    silver: unlockedAchievements.filter(a => a.tier === 'silver').length,
    gold: unlockedAchievements.filter(a => a.tier === 'gold').length,
    platinum: unlockedAchievements.filter(a => a.tier === 'platinum').length,
    special: unlockedAchievements.filter(a => a.tier === 'special').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#6C5DD3]/20 to-[#6C5DD3]/5 rounded-xl p-4 border border-[#6C5DD3]/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-[#6C5DD3]" />
            <span className="text-white/60 text-sm">Total Poin</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalPoints}</p>
        </motion.div>

        {/* Completion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-white/60 text-sm">Selesai</span>
          </div>
          <p className="text-3xl font-bold text-white">{completionPercentage}%</p>
          <p className="text-white/40 text-xs mt-1">
            {unlockedAchievements.length} / {achievements.length}
          </p>
        </motion.div>

        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-white/60 text-sm">Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
          <p className="text-white/40 text-xs mt-1">hari berturut-turut</p>
        </motion.div>

        {/* Episodes Watched */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            <span className="text-white/60 text-sm">Episode</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalEpisodes}</p>
          <p className="text-white/40 text-xs mt-1">{stats.totalHours} jam</p>
        </motion.div>
      </div>

      {/* Tier Progress */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-4">Progress Tier</h3>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(tierCounts) as AchievementTier[]).map((tier) => (
            <TierBadge key={tier} tier={tier} count={tierCounts[tier]} />
          ))}
        </div>
      </div>

      {/* Next Achievement */}
      {nextAchievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#6C5DD3]/10 to-transparent rounded-xl p-4 border border-[#6C5DD3]/20"
        >
          <div className="flex items-center gap-4">
            <AchievementBadge
              achievement={nextAchievement}
              unlocked={false}
              progress={nextAchievement.progress}
              size="lg"
            />
            <div className="flex-1">
              <p className="text-white/60 text-sm">Achievement Berikutnya</p>
              <h4 className="text-white font-semibold">{nextAchievement.name}</h4>
              <p className="text-white/50 text-sm">{nextAchievement.description}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/40">Progress</span>
                  <span className="text-[#6C5DD3]">{nextAchievement.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nextAchievement.progress}%` }}
                    className="h-full bg-[#6C5DD3] rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === f
                  ? 'bg-[#6C5DD3] text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {f === 'all' && 'Semua'}
              {f === 'unlocked' && 'Terkunci'}
              {f === 'locked' && 'Belum'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AchievementCategory | 'all')}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="all">Semua Kategori</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Sections */}
      {categoryFilter === 'all' ? (
        // Show all categories grouped
        (['watcher', 'rater', 'streak', 'social', 'special'] as AchievementCategory[]).map(
          (category, catIndex) => {
            const categoryAchievements = getAchievementsByCategory(category);
            const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;
            const Icon = categoryIcons[category];

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#6C5DD3]" />
                    <h3 className="text-white font-semibold">{categoryLabels[category]}</h3>
                    <span className="text-white/40 text-sm">
                      {unlockedCount}/{categoryAchievements.length}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      unlocked={achievement.unlocked}
                      progress={achievement.progress}
                      currentValue={achievement.currentValue}
                    />
                  ))}
                </div>
              </motion.div>
            );
          }
        )
      ) : (
        // Show filtered category
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={achievement.unlocked}
              progress={achievement.progress}
              currentValue={achievement.currentValue}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Tidak Ada Achievement</h3>
          <p className="text-white/50">Mulai menonton untuk membuka achievement!</p>
        </div>
      )}
    </div>
  );
}
