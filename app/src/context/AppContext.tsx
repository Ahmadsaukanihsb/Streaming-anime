import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Anime } from '@/data/animeData';
import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders, saveAuthToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { COMMUNITY_ROLES, getRoleConfig } from '@/config/roles';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AppContext');

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  communityRole?: string;
  createdAt?: string;
}

export interface WatchHistory {
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  timestamp: number;
  progress: number;
}

export interface Rating {
  animeId: string;
  rating: number;
  ratedAt?: Date;
}

export type NotificationType =
  | 'like_discussion'
  | 'like_reply'
  | 'reply'
  | 'mention'
  | 'new_episode'
  | 'system'
  | 'anime'
  | 'episode';

export interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  discussionId?: string;
  discussionTitle?: string;
  replyId?: string;
  animeId?: string;
  animeTitle?: string;
  animePoster?: string;
  episodeNumber?: number;
  fromUserName?: string;
  // Backward-compat alias
  title?: string;
}

export interface UserSettings {
  autoPlayNext: boolean;
  autoSkipIntro: boolean;
  defaultQuality: '480' | '720' | '1080' | 'auto';
  notifyNewEpisode: boolean;
  notifyNewAnime: boolean;
}

interface BadgeConfig {
  name: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

interface AppContextType {
  // User
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (file: File) => Promise<{ success: boolean; avatarUrl?: string; error?: string }>;
  isLoading: boolean;

  // Anime Data
  animeList: Anime[];
  addAnime: (anime: Omit<Anime, 'id' | 'views'>) => void;
  updateAnime: (id: string, updates: Partial<Anime>) => void;
  deleteAnime: (id: string) => void;

  // Bookmarks & Watchlist
  bookmarks: string[];
  toggleBookmark: (animeId: string) => void;
  watchlist: string[];
  toggleWatchlist: (animeId: string) => void;

  // Watch History
  watchHistory: WatchHistory[];
  updateWatchProgress: (animeId: string, episodeId: string, episodeNumber: number, progress: number) => void;
  getLastWatched: (animeId: string) => WatchHistory | undefined;

  // Ratings (Database-backed)
  ratings: Rating[];
  rateAnime: (animeId: string, rating: number) => Promise<void>;
  getUserRating: (animeId: string) => number;
  deleteRating: (animeId: string) => Promise<void>;

  // Watched Episodes (Database-backed)
  watchedEpisodes: { animeId: string; episodes: number[] }[];
  toggleEpisodeWatched: (animeId: string, episodeNumber: number) => Promise<void>;
  getWatchedEpisodes: (animeId: string) => number[];

  // Subscriptions/Notifications (Database-backed)
  subscribedAnime: string[];
  toggleSubscription: (animeId: string) => Promise<void>;
  notifications: Notification[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  unreadNotificationCount: number;

  // User Settings (Database-backed)
  userSettings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  deleteWatchHistory: () => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Anime[];

  // Filters
  selectedGenres: string[];
  toggleGenre: (genre: string) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  selectedStatus: 'all' | 'Ongoing' | 'Completed';
  setSelectedStatus: (status: 'all' | 'Ongoing' | 'Completed') => void;

  // UI
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  // Badges / Roles
  getBadgeConfig: (role: string) => BadgeConfig;
  refreshBadges: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Storage helper for mobile compatibility
  const getStoredUser = (): User | null => {
    try {
      // Try localStorage first
      let savedUser = localStorage.getItem('user');
      // Fallback to sessionStorage for private browsing
      if (!savedUser) {
        savedUser = sessionStorage.getItem('user');
      }
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return {
          id: parsed._id || parsed.id,
          name: parsed.name,
          email: parsed.email,
          avatar: parsed.avatar,
          isAdmin: parsed.isAdmin || false,
          createdAt: parsed.createdAt,
        } as User;
      }
    } catch (e) {
      logger.error('[AppContext] Error reading stored user:', e);
    }
    return null;
  };

  const saveUser = (userData: User | null) => {
    try {
      if (userData) {
        const jsonData = JSON.stringify(userData);
        localStorage.setItem('user', jsonData);
        sessionStorage.setItem('user', jsonData); // Also save to session for mobile
      } else {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    } catch (e) {
      logger.error('[AppContext] Error saving user:', e);
      // Try sessionStorage as fallback
      try {
        if (userData) {
          sessionStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (e2) {
        logger.error('[AppContext] SessionStorage fallback also failed:', e2);
      }
    }
  };

  // User State
  const [user, setUser] = useState<User | null>(getStoredUser);



  // Anime Data State
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data from Database Only
  useEffect(() => {
    const fetchAnime = async () => {
      try {
        // Fetch Backend Data (Custom & Deleted)
        const customPromise = apiFetch(`${BACKEND_URL}/api/anime/custom`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);

        const deletedPromise = apiFetch(`${BACKEND_URL}/api/anime/deleted`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);

        const [customAnimes, deletedIds] = await Promise.all([
          customPromise,
          deletedPromise
        ]);

        // Filter out deleted anime
        const filteredAnime = (customAnimes as Anime[]).filter((a: Anime) => !deletedIds.includes(a.id));

        setAnimeList(filteredAnime);
      } catch (error) {
        logger.error('Failed to fetch anime:', error);
        setAnimeList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnime();
  }, []);

  // Bookmarks & Watchlist
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Watch History
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);

  // NEW: Ratings (Database-backed)
  const [ratings, setRatings] = useState<Rating[]>([]);

  // NEW: Watched Episodes (Database-backed)
  const [watchedEpisodes, setWatchedEpisodes] = useState<{ animeId: string; episodes: number[] }[]>([]);

  // NEW: Subscriptions (Database-backed)
  const [subscribedAnime, setSubscribedAnime] = useState<string[]>([]);

  // NEW: Notifications (Database-backed)
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // NEW: User Settings (Database-backed)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    autoPlayNext: true,
    autoSkipIntro: false,
    defaultQuality: '1080',
    notifyNewEpisode: true,
    notifyNewAnime: true,
  });

  // Badge config map (roleId -> config)
  const [badgeMap, setBadgeMap] = useState<Record<string, BadgeConfig>>({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = animeList.filter(anime =>
    anime.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filters
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Ongoing' | 'Completed'>('all');

  // UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const refreshBadges = useCallback(async () => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/badges`, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const nextMap: Record<string, BadgeConfig> = {};
        for (const badge of data) {
          if (!badge?.roleId) continue;
          nextMap[String(badge.roleId).toLowerCase()] = {
            name: badge.name || badge.roleId,
            icon: badge.icon || 'Award',
            bgColor: badge.bgColor || 'bg-gray-500/20',
            textColor: badge.textColor || 'text-gray-400'
          };
        }
        setBadgeMap(nextMap);
      }
    } catch (err) {
      logger.warn('[AppContext] Failed to fetch badges');
    }
  }, []);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  // Auth Functions
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Login failed');

      const data = await res.json();
      if (data.token) {
        saveAuthToken(data.token);
      }

      // Map backend response to User interface
      const mappedUser: User = {
        id: data._id || data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        isAdmin: data.isAdmin || false,
        createdAt: data.createdAt,
      };

      setUser(mappedUser);
      saveUser(mappedUser);

      // Fetch user data after login
      fetchUserData(data._id || data.id);
      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) throw new Error('Registration failed');

      const data = await res.json();
      if (data.token) {
        saveAuthToken(data.token);
      }
      const mappedUser: User = {
        id: data._id || data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        isAdmin: data.isAdmin || false,
        createdAt: data.createdAt,
      };
      setUser(mappedUser);
      saveUser(mappedUser);
      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    apiFetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => undefined);
    setUser(null);
    saveUser(null);
    saveAuthToken(null);
    setBookmarks([]);
    setWatchlist([]);
    setWatchHistory([]);
    // Clear new database-backed states
    setRatings([]);
    setWatchedEpisodes([]);
    setSubscribedAnime([]);
    setNotifications([]);
    setUserSettings({
      autoPlayNext: true,
      autoSkipIntro: false,
      defaultQuality: '1080',
      notifyNewEpisode: true,
      notifyNewAnime: true,
    });
  }, []);

  const updateProfile = useCallback(async (name: string, email: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const res = await apiFetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Update failed' };
      }

      // Update local user state
      const updatedUser: User = {
        ...user,
        name: data.user.name,
        email: data.user.email,
      };
      setUser(updatedUser);
      saveUser(updatedUser);

      return { success: true };
    } catch (err) {
      logger.error('Update profile error:', err);
      return { success: false, error: 'Network error' };
    }
  }, [user]);

  const updateAvatar = useCallback(async (file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', user.id);

      const res = await apiFetch(`${BACKEND_URL}/api/user/avatar`, {
        method: 'PUT',
        headers: { ...getAuthHeaders() },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Upload failed' };
      }

      // Update local user state
      const updatedUser: User = {
        ...user,
        avatar: data.avatarUrl,
      };
      setUser(updatedUser);
      saveUser(updatedUser);

      return { success: true, avatarUrl: data.avatarUrl };
    } catch (err) {
      logger.error('Update avatar error:', err);
      return { success: false, error: 'Network error' };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/notifications?limit=50`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.notifications || []).map((n: any) => ({
          ...n,
          isRead: n.isRead ?? n.read ?? false,
          message: n.message || n.title || 'Notifikasi'
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      logger.error('Failed to fetch notifications', err);
    }
  };

  // Sync Data
  const fetchUserData = async (userId: string) => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/user/${userId}`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
        setWatchlist(data.watchlist || []);
        setWatchHistory(data.watchHistory || []);
        // Sync new database-backed data
        setRatings(data.ratings || []);
        setWatchedEpisodes(data.watchedEpisodes || []);
        setSubscribedAnime(data.subscribedAnime || []);
        if (data.settings) {
          setUserSettings(prev => ({ ...prev, ...data.settings }));
        }
        await fetchNotifications();
      }
    } catch (err) {
      logger.error('Failed to sync user data', err);
    }
  };

  // Sync on load if user exists
  useEffect(() => {
    const userId = user?.id;
    if (userId) {
      fetchUserData(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Anime Management Functions
  const addAnime = useCallback(async (newAnimeData: Partial<Pick<Anime, 'id'>> & Omit<Anime, 'id' | 'views'>) => {
    try {
      const newAnime = {
        ...newAnimeData,
        id: newAnimeData.id || Date.now().toString(),
        views: 0,
      };

      await apiFetch(`${BACKEND_URL}/api/anime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newAnime),
      });

      setAnimeList(prev => [newAnime as Anime, ...prev]);
    } catch (err) {
      logger.error('Failed to add anime', err);
    }
  }, []);

  const updateAnime = useCallback(async (id: string, updates: Partial<Anime>) => {
    // Optimistic UI Update
    setAnimeList(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    try {
      await apiFetch(`${BACKEND_URL}/api/anime/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      logger.error('Failed to update anime', err);
      // Optional: Revert state here if critical
    }
  }, []);

  const deleteAnime = useCallback(async (id: string) => {
    try {
      await apiFetch(`${BACKEND_URL}/api/anime/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });

      setAnimeList(prev => prev.filter(a => a.id !== id));
      // Deleted anime is already tracked in database via DeletedAnime model
    } catch (err) {
      logger.error('Failed to delete anime', err);
    }
  }, []);

  // Bookmark Functions
  const toggleBookmark = useCallback(async (animeId: string) => {
    if (!user) return; // Must be logged in

    // Optimistic Update
    setBookmarks(prev =>
      prev.includes(animeId) ? prev.filter(id => id !== animeId) : [...prev, animeId]
    );

    try {
      await apiFetch(`${BACKEND_URL}/api/user/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, animeId }),
      });
    } catch (err) {
      logger.error('Sync failed', err);
      // Revert if failed (omitted for brevity)
    }
  }, [user]);

  // Watchlist Functions
  const toggleWatchlist = useCallback(async (animeId: string) => {
    if (!user) return;

    // Optimistic Update
    setWatchlist(prev =>
      prev.includes(animeId) ? prev.filter(id => id !== animeId) : [...prev, animeId]
    );

    // Sync to backend
    try {
      await apiFetch(`${BACKEND_URL}/api/user/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, animeId }),
      });
    } catch (err) {
      logger.error('Watchlist sync failed', err);
    }
  }, [user]);

  // Watch History Functions
  const updateWatchProgress = useCallback(async (
    animeId: string,
    episodeId: string,
    episodeNumber: number,
    progress: number
  ) => {
    setWatchHistory(prev => {
      const existing = prev.find(h => h.animeId === animeId && h.episodeId === episodeId);
      if (existing) {
        return prev.map(h => h.animeId === animeId && h.episodeId === episodeId ? { ...h, progress, timestamp: Date.now() } : h);
      }
      return [...prev, { animeId, episodeId, episodeNumber, progress, timestamp: Date.now() }];
    });

    if (user) {
      // Debounce logic should be here ideally, but for now direct call
      try {
        await apiFetch(`${BACKEND_URL}/api/user/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ userId: user.id, animeId, episodeId, episodeNumber, progress }),
        });
      } catch (err) { logger.error(err); }
    }
  }, [user]);

  const getLastWatched = useCallback((animeId: string) => {
    return watchHistory
      .filter(h => h.animeId === animeId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [watchHistory]);

  // Filter Functions
  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }, []);

  // ==================== NEW DATABASE-BACKED FUNCTIONS ====================

  // Ratings Functions
  const rateAnime = useCallback(async (animeId: string, rating: number) => {
    if (!user) return;

    // Optimistic update
    setRatings(prev => {
      const filtered = prev.filter(r => r.animeId !== animeId);
      if (rating > 0) {
        return [...filtered, { animeId, rating, ratedAt: new Date() }];
      }
      return filtered;
    });

    try {
      await apiFetch(`${BACKEND_URL}/api/user/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, animeId, rating }),
      });
    } catch (err) {
      logger.error('Failed to save rating', err);
    }
  }, [user]);

  const getUserRating = useCallback((animeId: string): number => {
    const found = ratings.find(r => r.animeId === animeId);
    return found?.rating || 0;
  }, [ratings]);

  const deleteRating = useCallback(async (animeId: string) => {
    if (!user) return;
    setRatings(prev => prev.filter(r => r.animeId !== animeId));
    try {
      await apiFetch(`${BACKEND_URL}/api/user/rating/${user.id}/${animeId}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
    } catch (err) {
      logger.error('Failed to delete rating', err);
    }
  }, [user]);

  // Watched Episodes Functions
  const toggleEpisodeWatched = useCallback(async (animeId: string, episodeNumber: number) => {
    if (!user) return;

    // Optimistic update
    setWatchedEpisodes(prev => {
      const animeEntry = prev.find(w => w.animeId === animeId);
      if (animeEntry) {
        const hasEp = animeEntry.episodes.includes(episodeNumber);
        return prev.map(w =>
          w.animeId === animeId
            ? { ...w, episodes: hasEp ? w.episodes.filter(e => e !== episodeNumber) : [...w.episodes, episodeNumber] }
            : w
        );
      }
      return [...prev, { animeId, episodes: [episodeNumber] }];
    });

    try {
      await apiFetch(`${BACKEND_URL}/api/user/watched-episode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, animeId, episodeNumber }),
      });
    } catch (err) {
      logger.error('Failed to toggle watched episode', err);
    }
  }, [user]);

  const getWatchedEpisodes = useCallback((animeId: string): number[] => {
    const found = watchedEpisodes.find(w => w.animeId === animeId);
    return found?.episodes || [];
  }, [watchedEpisodes]);

  // Subscription Functions
  const toggleSubscription = useCallback(async (animeId: string) => {
    if (!user) return;

    setSubscribedAnime(prev =>
      prev.includes(animeId) ? prev.filter(id => id !== animeId) : [...prev, animeId]
    );

    try {
      await apiFetch(`${BACKEND_URL}/api/user/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, animeId }),
      });
    } catch (err) {
      logger.error('Failed to toggle subscription', err);
    }
  }, [user]);

  // Notification Functions
  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );

    try {
      await apiFetch(`${BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
    } catch (err) {
      logger.error('Failed to mark notification read', err);
    }
  }, [user]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await apiFetch(`${BACKEND_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
    } catch (err) {
      logger.error('Failed to mark all notifications read', err);
    }
  }, [user]);

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // Settings Functions
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    setUserSettings(prev => ({ ...prev, ...newSettings }));

    try {
      await apiFetch(`${BACKEND_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, settings: newSettings }),
      });
    } catch (err) {
      logger.error('Failed to update settings', err);
    }
  }, [user]);

  const deleteWatchHistory = useCallback(async () => {
    if (!user) return;

    setWatchHistory([]);

    try {
      await apiFetch(`${BACKEND_URL}/api/user/history/${user.id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
    } catch (err) {
      logger.error('Failed to delete history', err);
    }
  }, [user]);

  const getBadgeConfig = useCallback((role: string): BadgeConfig => {
    const normalized = (role || '').toLowerCase().trim();
    if (normalized && badgeMap[normalized]) {
      return badgeMap[normalized];
    }

    if (normalized && Object.prototype.hasOwnProperty.call(COMMUNITY_ROLES, normalized)) {
      return getRoleConfig(normalized);
    }

    const displayName = normalized
      ? normalized.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Member';

    return {
      name: displayName,
      icon: 'Award',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-400'
    };
  }, [badgeMap]);

  return (
    <AppContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateProfile,
      updateAvatar,
      animeList,
      isLoading,
      addAnime,
      updateAnime,
      deleteAnime,
      bookmarks,
      toggleBookmark,
      watchlist,
      toggleWatchlist,
      watchHistory,
      updateWatchProgress,
      getLastWatched,
      // NEW: Database-backed
      ratings,
      rateAnime,
      getUserRating,
      deleteRating,
      watchedEpisodes,
      toggleEpisodeWatched,
      getWatchedEpisodes,
      subscribedAnime,
      toggleSubscription,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      unreadNotificationCount,
      userSettings,
      updateSettings,
      deleteWatchHistory,
      // Search & Filters
      searchQuery,
      setSearchQuery,
      searchResults,
      selectedGenres,
      toggleGenre,
      selectedYear,
      setSelectedYear,
      selectedStatus,
      setSelectedStatus,
      isSidebarOpen,
      setIsSidebarOpen,
      getBadgeConfig,
      refreshBadges,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
