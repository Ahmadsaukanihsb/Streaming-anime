import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Anime } from '@/data/animeData';
import { BACKEND_URL } from '../config/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  communityRole?: string;
  createdAt?: string;
}

interface WatchHistory {
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  timestamp: number;
  progress: number;
}

interface Rating {
  animeId: string;
  rating: number;
  ratedAt?: Date;
}

interface Notification {
  _id?: string;
  type: 'episode' | 'anime' | 'system';
  title: string;
  message?: string;
  animeId?: string;
  read: boolean;
  createdAt: Date;
}

interface UserSettings {
  autoPlayNext: boolean;
  autoSkipIntro: boolean;
  defaultQuality: '480' | '720' | '1080' | 'auto';
  notifyNewEpisode: boolean;
  notifyNewAnime: boolean;
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
      console.error('[AppContext] Error reading stored user:', e);
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
      console.error('[AppContext] Error saving user:', e);
      // Try sessionStorage as fallback
      try {
        if (userData) {
          sessionStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (e2) {
        console.error('[AppContext] SessionStorage fallback also failed:', e2);
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
        const customPromise = fetch(`${BACKEND_URL}/api/anime/custom`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);

        const deletedPromise = fetch(`${BACKEND_URL}/api/anime/deleted`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);

        const [customAnimes, deletedIds] = await Promise.all([
          customPromise,
          deletedPromise
        ]);

        console.log('[AppContext] Custom animes from DB:', customAnimes.length, customAnimes);
        console.log('[AppContext] Deleted IDs:', deletedIds);

        // Filter out deleted anime
        const filteredAnime = (customAnimes as Anime[]).filter(a => !deletedIds.includes(a.id));

        setAnimeList(filteredAnime);
      } catch (error) {
        console.error('Failed to fetch anime:', error);
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

  // Auth Functions
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Login failed');

      const data = await res.json();

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
      console.error(err);
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) throw new Error('Registration failed');

      const data = await res.json();
      setUser(data);
      saveUser(data);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
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
      const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Update profile error:', err);
      return { success: false, error: 'Network error' };
    }
  }, [user]);

  const updateAvatar = useCallback(async (file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', user.id);

      const res = await fetch(`${BACKEND_URL}/api/user/avatar`, {
        method: 'PUT',
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
      console.error('Update avatar error:', err);
      return { success: false, error: 'Network error' };
    }
  }, [user]);

  // Sync Data
  const fetchUserData = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
        setWatchlist(data.watchlist || []);
        setWatchHistory(data.watchHistory || []);
        // Sync new database-backed data
        setRatings(data.ratings || []);
        setWatchedEpisodes(data.watchedEpisodes || []);
        setSubscribedAnime(data.subscribedAnime || []);
        setNotifications(data.notifications || []);
        if (data.settings) {
          setUserSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (err) {
      console.error('Failed to sync user data', err);
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

      await fetch(`${BACKEND_URL}/api/anime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnime),
      });

      setAnimeList(prev => [newAnime as Anime, ...prev]);
    } catch (err) {
      console.error('Failed to add anime', err);
    }
  }, []);

  const updateAnime = useCallback(async (id: string, updates: Partial<Anime>) => {
    // Optimistic UI Update
    setAnimeList(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    try {
      await fetch(`${BACKEND_URL}/api/anime/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update anime', err);
      // Optional: Revert state here if critical
    }
  }, []);

  const deleteAnime = useCallback(async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/anime/${id}`, {
        method: 'DELETE',
      });

      setAnimeList(prev => prev.filter(a => a.id !== id));
      // Deleted anime is already tracked in database via DeletedAnime model
    } catch (err) {
      console.error('Failed to delete anime', err);
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
      await fetch(`${BACKEND_URL}/api/user/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, animeId }),
      });
    } catch (err) {
      console.error('Sync failed', err);
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
      await fetch(`${BACKEND_URL}/api/user/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, animeId }),
      });
    } catch (err) {
      console.error('Watchlist sync failed', err);
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
        await fetch(`${BACKEND_URL}/api/user/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, animeId, episodeId, episodeNumber, progress }),
        });
      } catch (err) { console.error(err); }
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
      await fetch(`${BACKEND_URL}/api/user/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, animeId, rating }),
      });
    } catch (err) {
      console.error('Failed to save rating', err);
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
      await fetch(`${BACKEND_URL}/api/user/rating/${user.id}/${animeId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete rating', err);
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
      await fetch(`${BACKEND_URL}/api/user/watched-episode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, animeId, episodeNumber }),
      });
    } catch (err) {
      console.error('Failed to toggle watched episode', err);
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
      await fetch(`${BACKEND_URL}/api/user/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, animeId }),
      });
    } catch (err) {
      console.error('Failed to toggle subscription', err);
    }
  }, [user]);

  // Notification Functions
  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
    );

    try {
      await fetch(`${BACKEND_URL}/api/user/notifications/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, notificationId }),
      });
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  }, [user]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await fetch(`${BACKEND_URL}/api/user/notifications/read-all/${user.id}`, { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    }
  }, [user]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Settings Functions
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    setUserSettings(prev => ({ ...prev, ...newSettings }));

    try {
      await fetch(`${BACKEND_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, settings: newSettings }),
      });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  }, [user]);

  const deleteWatchHistory = useCallback(async () => {
    if (!user) return;

    setWatchHistory([]);

    try {
      await fetch(`${BACKEND_URL}/api/user/history/${user.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete history', err);
    }
  }, [user]);

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
