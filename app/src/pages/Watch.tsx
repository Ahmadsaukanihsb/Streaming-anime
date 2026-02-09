import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  Flag,
  List,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Settings,
  Monitor,
  Keyboard,
  Camera,
  Film,
  Users,
  Maximize,
  Minimize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';
import AnimeCard from '@/components/AnimeCard';
import CommentSection from '@/components/CommentSection';
import NobarRoom from '@/components/WatchPartyRoom';
import NobarLobby from '@/components/WatchPartyLobby';
import VideoPlayer from '@/components/VideoPlayer';
import { apiFetch } from '@/lib/api';
import { WatchSEO } from '@/components/Seo';
import { VideoSchema, BreadcrumbSchema } from '@/components/SchemaOrg';
import { createLogger } from '@/lib/logger';
import { getAnimeUrl, getWatchUrl, generateCleanSlug } from '@/lib/slug';

const logger = createLogger('Watch');

// Helper to generate signed URL for video (fast, direct from R2)
async function getSignedVideoUrl(videoUrl: string, animeId: string | undefined, episode: number): Promise<string> {
  try {
    const tokenRes = await apiFetch(`${BACKEND_URL}/api/anime/video-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        animeId,
        episode
      })
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      // Use signed URL directly from R2 (fast CDN)
      return tokenData.signedUrl || videoUrl;
    }
  } catch (err) {
    logger.error('[getSignedVideoUrl] Failed to generate signed URL:', err);
  }
  // Fallback to original URL
  return videoUrl;
}

export default function Watch() {
  const params = useParams<{ id: string; episode: string }>();
  const id = params.id;
  const episode = params.episode;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get('room');
  const { animeList, updateWatchProgress, user } = useApp();
  // UI Enhancement States
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Video streaming states
  const [isEmbed, setIsEmbed] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [subtitleUrl, setSubtitleUrl] = useState<string>('');
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);

  // Fallback state for anime data (if not found in context/props)
  const [apiAnime, setApiAnime] = useState<any>(undefined);
  const contextAnime = id ? animeList.find(a => {
    if (a.id === id) return true;
    if (a.cleanSlug === id) return true;
    const generatedSlug = generateCleanSlug(a.title);
    if (generatedSlug === id) return true;
    if (a.id.startsWith(id + '-')) return true;
    return false;
  }) : undefined;
  const anime = contextAnime || apiAnime;

  const currentEpisode = (() => {
    const parsed = parseInt(episode || '1', 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })();
  const totalEpisodes = anime?.episodes || 1;

  // Nobar State
  const [showNobar, setShowNobar] = useState(false);
  const [nobarRoomId, setNobarRoomId] = useState<string | undefined>();

  // Auto-join room from URL query param
  useEffect(() => {
    if (roomFromUrl && !nobarRoomId) {
      setNobarRoomId(roomFromUrl);
      setShowNobar(true);
      logger.log('[Watch] Auto-joining room from URL:', roomFromUrl);
    }
  }, [roomFromUrl]);

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    // Track view for trending
    if (id) {
      apiFetch(`${BACKEND_URL}/api/anime/${id}/view`, { method: 'POST' })
        .catch(() => { }); // Silent fail is ok
    }

    // Fetch anime detail if missing from context
    if (id && !contextAnime && !apiAnime) {
      apiFetch(`${BACKEND_URL}/api/anime/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch anime info');
          return res.json();
        })
        .then(data => {
          setApiAnime(data);
        })
        .catch(err => logger.error('[Watch] Error fetching anime info:', err));
    }
  }, [id, episode, contextAnime]);

  // Fetch video URL when episode or quality changes
  useEffect(() => {
    const fetchVideoUrl = async () => {
      if (!anime) return;

      // Reset state
      setVideoUrl('');
      setIsLoadingVideo(true);
      setVideoError(null);

      try {
        const response = await apiFetch(
          `${BACKEND_URL}/api/anime/stream/${encodeURIComponent(anime.title)}/${currentEpisode}?server=${selectedServer}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          // Show error message instead of auto-redirecting
          throw new Error(errData.error || 'Gagal mengambil video untuk episode ini');
        }

        const data = await response.json();

        if (!data.streams || data.streams.length === 0) {
          throw new Error('Video tidak tersedia untuk episode ini');
        }

        // Filter video streams
        const directStreams = data.streams.filter((s: any) => s.type === 'direct'); // R2 Cloud
        const embedStreams = data.streams.filter((s: any) => s.type === 'embed');
        const downloadStreams = data.streams.filter((s: any) => s.type === 'download');
        setDownloadStreams(downloadStreams);
        setAllDirectStreams(directStreams);

        // Set subtitle URL if available
        if (data.subtitle && data.subtitle.url) {
          logger.log('[Watch] Subtitle available:', data.subtitle.url);
          setSubtitleUrl(data.subtitle.url);
        } else {
          setSubtitleUrl('');
        }

        // Extract available qualities from direct streams
        const qualities = directStreams
          .map((s: any) => s.quality)
          .filter((q: string) => q)
          .sort((a: string, b: string) => {
            // Sort by resolution (higher first)
            const numA = parseInt(a.replace('p', '')) || 0;
            const numB = parseInt(b.replace('p', '')) || 0;
            return numB - numA;
          });
        const uniqueQualities = [...new Set(qualities)] as string[];
        setAvailableQualities(uniqueQualities);

        let selectedStream;

        // Priority: Direct (R2) > Embed > Error
        if (directStreams.length > 0) {
          // If quality is selected, use that, otherwise use highest quality
          const targetQuality = selectedQuality || uniqueQualities[0] || '';
          selectedStream = directStreams.find((s: any) => s.quality === targetQuality) || directStreams[0];

          // Update selected quality state if not set
          if (!selectedQuality && selectedStream.quality) {
            setSelectedQuality(selectedStream.quality);
          }

          setIsEmbed(false);

          // Generate proxy token to hide original URL
          const signedUrl = await getSignedVideoUrl(selectedStream.url, id, currentEpisode);
          setVideoUrl(signedUrl);
        } else if (embedStreams.length > 0) {
          // Use embed (Desustream etc) - no quality selection for embeds
          selectedStream = embedStreams[0];
          setIsEmbed(true);
          setAvailableQualities([]); // No quality options for embed
          setVideoUrl(selectedStream.url);
        } else {
          throw new Error('Video tidak tersedia untuk episode ini');
        }

      } catch (error: any) {
        logger.error('[Watch] Stream error:', error);

        setVideoError(error.message || 'Gagal memuat video. Coba episode lain atau refresh halaman.');
        setVideoUrl('');
      } finally {
        setIsLoadingVideo(false);
      }
    };

    fetchVideoUrl();
  }, [currentEpisode, anime, selectedServer]);

  // NOTE: Keyboard shortcuts are handled in the handleKeyDown useEffect below (line ~506)
  // This avoids duplicate event listeners for better performance


  // Auto-hide controls while playing
  useEffect(() => {
    // Save progress every 10 seconds
    const interval = setInterval(() => {
      if (videoRef.current && id && isPlaying) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        updateWatchProgress(id, `ep-${currentEpisode}`, currentEpisode, progress);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [id, currentEpisode, isPlaying, updateWatchProgress]);

  const goToEpisode = (epNum: number) => {
    if (epNum >= 1 && epNum <= totalEpisodes && id) {
      navigate(getWatchUrl(anime!, epNum));
    }
  };

  // Handle Video End - Auto Next Episode
  const handleVideoEnd = async () => {
    if (autoNextEnabled && currentEpisode < totalEpisodes) {
      logger.log('[Watch] Auto-playing next episode');
      goToEpisode(currentEpisode + 1);
    }
  };



  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Anime Tidak Ditemukan</h1>
          <Link to="/" className="btn-primary">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  const seoDescription = anime ? `Streaming ${anime.title} Episode ${currentEpisode} subtitle Indonesia kualitas HD` : 'Streaming anime subtitle Indonesia';

  const breadcrumbItems = [
    { name: 'Home', url: 'https://animeku.xyz/' },
    { name: anime?.title || 'Anime', url: `https://animeku.xyz${getAnimeUrl(anime!)}` },
    { name: `Episode ${currentEpisode}`, url: `https://animeku.xyz${getWatchUrl(anime!, currentEpisode)}` }
  ];

  return (
    <>
      {anime && (
        <WatchSEO
          title={anime.title}
          description={seoDescription}
          image={anime.poster || anime.banner || ''}
          url={`/watch/${id}/${currentEpisode}`}
          videoUrl={videoUrl}
          episode={currentEpisode}
          duration={anime.duration ? `PT${parseInt(anime.duration)}M` : 'PT24M'}
        />
      )}
      {anime && videoUrl && (
        <>
          <VideoSchema
            title={`${anime.title} Episode ${currentEpisode}`}
            description={anime.synopsis}
            thumbnailUrl={anime.poster}
            videoUrl={videoUrl}
            duration={anime.duration ? `PT${parseInt(anime.duration)}M` : undefined}
          />
          <BreadcrumbSchema items={breadcrumbItems} />
        </>
      )}
      <main className="min-h-screen bg-[#0F0F1A]">
        {!user && (
          <div className="px-4 sm:px-6 lg:px-8 pt-20">
            <div className="mx-auto max-w-3xl bg-white/5 border border-white/10 rounded-xl p-4 text-center text-white/70">
              Login untuk menyimpan progress dan melanjutkan tontonan dari menit terakhir.
              <Link to="/login" className="ml-2 text-[#6C5DD3] hover:underline">Login</Link>
            </div>
          </div>
        )}
        {/* Video Player + Episode List Section */}
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 pt-20 transition-all duration-300 ${isTheaterMode ? 'max-w-full' : 'max-w-7xl'}`}>
          <div className={`grid gap-4 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
            {/* Video Player - 3 columns (or full width in theater mode) */}
            <div className={`${isTheaterMode ? 'w-full' : 'lg:col-span-3'} ${showNobar ? 'hidden' : ''}`}>
              <VideoPlayer
                videoUrl={videoUrl}
                poster={anime.banner || anime.poster}
                title={anime.title}
                episode={currentEpisode}
                animeId={anime.id}
                isEmbed={isEmbed}
                subtitleUrl={subtitleUrl}
                autoPlay={isPlaying}
                onBack={() => navigate(getAnimeUrl(anime))}
                onNobar={() => setShowNobar(true)}
                onShare={() => {/* TODO: Implement share */}}
                onReport={() => {/* TODO: Implement report */}}
                onEnded={handleVideoEnd}
                onTimeUpdate={(time, duration) => {
                  setCurrentTime(time);
                  setDuration(duration);
                }}
              />
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex items-center gap-2 bg-black/90 px-3 py-2 rounded-lg">
                                <span className="text-xs text-white/70">Brightness</span>
                                <input
                                  type="range"
                                  min={50}
                                  max={150}
                                  value={brightness}
                                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                                  className="w-20 h-1 bg-white/20 rounded-full cursor-pointer"
                                />
                                <span className="text-xs text-white w-8">{brightness}%</span>
                              </div>
                            </div>

                            {/* Picture-in-Picture - hidden on mobile */}
                            <button
                              onClick={togglePiP}
                              className="hidden sm:block p-1.5 text-white hover:text-[#6C5DD3] transition-colors"
                              title="Picture in Picture (P)"
                            >
                              <PictureInPicture2 className="w-4 h-4" />
                            </button>

                            {/* Screenshot - hidden on mobile */}
                            <button
                              onClick={takeScreenshot}
                              className="hidden sm:block p-1.5 text-white hover:text-[#6C5DD3] transition-colors"
                              title="Screenshot"
                            >
                              <Camera className="w-4 h-4" />
                            </button>

                            {/* Loop Toggle - hidden on mobile */}
                            <button
                              onClick={() => setIsLooping(!isLooping)}
                              className={`hidden sm:block p-1.5 transition-colors ${isLooping ? 'text-[#6C5DD3]' : 'text-white hover:text-[#6C5DD3]'}`}
                              title="Loop Video"
                            >
                              <Repeat className="w-4 h-4" />
                            </button>

                            {/* Auto Next Toggle - hidden on mobile */}
                            <button
                              onClick={() => setAutoNextEnabled(!autoNextEnabled)}
                              className={`hidden sm:flex p-1.5 transition-colors items-center gap-1 ${autoNextEnabled ? 'text-green-400' : 'text-white/50'}`}
                              title={autoNextEnabled ? 'Auto Next: ON' : 'Auto Next: OFF'}
                            >
                              <SkipForward className="w-4 h-4" />
                              <span className="text-[10px] font-medium">{autoNextEnabled ? 'ON' : 'OFF'}</span>
                            </button>

                            {/* Quality Selector - only for direct streams with multiple qualities */}
                            {availableQualities.length > 0 && !isEmbed && (
                              <div className="relative hidden sm:block">
                                <button
                                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${showQualityMenu ? 'bg-[#6C5DD3] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                  title="Video Quality"
                                >
                                  <Film className="w-3.5 h-3.5" />
                                  <span>{selectedQuality || 'Auto'}</span>
                                </button>

                                {showQualityMenu && (
                                  <div className="absolute bottom-full right-0 mb-2 bg-[#1A1A2E] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[100px]">
                                    {availableQualities.map((quality) => (
                                      <button
                                        key={quality}
                                        onClick={async () => {
                                          // Find stream with this quality
                                          const stream = allDirectStreams.find(s => s.quality === quality);
                                          if (stream) {
                                            setSelectedQuality(quality);
                                            // Generate proxy for this quality
                                            const signedUrl = await getSignedVideoUrl(stream.url, id, currentEpisode);
                                            setVideoUrl(signedUrl);
                                          }
                                          setShowQualityMenu(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${selectedQuality === quality ? 'text-[#6C5DD3] bg-white/5' : 'text-white'
                                          }`}
                                      >
                                        {quality}
                                        {selectedQuality === quality && ' ✓'}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Theater Mode - hidden on mobile */}
                            <button
                              onClick={() => setIsTheaterMode(!isTheaterMode)}
                              className={`hidden lg:block p-1.5 transition-colors ${isTheaterMode ? 'text-[#6C5DD3]' : 'text-white hover:text-[#6C5DD3]'}`}
                              title="Theater Mode (T)"
                            >
                              <Monitor className="w-4 h-4" />
                            </button>

                            {/* Settings Menu - hidden on mobile */}
                            <div className="relative hidden sm:block">
                              <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-1.5 transition-colors ${showSettings ? 'text-[#6C5DD3]' : 'text-white hover:text-[#6C5DD3]'}`}
                                title="Settings"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              {showSettings && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-xl p-4 min-w-[200px] text-sm z-50">
                                  <div className="flex items-center gap-2 mb-3 text-white font-medium">
                                    <Keyboard className="w-4 h-4" />
                                    Keyboard Shortcuts
                                  </div>
                                  <div className="space-y-1.5 text-xs text-white/70">
                                    <div className="flex justify-between"><span>Play/Pause</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space / K</kbd></div>
                                    <div className="flex justify-between"><span>Seek -10s</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">← / J</kbd></div>
                                    <div className="flex justify-between"><span>Seek +10s</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">→ / L</kbd></div>
                                    <div className="flex justify-between"><span>Volume Up</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd></div>
                                    <div className="flex justify-between"><span>Volume Down</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd></div>
                                    <div className="flex justify-between"><span>Mute</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">M</kbd></div>
                                    <div className="flex justify-between"><span>Fullscreen</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd></div>
                                    <div className="flex justify-between"><span>Theater Mode</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">T</kbd></div>
                                    <div className="flex justify-between"><span>PiP</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">P</kbd></div>
                                    <div className="flex justify-between"><span>Speed</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">S</kbd></div>
                                    <div className="flex justify-between"><span>Next Episode</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">N</kbd></div>
                                    <div className="flex justify-between"><span>Prev Episode</span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">B</kbd></div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                                    Double-click left/right to skip ±10s
                                  </div>
                                </div>
                              )}
                            </div>

            </div>

            {/* Episode List Sidebar - 1 column */}
            <div className="lg:col-span-1">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 rounded-2xl p-4 h-full">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                  <List className="w-4 h-4" />
                  Daftar Episode ({anime.episodeData?.length || totalEpisodes})
                </h3>
                <div className="grid grid-cols-5 gap-1.5">
                  {(anime.episodeData && anime.episodeData.length > 0
                    ? [...anime.episodeData].sort((a: any, b: any) => (a.ep || a.episodeNumber || 0) - (b.ep || b.episodeNumber || 0))
                    : Array.from({ length: Math.min(totalEpisodes, 50) }, (_, i) => ({ ep: i + 1 }))
                  ).map((ep: any) => {
                    const epNum = ep.ep || ep.episodeNumber || 1;
                    const hasStream = ep.streams && ep.streams.length > 0;
                    return (
                      <Link
                        key={epNum}
                        to={getWatchUrl(anime, epNum)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:scale-105 ${epNum === currentEpisode
                          ? 'bg-[#6C5DD3] text-white'
                          : hasStream
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                      >
                        {epNum}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Info & Controls Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Main Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">{anime.title} - Episode {currentEpisode}</h1>

            {/* Meta Tags Bar */}
            <div className="flex flex-wrap items-center gap-2 text-sm mb-6">
              <span className="px-3 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] rounded-full font-medium">{anime.studio}</span>
              <span className="px-2 py-1 bg-white/5 text-white/60 rounded-full">{anime.releasedYear}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span className="text-white/50">Episode {currentEpisode} / {totalEpisodes}</span>
              {anime.rating && (
                <>
                  <span className="w-1 h-1 bg-white/30 rounded-full" />
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-full">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {anime.rating}
                  </span>
                </>
              )}
            </div>

            {/* Episode Details Card */}
            {(() => {
              const currentEpData = anime.episodeData?.find((e: any) => (e.ep || e.episodeNumber) === currentEpisode);
              if (!currentEpData?.title && !currentEpData?.thumbnail) return null;

              return (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10">
                  <div className="flex gap-4">
                    {currentEpData.thumbnail && (
                      <div className="flex-shrink-0 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-white/5">
                        <img
                          src={currentEpData.thumbnail}
                          alt={`Episode ${currentEpisode}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {currentEpData.title && (
                        <h3 className="text-white font-semibold mb-1 truncate">{currentEpData.title}</h3>
                      )}
                      <p className="text-white/50 text-sm">Episode {currentEpisode}</p>
                      {currentEpData.releaseDate && (
                        <p className="text-white/40 text-xs mt-1">
                          Rilis: {new Date(currentEpData.releaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Server & Quality Selection */}
            <div className="flex flex-wrap items-start gap-6 mb-6">
              <div>
                <h3 className="text-white text-sm font-medium mb-2">Pilih Server</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'server1', label: 'Server 1' },
                    { id: 'server2', label: 'Server 2' },
                  ].map((server) => (
                    <button
                      key={server.id}
                      onClick={() => setSelectedServer(server.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedServer === server.id
                        ? 'bg-[#6C5DD3] text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                        }`}
                    >
                      {server.label}
                    </button>
                  ))}
                </div>
              </div>


            </div>

            {downloadStreams.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white text-sm font-medium mb-2">Download / Alternatif ({downloadStreams.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {downloadStreams.map((stream, idx) => (
                    <a key={idx} href={stream.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs">
                      <span className="text-white/90">{stream.server} ({stream.quality})</span>
                      <Share2 className="w-3 h-3 text-white/30" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation with Up Next Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Prev Episode */}
              <button
                onClick={() => goToEpisode(currentEpisode - 1)}
                disabled={currentEpisode <= 1}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <ChevronLeftIcon className="w-5 h-5 text-white/70" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/50 text-xs">Sebelumnya</p>
                  <p className="text-white font-medium text-sm truncate">Episode {currentEpisode - 1}</p>
                </div>
              </button>

              {/* Current Episode Info */}
              <div className="hidden sm:flex items-center justify-center p-3 rounded-xl bg-[#6C5DD3]/10 border border-[#6C5DD3]/20">
                <div className="text-center">
                  <p className="text-[#6C5DD3] text-xs font-medium">Sedang Menonton</p>
                  <p className="text-white font-bold">Episode {currentEpisode}</p>
                </div>
              </div>

              {/* Next Episode */}
              <button
                onClick={() => goToEpisode(currentEpisode + 1)}
                disabled={currentEpisode >= totalEpisodes}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-right sm:flex-row-reverse"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/50 text-xs">Selanjutnya</p>
                  <p className="text-white font-medium text-sm truncate">Episode {currentEpisode + 1}</p>
                </div>
              </button>
            </div>

            {/* Up Next Section - Only show if there's a next episode */}
            {currentEpisode < totalEpisodes && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#6C5DD3]/10 to-transparent border border-[#6C5DD3]/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#6C5DD3] animate-pulse" />
                  <h3 className="text-white font-medium text-sm">Up Next</h3>
                </div>
                <div className="flex items-center gap-4">
                  {(() => {
                    const nextEp = anime.episodeData?.find((e: any) => (e.ep || e.episodeNumber) === currentEpisode + 1);
                    return (
                      <>
                        <div className="w-24 sm:w-32 aspect-video rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                          <img
                            src={nextEp?.thumbnail || anime.poster}
                            alt={`Episode ${currentEpisode + 1}`}
                            className="w-full h-full object-cover opacity-80"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold mb-1">Episode {currentEpisode + 1}</p>
                          {nextEp?.title && (
                            <p className="text-white/60 text-sm truncate mb-2">{nextEp.title}</p>
                          )}
                          <button
                            onClick={() => goToEpisode(currentEpisode + 1)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] hover:bg-[#5a4ec0] text-white text-sm font-medium rounded-xl transition-colors"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Tonton Selanjutnya
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Anime Synopsis */}
            {anime.synopsis && (
              <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#6C5DD3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Sinopsis
                </h3>
                <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{anime.synopsis}</p>
              </div>
            )}

            {/* Genres Tags */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white/50 text-xs mb-2">Genre</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre: string) => (
                    <Link
                      key={genre}
                      to={`/anime-list?genre=${encodeURIComponent(genre)}`}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs rounded-full transition-colors border border-white/10"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Anime Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-white/40 text-xs mb-1">Status</p>
                <p className={`text-sm font-medium ${anime.status === 'Ongoing' ? 'text-green-400' : 'text-blue-400'}`}>{anime.status}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-white/40 text-xs mb-1">Tipe</p>
                <p className="text-white text-sm font-medium">{anime.type || 'TV'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-white/40 text-xs mb-1">Episode</p>
                <p className="text-white text-sm font-medium">{totalEpisodes}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-white/40 text-xs mb-1">Tahun</p>
                <p className="text-white text-sm font-medium">{anime.releasedYear}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-white/40 text-xs mb-1">Durasi</p>
                <p className="text-white text-sm font-medium">{anime.duration || '-'}</p>
              </div>
            </div>

            {/* Episode Comments Section */}
            <div className="border-t border-white/10 pt-6">
              <CommentSection
                animeId={params.id || ''}
                episodeNumber={currentEpisode}
              />
            </div>
          </motion.div>
        </div>

        {/* Related Anime */}
        <section className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold font-heading text-white mb-6">Anime Serupa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {animeList.filter(a => a.id !== anime?.id).slice(0, 6).map((related, index) => (
                <AnimeCard key={related.id} anime={related} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Nobar Room */}
        {showNobar && anime && (
          <NobarRoom
            roomId={nobarRoomId}
            animeId={anime.id}
            episodeId={`${anime.id}-ep-${currentEpisode}`}
            animeTitle={anime.title}
            episodeNumber={currentEpisode}
            isHost={!nobarRoomId}
            onClose={() => {
              setShowNobar(false);
              setNobarRoomId(undefined);
            }}
            videoRef={videoRef}
          />
        )}

        {/* Nobar Lobby */}
        {showNobar && !anime && (
          <NobarLobby
            onJoinRoom={(roomId) => {
              setNobarRoomId(roomId);
            }}
            onCreateRoom={() => {
              navigate('/');
            }}
          />
        )}
      </main>
    </>
  );
}

