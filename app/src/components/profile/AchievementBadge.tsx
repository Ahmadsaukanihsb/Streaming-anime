import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Play,
  Tv,
  MonitorPlay,
  Crown,
  Clock,
  Timer,
  Hourglass,
  Infinity,
  CheckCircle,
  ListChecks,
  Award,
  Trophy,
  Star,
  ThumbsUp,
  MessageSquare,
  ScrollText,
  Flame,
  Zap,
  TrendingUp,
  Sparkles,
  Bookmark,
  Library,
  ListVideo,
  Moon,
  Sun,
  Popcorn,
  Heart,
  Compass,
  Footprints,
  Users,
  Lock,
} from 'lucide-react';
import { TIER_STYLES, type Achievement, type AchievementTier } from '@/config/achievements';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Play,
  Tv,
  MonitorPlay,
  Crown,
  Clock,
  Timer,
  Hourglass,
  Infinity,
  CheckCircle,
  ListChecks,
  Award,
  Trophy,
  Star,
  ThumbsUp,
  MessageSquare,
  ScrollText,
  Flame,
  Zap,
  TrendingUp,
  Sparkles,
  Bookmark,
  Library,
  ListVideo,
  Moon,
  Sun,
  Popcorn,
  Heart,
  Compass,
  Footprints,
  Users,
  Lock,
};

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  animate?: boolean;
}

export function AchievementBadge({
  achievement,
  unlocked = true,
  progress = 100,
  size = 'md',
  showProgress = false,
  animate = true,
}: AchievementBadgeProps) {
  const tierStyle = TIER_STYLES[achievement.tier];
  const Icon = iconMap[achievement.icon] || Star;

  const sizeClasses = {
    sm: {
      container: 'w-10 h-10',
      icon: 'w-4 h-4',
      text: 'text-[8px]',
      padding: 'p-1.5',
    },
    md: {
      container: 'w-14 h-14',
      icon: 'w-6 h-6',
      text: 'text-[10px]',
      padding: 'p-2',
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-8 h-8',
      text: 'text-xs',
      padding: 'p-3',
    },
  };

  const classes = sizeClasses[size];

  if (!unlocked) {
    return (
      <div
        className={`${classes.container} rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden`}
        title={`${achievement.name} - Terkunci`}
      >
        <Lock className={`${classes.icon} text-white/20`} />
        {showProgress && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-white/30 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  const content = (
    <div
      className={`
        ${classes.container} ${classes.padding} rounded-xl
        ${tierStyle.bgColor} ${tierStyle.borderColor}
        border flex flex-col items-center justify-center relative overflow-hidden
        ${unlocked ? `shadow-lg ${tierStyle.glowColor}` : ''}
        transition-all duration-300 hover:scale-110
      `}
      title={`${achievement.name} - ${achievement.description}`}
    >
      {/* Background glow effect */}
      <div className={`absolute inset-0 ${tierStyle.bgColor} opacity-50 blur-md`} />
      
      {/* Icon */}
      <Icon className={`${classes.icon} ${tierStyle.textColor} relative z-10`} />
      
      {/* Progress bar for in-progress achievements */}
      {showProgress && progress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className={`h-full ${tierStyle.textColor.replace('text-', 'bg-')} rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  if (animate && unlocked) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Achievement Card Component (for detailed view)
interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  currentValue: number;
}

export function AchievementCard({
  achievement,
  unlocked,
  progress,
  currentValue,
}: AchievementCardProps) {
  const tierStyle = TIER_STYLES[achievement.tier];

  return (
    <div
      className={`
        relative p-4 rounded-xl border transition-all duration-300
        ${unlocked 
          ? `${tierStyle.bgColor} ${tierStyle.borderColor} border` 
          : 'bg-white/5 border-white/10'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Badge Icon */}
        <AchievementBadge
          achievement={achievement}
          unlocked={unlocked}
          progress={progress}
          size="md"
          animate={false}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${unlocked ? 'text-white' : 'text-white/50'}`}>
              {achievement.name}
            </h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tierStyle.bgColor} ${tierStyle.textColor}`}>
              {tierStyle.label}
            </span>
          </div>
          
          <p className={`text-sm ${unlocked ? 'text-white/70' : 'text-white/40'}`}>
            {achievement.description}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={unlocked ? 'text-white/50' : 'text-white/30'}>
                Progress
              </span>
              <span className={unlocked ? tierStyle.textColor : 'text-white/30'}>
                {unlocked 
                  ? 'Terkunci!' 
                  : `${currentValue} / ${achievement.requirement} ${achievement.unit}`
                }
              </span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`h-full rounded-full ${
                  unlocked 
                    ? tierStyle.textColor.replace('text-', 'bg-') 
                    : 'bg-white/20'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shine effect for unlocked */}
      {unlocked && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
        </div>
      )}
    </div>
  );
}

// Achievement Progress Ring
interface AchievementProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function AchievementProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  children,
}: AchievementProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6C5DD3"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Tier Badge Component
interface TierBadgeProps {
  tier: AchievementTier;
  count: number;
}

export function TierBadge({ tier, count }: TierBadgeProps) {
  const style = TIER_STYLES[tier];
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.bgColor} border ${style.borderColor}`}>
      <div className={`w-2 h-2 rounded-full ${style.textColor.replace('text-', 'bg-')}`} />
      <span className={`text-sm font-medium ${style.textColor}`}>
        {style.label}
      </span>
      <span className="text-white/50 text-sm">{count}</span>
    </div>
  );
}

export default AchievementBadge;
