import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
// Mobile-first: Mobile components are smaller, load eagerly for better mobile LCP
import HeroMobile from '@/components/HeroMobile';
import MobileHome from '@/components/MobileHome';
import { HomePageSkeleton } from '@/components/SkeletonLoading';
import { HomeSEO } from '@/components/Seo';
import { OrganizationSchema } from '@/components/SchemaOrg';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';
import type { SidebarWidget } from '@/types';

// Desktop: Heavy components lazy loaded to reduce initial bundle
const Hero = lazy(() => import('@/components/Hero'));
const DesktopHome = lazy(() => import('@/components/DesktopHome'));

// Default sidebar widgets - Ideal order for UX
const defaultWidgets: SidebarWidget[] = [
  { id: 'schedule', name: 'Jadwal Rilis', enabled: true, order: 0 },
  { id: 'topRating', name: 'Top Rating', enabled: true, order: 1 },
  { id: 'stats', name: 'Statistik User', enabled: true, order: 2 },
  { id: 'random', name: 'Tombol Anime Random', enabled: true, order: 3 },
  { id: 'genres', name: 'Genre Populer', enabled: true, order: 4 },
];

export default function Home() {
  const { animeList, isLoading } = useApp();
  const [sidebarWidgets, setSidebarWidgets] = useState<SidebarWidget[]>(defaultWidgets);
  const [trendingAnime, setTrendingAnime] = useState<any[]>([]);

  // Load homepage settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const widgetsRes = await apiFetch(`${BACKEND_URL}/api/settings/sidebarWidgets`);

        if (widgetsRes.ok) {
          const data = await widgetsRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setSidebarWidgets(data);
          }
        }
      } catch (err) {
        console.error('Failed to load homepage settings:', err);
      }
    };

    loadSettings();
  }, []);

  // Fetch trending anime from backend
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/anime/trending`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTrendingAnime(data);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      }
      // Fallback: use animeList sorted by views or rating
      const fallback = [...animeList]
        .sort((a, b) => (b.views || 0) - (a.views || 0) || b.rating - a.rating)
        .slice(0, 6);
      setTrendingAnime(fallback);
    };

    if (animeList.length > 0) {
      fetchTrending();
    }
  }, [animeList]);

  // Filter and sort anime dynamically - Memoized untuk performance
  const ongoingAnime = useMemo(() =>
    animeList
      .filter(a => a.status === 'Ongoing')
      .sort((a, b) => {
        const dateA = a.lastEpisodeUpload ? new Date(a.lastEpisodeUpload).getTime() : 0;
        const dateB = b.lastEpisodeUpload ? new Date(b.lastEpisodeUpload).getTime() : 0;
        return dateB - dateA;
      }),
    [animeList]
  );

  const completedAnime = useMemo(() =>
    animeList.filter(a => a.status === 'Completed'),
    [animeList]
  );

  const topRatedAnime = useMemo(() =>
    [...animeList].sort((a, b) => b.rating - a.rating).slice(0, 10),
    [animeList]
  );

  const latestAnime = useMemo(() =>
    [...animeList]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 8),
    [animeList]
  );

  const popularGenres = useMemo(() =>
    [...new Set(
      animeList
        .flatMap(anime => anime.genres || [])
        .filter(Boolean)
    )].slice(0, 8),
    [animeList]
  );

  // Loading State - Skeleton
  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-[#0F0F1A]">
      <HomeSEO />
      <OrganizationSchema />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#6C5DD3]/20 blur-[140px]" />
          <div className="absolute top-40 right-[-120px] h-[360px] w-[360px] rounded-full bg-[#00C2FF]/20 blur-[140px]" />
          <div className="absolute top-[45%] left-[-140px] h-[320px] w-[320px] rounded-full bg-[#FF6B6B]/10 blur-[140px]" />
        </div>
        <div className="relative z-10">
          {/* Mobile Hero - Ultra lightweight */}
          <div className="sm:hidden">
            <HeroMobile />
          </div>
          {/* Desktop Hero - Lazy loaded with Suspense */}
          <div className="hidden sm:block">
            <Suspense fallback={<div className="h-[70vh] min-h-[520px] bg-[#0F0F1A] animate-pulse" />}>
              <Hero />
            </Suspense>
          </div>
        </div>
      </div>

      {/* SEO Content Section - Hidden visually but readable by Google */}
      <section className="sr-only" aria-hidden="true">
        <h1>Nonton Anime Subtitle Indonesia Terbaru & Terlengkap</h1>
        <p>
          Animeku adalah platform terbaik untuk <strong>nonton anime subtitle Indonesia</strong> secara gratis.
          Koleksi lengkap anime sub Indo mulai dari anime ongoing, movie, hingga anime klasik dengan
          kualitas HD. Streaming tanpa buffering, update tiap hari!
        </p>
        <div>
          {['Action', 'Romance', 'Comedy', 'Drama', 'Fantasy', 'Isekai'].map((genre) => (
            <a key={genre} href={`/genres?genre=${genre}`}>{genre}</a>
          ))}
        </div>
      </section>

      <div className="relative z-10 bg-[#0F0F1A]">
        {/* Mobile Layout - Only visible on mobile */}
        <div className="sm:hidden">
          <MobileHome
            trendingAnime={trendingAnime}
            ongoingAnime={ongoingAnime}
            latestAnime={latestAnime}
            topRatedAnime={topRatedAnime}
            completedAnime={completedAnime}
            popularGenres={popularGenres}
            sidebarWidgets={sidebarWidgets}
          />
        </div>

        {/* Desktop Layout - Lazy loaded with Suspense */}
        <div className="hidden sm:block">
          <Suspense fallback={<div className="min-h-[600px] bg-[#0F0F1A] animate-pulse" />}>
            <DesktopHome
              trendingAnime={trendingAnime}
              ongoingAnime={ongoingAnime}
              latestAnime={latestAnime}
              topRatedAnime={topRatedAnime}
              completedAnime={completedAnime}
              popularGenres={popularGenres}
              sidebarWidgets={sidebarWidgets}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
