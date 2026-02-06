import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Plus,
  Check,
  Star,
  Calendar,
  Clock,
  Building2,
  Film,
  ChevronLeft,
  Share2,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Twitter,
  MessageCircle,
  Copy,
  ChevronUp,
  ChevronDown,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import CommentSection from '@/components/CommentSection';
import { AnimeDetailSEO } from '@/components/Seo';
import { AnimeDetailSkeleton } from '@/components/skeletons/AnimeDetailSkeleton';
import { AnimeSchema, BreadcrumbSchema } from '@/components/SchemaOrg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    animeList,
    isLoading: animeListLoading,
    bookmarks,
    toggleBookmark,
    watchlist,
    toggleWatchlist,
    getLastWatched,
    user,
    // Database-backed features
    getUserRating,
    rateAnime,
    getWatchedEpisodes,
    toggleEpisodeWatched,
  } = useApp();
  const [episodeView, setEpisodeView] = useState<'compact' | 'comfy'>('comfy');
  const [episodeFilter, setEpisodeFilter] = useState<'all' | 'unwatched' | 'watched' | 'latest'>('all');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  const anime = id ? animeList.find(a => a.id === id) : undefined;
  const isBookmarked = id ? bookmarks.includes(id) : false;
  const isInWatchlist = id ? watchlist.includes(id) : false;
  const lastWatched = id ? getLastWatched(id) : undefined;

  // Get database-backed data
  const userRating = id ? getUserRating(id) : 0;
  const watchedEpisodes = id ? getWatchedEpisodes(id) : [];

  // UI state only
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Save user rating (Database-backed)
  const handleRating = (rating: number) => {
    if (id) rateAnime(id, rating);
  };

  // Toggle episode watched (Database-backed)
  const handleToggleEpisodeWatched = (epNum: number) => {
    if (id) toggleEpisodeWatched(id, epNum);
  };

  // Fetch notification subscription status
  useEffect(() => {
    if (!user || !id) {
      setNotifyEnabled(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/check?userId=${user.id}&animeId=${id}`, {
          headers: { ...getAuthHeaders() }
        });
        const data = await res.json();
        setNotifyEnabled(data.subscribed || false);
      } catch (err) {
        console.error('Failed to check subscription:', err);
      }
    };

    fetchSubscription();
  }, [user, id]);

  // Toggle notification subscription (Backend API)
  const toggleNotify = async () => {
    if (!user || !id || !anime) {
      alert('Login untuk mengaktifkan notifikasi');
      return;
    }

    setNotifyLoading(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          userId: user.id,
          animeId: id,
          animeTitle: anime.title,
          animePoster: anime.poster,
          scheduleDay: anime.jadwalRilis?.hari,
          scheduleTime: anime.jadwalRilis?.jam
        })
      });

      const data = await res.json();
      setNotifyEnabled(data.subscribed);
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setNotifyLoading(false);
    }
  };

  // Social share functions
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Nonton ${anime?.title} di Animeku! 🎬`;

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  // Jadwal Rilis (untuk anime ongoing) - gunakan data dari database
  const jadwalRilis = anime?.status === 'Ongoing' && anime?.jadwalRilis ? {
    hari: anime.jadwalRilis.hari,
    jam: anime.jadwalRilis.jam || '??:?? WIB'
  } : null;

  // Get related anime by genres
  const relatedAnime = anime
    ? animeList.filter(a =>
      a.id !== anime.id &&
      a.genres.some(g => anime.genres.includes(g))
    ).slice(0, 12)
    : [];
  const episodeNumbers = anime
    ? (anime.episodeData && anime.episodeData.length > 0
      ? anime.episodeData.map(e => e.ep || e.episodeNumber || 0).sort((a, b) => a - b)
      : Array.from({ length: anime.episodes }, (_, i) => i + 1))
    : [];
  const latestEpisode = episodeNumbers.length > 0 ? episodeNumbers[episodeNumbers.length - 1] : null;

  const filteredEpisodes = episodeNumbers.filter((epNum) => {
    if (episodeFilter === 'latest') {
      return epNum === latestEpisode;
    }
    if (episodeFilter === 'watched') {
      return watchedEpisodes.includes(epNum);
    }
    if (episodeFilter === 'unwatched') {
      return !watchedEpisodes.includes(epNum);
    }
    return true;
  }).filter((epNum) => {
    if (!episodeSearch.trim()) return true;
    return String(epNum).includes(episodeSearch.trim());
  });

  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setEpisodeView(isMobile ? 'compact' : 'comfy');
  }, [isMobile]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (animeListLoading) {
    return <AnimeDetailSkeleton />;
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Anime Tidak Ditemukan</h1>
          <p className="text-white/50 mb-8">Maaf, anime yang Anda cari tidak tersedia.</p>
          <Link to="/" className="btn-primary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', url: 'https://animeku.xyz/' },
    { name: anime?.title || 'Detail Anime', url: `https://animeku.xyz/anime/${id}` }
  ];

  return (
    <main className="min-h-screen bg-[#0F0F1A]">
      {anime && (
        <AnimeDetailSEO
          title={anime.title}
          description={anime.synopsis || `Nonton ${anime.title} subtitle Indonesia streaming gratis di Animeku`}
          image={anime.banner || anime.poster}
          url={`/anime/${anime.id}`}
          rating={String(anime.rating)}
          genres={anime.genres}
          status={anime.status}
          episodes={anime.episodes}
          year={anime.releasedYear}
        />
      )}
      
      {/* Schema.org JSON-LD */}
      {anime && (
        <>
          <AnimeSchema
            title={anime.title}
            description={anime.synopsis}
            poster={anime.poster}
            banner={anime.banner}
            rating={anime.rating}
            status={anime.status}
            episodes={anime.episodes}
            genres={(anime as any).genres || (anime as any).genre}
            studio={anime.studio}
            releaseYear={(anime as any).tahunRilis || (anime as any).releaseYear}
            url={`https://animeku.xyz/anime/${id}`}
            episodeData={anime.episodeData?.map((ep: any) => ({ ep: ep.ep || 1, subtitle: ep.subtitle }))}
          />
          <BreadcrumbSchema items={breadcrumbItems} />
        </>
      )}
      {/* Hero Banner */}
      <div className="relative">
        {/* Background - absolute positioned */}
        <div className="absolute inset-0 h-[300px] sm:h-[400px] lg:h-[500px]">
          <img
            src={anime.banner || anime.poster}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/80 to-[#0F0F1A]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F1A]/90 via-[#0F0F1A]/50 to-transparent" />
        </div>

        {/* Back Button - Aligned with Grid */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/50 backdrop-blur-sm rounded-lg sm:rounded-xl text-white/70 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            Kembali
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-6">
          <div className="flex flex-row gap-4 sm:gap-6 lg:gap-8 items-start w-full">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex-shrink-0 w-24 sm:w-40 lg:w-56 aspect-[3/4]"
            >
              <div className="absolute -inset-2 sm:-inset-3 rounded-2xl bg-gradient-to-br from-[#6C5DD3]/35 via-[#00C2FF]/20 to-transparent blur-2xl opacity-90" />
              <div className="relative w-full h-full rounded-lg sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0 pb-2 sm:pb-4"
            >
              {/* Title */}
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold font-heading text-white mb-1 sm:mb-2 leading-tight line-clamp-2">
                {anime.title}
              </h1>
              {anime.titleJp && (
                <p className="text-white/50 text-xs sm:text-base lg:text-lg mb-2 sm:mb-4 line-clamp-1">{anime.titleJp}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                <span className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-bold rounded-full">
                  <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current" />
                  {anime.rating}
                </span>
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${anime.status === 'Ongoing'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400'
                  }`}>
                  {anime.status}
                </span>
              </div>

              {/* Highlight Info Bar - Clean Grid */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <div className="text-xs">
                    <p className="text-white/40">Rating</p>
                    <p className="text-white font-semibold">{anime.rating}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Film className="w-4 h-4 text-blue-400" />
                  <div className="text-xs">
                    <p className="text-white/40">Episode</p>
                    <p className="text-white font-semibold">{anime.episodes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <div className="text-xs">
                    <p className="text-white/40">Rilis</p>
                    <p className="text-white font-semibold">{anime.releasedYear}</p>
                  </div>
                </div>
                {anime.duration && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Clock className="w-4 h-4 text-white/70" />
                    <div className="text-xs">
                      <p className="text-white/40">Durasi</p>
                      <p className="text-white font-semibold">{anime.duration}</p>
                    </div>
                  </div>
                )}
                {anime.studio && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Building2 className="w-4 h-4 text-white/70" />
                    <div className="text-xs">
                      <p className="text-white/40">Studio</p>
                      <p className="text-white font-semibold line-clamp-1">{anime.studio}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule + Genres Row */}
              <div className="mt-3 flex flex-wrap items-center gap-2 mb-4 lg:mb-6">
                {jadwalRilis && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-200 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-green-400" />
                    <span className="whitespace-nowrap">Tayang {jadwalRilis.hari}</span>
                    <span className="text-green-300/70">•</span>
                    <span className="font-semibold whitespace-nowrap">{jadwalRilis.jam}</span>
                  </span>
                )}
                {anime.genres.slice(0, 4).map((genre) => (
                  <Link
                    key={genre}
                    to={`/genres?genre=${genre}`}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/10 hover:bg-white/20 text-white/70 text-xs sm:text-sm rounded-full transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl bg-white/5 border border-white/10 p-2 sm:p-3" ref={actionsRef}>
                <Link
                  to={`/watch/${anime.id}/${lastWatched?.episodeNumber || 1}`}
                  className="btn-primary flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
                >
                  <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  <span className="hidden xs:inline">{lastWatched ? `Lanjutkan EP ${lastWatched.episodeNumber}` : 'Tonton'}</span>
                  <span className="xs:hidden"><Play className="w-4 h-4" /></span>
                </Link>

                <button
                  onClick={() => toggleBookmark(anime.id)}
                  className={`btn-secondary flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 ${isBookmarked ? 'bg-[#6C5DD3] border-[#6C5DD3]' : ''}`}
                >
                  {isBookmarked ? <Check className="w-4 sm:w-5 h-4 sm:h-5" /> : <Plus className="w-4 sm:w-5 h-4 sm:h-5" />}
                  <span className="hidden sm:inline">{isBookmarked ? 'Tersimpan' : 'Favorit'}</span>
                </button>

                <button
                  onClick={() => toggleWatchlist(anime.id)}
                  className={`hidden sm:flex btn-secondary items-center gap-2 ${isInWatchlist ? 'bg-green-500/20 border-green-500/50' : ''}`}
                >
                  {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isInWatchlist ? 'Di Watchlist' : 'Watchlist'}
                </button>

                {/* Notification Bell for Ongoing */}
                {anime.status === 'Ongoing' && (
                  <button
                    onClick={toggleNotify}
                    disabled={notifyLoading}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${notifyEnabled ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'} ${notifyLoading ? 'opacity-50 cursor-wait' : ''}`}
                    title={notifyEnabled ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
                  >
                    {notifyLoading ? (
                      <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : notifyEnabled ? (
                      <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
                    ) : (
                      <BellOff className="w-4 sm:w-5 h-4 sm:h-5" />
                    )}
                  </button>
                )}

                {/* Share Dialog */}
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                      <Share2 className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1A1A2E] border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white">Bagikan Anime</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {/* Social Share Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={shareToTwitter}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] rounded-xl transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                          Twitter
                        </button>
                        <button
                          onClick={shareToWhatsApp}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          WhatsApp
                        </button>
                      </div>
                      {/* Copy Link */}
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                        />
                        <Button
                          onClick={copyLink}
                          className={`${copied ? 'bg-green-500' : 'bg-[#6C5DD3] hover:bg-[#5a4ec0]'}`}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* User Rating - Compact on mobile */}
              <div className="mt-4 flex sm:hidden items-center gap-2 flex-wrap">
                <span className="text-white/50 text-xs">Rating Anda:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className="transition-transform hover:scale-110"
                      aria-label={`Beri rating ${star}`}
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/20'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-yellow-400 font-medium text-xs">{userRating}/10</span>
                )}
              </div>

              {/* User Rating - hidden on very small screens */}
              <div className="hidden sm:flex mt-4 items-center gap-2 sm:gap-4 flex-wrap">
                <span className="text-white/50 text-xs sm:text-sm">Rating Anda:</span>
                <div className="flex gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-4 sm:w-5 h-4 sm:h-5 transition-colors ${star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/20'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-yellow-400 font-medium text-sm">{userRating}/10</span>
                )}
              </div>

              {/* Jadwal moved above - remove duplicate */}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="episodes" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-0.5 sm:p-1 mb-4 sm:mb-6 w-full sm:w-auto">
            <TabsTrigger
              value="episodes"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Episode
            </TabsTrigger>
            <TabsTrigger
              value="synopsis"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Sinopsis
            </TabsTrigger>
            <TabsTrigger
              value="related"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Terkait
            </TabsTrigger>
          </TabsList>

          {/* Episodes Tab */}
          <TabsContent value="episodes">
            {/* Progress Counter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2 text-white/70">
                <Eye className="w-4 h-4" />
                <span className="text-sm">
                  Sudah ditonton: <strong className="text-white">{watchedEpisodes.length}</strong> / {anime.episodes} episode
                </span>
              </div>
              <div className="flex items-center gap-3">
                {latestEpisode && (
                  <button
                    onClick={() => {
                      const el = document.getElementById('latest-episode');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Episode Terbaru
                  </button>
                )}
                {watchedEpisodes.length > 0 && (
                  <div className="w-24 sm:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(watchedEpisodes.length / anime.episodes) * 100}%` }}
                    />
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
                  <button
                    onClick={() => setEpisodeView('compact')}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${episodeView === 'compact'
                      ? 'bg-[#6C5DD3] text-white'
                      : 'text-white/60 hover:text-white'
                      }`}
                  >
                    Ringkas
                  </button>
                  <button
                    onClick={() => setEpisodeView('comfy')}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${episodeView === 'comfy'
                      ? 'bg-[#6C5DD3] text-white'
                      : 'text-white/60 hover:text-white'
                      }`}
                  >
                    Nyaman
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 p-1 text-xs">
                {(['all', 'unwatched', 'watched', 'latest'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setEpisodeFilter(key)}
                    className={`px-3 py-1 rounded-full transition-colors ${episodeFilter === key ? 'bg-[#6C5DD3] text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    {key === 'all' && 'Semua'}
                    {key === 'unwatched' && 'Belum Ditonton'}
                    {key === 'watched' && 'Ditonton'}
                    {key === 'latest' && 'Terbaru'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari episode..."
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    className="w-44 sm:w-56 pl-9 pr-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>
                {(episodeFilter !== 'all' || episodeSearch) && (
                  <button
                    onClick={() => {
                      setEpisodeFilter('all');
                      setEpisodeSearch('');
                    }}
                    className="text-xs text-white/50 hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${episodeView === 'compact' ? 'gap-2' : 'gap-3'}`}>
              {filteredEpisodes.map((epNum) => {
                const isWatched = watchedEpisodes.includes(epNum);
                const isLatest = epNum === latestEpisode;
                return (
                  <Link
                    to={`/watch/${anime.id}/${epNum}`}
                    key={epNum}
                    id={epNum === latestEpisode ? 'latest-episode' : undefined}
                    className={`group relative block rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${episodeView === 'compact' ? 'p-3' : 'p-4'} ${isLatest
                      ? 'bg-yellow-500/10 border-yellow-500/40 hover:border-yellow-500/60 shadow-[0_0_0_1px_rgba(234,179,8,0.2),0_0_24px_rgba(234,179,8,0.12)]'
                      : isWatched
                      ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                      : lastWatched?.episodeNumber === epNum
                        ? 'bg-[#6C5DD3]/20 border-[#6C5DD3] hover:border-[#8B7BEF]'
                        : 'bg-white/5 border-white/10 hover:border-[#6C5DD3]/50 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white group-hover:text-[#6C5DD3] transition-colors">
                        EP {epNum}
                      </span>
                      <div className="flex items-center gap-1">
                        {isLatest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            Terbaru
                          </span>
                        )}
                        {lastWatched?.episodeNumber === epNum && (
                          <span className="text-xs text-[#6C5DD3]">Terakhir</span>
                        )}
                        {isWatched && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Clock className="w-3 h-3" />
                        {anime.duration}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleEpisodeWatched(epNum);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${isWatched
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                          }`}
                        title={isWatched ? 'Tandai belum ditonton' : 'Tandai sudah ditonton'}
                      >
                        {isWatched ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {lastWatched?.episodeNumber === epNum && lastWatched.progress > 0 && (
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#6C5DD3] rounded-full"
                          style={{ width: `${lastWatched.progress}%` }}
                        />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Synopsis Tab */}
          <TabsContent value="synopsis">
            <div className="max-w-3xl">
              <p className={`text-white/70 leading-relaxed text-lg ${showFullSynopsis ? '' : 'line-clamp-6'}`}>
                {anime.synopsis}
              </p>
              {anime.synopsis && anime.synopsis.length > 300 && (
                <button
                  onClick={() => setShowFullSynopsis(prev => !prev)}
                  className="mt-3 text-sm text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
                >
                  {showFullSynopsis ? 'Tutup' : 'Selengkapnya'}
                </button>
              )}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-sm mb-1">Status</p>
                  <p className="text-white font-medium">{anime.status}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-sm mb-1">Studio</p>
                  <p className="text-white font-medium">{anime.studio}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-sm mb-1">Tahun Rilis</p>
                  <p className="text-white font-medium">{anime.releasedYear}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-sm mb-1">Total Episode</p>
                  <p className="text-white font-medium">{anime.episodes}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Related Tab */}
          <TabsContent value="related">
            {relatedAnime.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {relatedAnime.map((related, index) => (
                  <AnimeCard key={related.id} anime={related} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50">Tidak ada anime terkait ditemukan.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Comment Section */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl">
            <CommentSection animeId={anime.id} title="Komentar Anime" size="sm" />
          </div>
        </div>
      </section>

      {/* More Anime Section */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-heading text-white mb-6">
            Anime Lainnya
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {animeList
              .filter(a => a.id !== anime.id)
              .slice(0, 6)
              .map((related, index) => (
                <AnimeCard key={related.id} anime={related} index={index} />
              ))}
          </div>
        </div>
      </section>

      {/* Sticky Mobile Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="bg-[#0F0F1A]/95 backdrop-blur-md border-t border-white/10 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
          <div className="flex items-center gap-2">
            <Link
              to={`/watch/${anime.id}/${lastWatched?.episodeNumber || 1}`}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-xs px-3 py-2.5"
            >
              <Play className="w-4 h-4 fill-current" />
              {lastWatched ? `Lanjutkan EP ${lastWatched.episodeNumber}` : 'Tonton'}
            </Link>
            <button
              onClick={() => setMobileActionsOpen(prev => !prev)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="Menu aksi"
            >
              {mobileActionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {mobileActionsOpen && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              <button
                onClick={() => toggleBookmark(anime.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] ${isBookmarked ? 'bg-[#6C5DD3]/30 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {isBookmarked ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                Favorit
              </button>
              <button
                onClick={() => toggleWatchlist(anime.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] ${isInWatchlist ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                Watchlist
              </button>
              {latestEpisode ? (
                <button
                  onClick={() => {
                    const el = document.getElementById('latest-episode');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setMobileActionsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] bg-white/5 text-white/70 hover:bg-white/10"
                >
                  <ChevronDown className="w-4 h-4" />
                  Terbaru
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] bg-white/5 text-white/40">
                  <ChevronDown className="w-4 h-4" />
                  Terbaru
                </div>
              )}
              {anime.status === 'Ongoing' ? (
                <button
                  onClick={toggleNotify}
                  disabled={notifyLoading}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] ${notifyEnabled ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  {notifyLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : notifyEnabled ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                  Notif
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] bg-white/5 text-white/40">
                  <BellOff className="w-4 h-4" />
                  Notif
                </div>
              )}
              <button
                onClick={() => {
                  setShareDialogOpen(true);
                  setMobileActionsOpen(false);
                  actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] bg-white/5 text-white/70 hover:bg-white/10"
              >
                <Share2 className="w-4 h-4" />
                Bagikan
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
