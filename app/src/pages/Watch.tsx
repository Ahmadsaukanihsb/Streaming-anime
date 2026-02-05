import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  ChevronLeft,
  Share2,
  Flag,
  List,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Settings,
  Monitor,
  PictureInPicture2,
  Sun,
  Keyboard,
  Camera,
  Repeat,
  FastForward,
  Film
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';
import AnimeCard from '@/components/AnimeCard';
import CommentSection from '@/components/CommentSection';
import { apiFetch } from '@/lib/api';


export default function Watch() {
  const params = useParams<{ id: string; episode: string }>();
  const id = params.id;
  const episode = params.episode;
  const navigate = useNavigate();
  const { animeList, updateWatchProgress, user } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isEmbed, setIsEmbed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [selectedServer, setSelectedServer] = useState('server1');
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI Enhancement States
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Fallback state for anime data (if not found in context/props)
  // This handles direct navigation or refresh
  const [apiAnime, setApiAnime] = useState<any>(undefined);
  const contextAnime = id ? animeList.find(a => a.id === id) : undefined;
  const anime = contextAnime || apiAnime;

  const currentEpisode = (() => {
    const parsed = parseInt(episode || '1', 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })();
  const totalEpisodes = anime?.episodes || 1;

  // Video streaming states
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [downloadStreams, setDownloadStreams] = useState<any[]>([]);
  const [subtitleUrl, setSubtitleUrl] = useState<string>('');

  // Advanced Playback States
  const [buffered, setBuffered] = useState(0);
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Quality Selection States
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [allDirectStreams, setAllDirectStreams] = useState<any[]>([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

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
        .catch(err => console.error('[Watch] Error fetching anime info:', err));
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
          console.log('[Watch] Subtitle available:', data.subtitle.url);
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
          setVideoUrl(selectedStream.url);
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
        console.error('[Watch] Stream error:', error);

        setVideoError(error.message || 'Gagal memuat video. Coba episode lain atau refresh halaman.');
        setVideoUrl('');
      } finally {
        setIsLoadingVideo(false);
      }
    };

    fetchVideoUrl();
  }, [currentEpisode, anime, selectedServer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // Empty deps

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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('[Watch] Play error:', err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = videoContainerRef.current;
    const video = videoRef.current as any;

    if (!videoContainer && !video) return;

    // Check if already in fullscreen
    const isFullscreen = document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement;

    if (!isFullscreen) {
      // Detect iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // On iOS, always use video element's native fullscreen
      if (isIOS && video) {
        if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
          return;
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
          return;
        }
      }

      // Desktop and Android: try container fullscreen first
      if (videoContainer) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen().catch(() => tryVideoFullscreen());
        } else if ((videoContainer as any).webkitRequestFullscreen) {
          (videoContainer as any).webkitRequestFullscreen();
        } else if ((videoContainer as any).mozRequestFullScreen) {
          (videoContainer as any).mozRequestFullScreen();
        } else if ((videoContainer as any).msRequestFullscreen) {
          (videoContainer as any).msRequestFullscreen();
        } else {
          tryVideoFullscreen();
        }
      } else {
        tryVideoFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Fallback fullscreen for iOS Safari (uses video element's native fullscreen)
  const tryVideoFullscreen = () => {
    const video = videoRef.current as any;
    if (!video) return;

    if (video.webkitEnterFullscreen) {
      // iOS Safari
      video.webkitEnterFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const goToEpisode = (epNum: number) => {
    if (epNum >= 1 && epNum <= totalEpisodes && id) {
      navigate(`/watch/${id}/${epNum}`);
    }
  };

  // Skip forward/backward by seconds
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  // Toggle Picture-in-Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('[Watch] PiP error:', err);
    }
  };

  // Change playback speed
  const changePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  // Double-click handler for seek
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;
    skip(isLeftSide ? -10 : 10);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          setIsTheaterMode(!isTheaterMode);
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 's':
          e.preventDefault();
          changePlaybackSpeed();
          break;
        case 'n':
          e.preventDefault();
          goToEpisode(currentEpisode + 1);
          break;
        case 'b':
          e.preventDefault();
          goToEpisode(currentEpisode - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, isTheaterMode, playbackSpeed, currentEpisode, totalEpisodes]);

  // Resume Playback - Save position to database
  const userId = user?.id;

  // Load saved position from database
  useEffect(() => {
    const loadProgress = async () => {
      if (!id || !currentEpisode || !userId) return;
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/watch-progress/${id}/${currentEpisode}?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.currentTime > 5 && videoRef.current && duration > 0 && data.currentTime < duration - 10) {
            videoRef.current.currentTime = data.currentTime;
            console.log('[Watch] Resumed from', formatTime(data.currentTime));
          }
        }
      } catch (err) {
        console.warn('[Watch] Failed to load progress from DB');
      }
    };
    if (videoUrl && duration > 0) {
      loadProgress();
    }
  }, [videoUrl, duration, id, currentEpisode, userId]);

  // Save progress periodically to database
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (videoRef.current && currentTime > 5 && id && currentEpisode && userId) {
        try {
          await apiFetch(`${BACKEND_URL}/api/watch-progress/${id}/${currentEpisode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentTime,
              duration,
              completed: false
            })
          });
        } catch (err) {
          console.warn('[Watch] Failed to save progress to DB');
        }
      }
    }, 10000); // Save every 10 seconds
    return () => clearInterval(saveInterval);
  }, [currentTime, duration, id, currentEpisode, userId]);

  // Buffer Progress Tracking
  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / duration) * 100);
    }
  };

  // Show Skip Intro button (first 120 seconds)
  useEffect(() => {
    if (currentTime >= 5 && currentTime <= 120) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }
  }, [currentTime]);

  // Skip Intro function
  const skipIntro = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 85; // Skip to 1:25
      setShowSkipIntro(false);
    }
  };

  // Handle Video End - Auto Next Episode
  const handleVideoEnd = async () => {
    // Mark as completed in database
    if (id && currentEpisode && userId) {
      try {
        await apiFetch(`${BACKEND_URL}/api/watch-progress/${id}/${currentEpisode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentTime: duration,
            duration,
            completed: true
          })
        });
      } catch (err) {
        console.warn('[Watch] Failed to mark as completed');
      }
    }

    if (autoNextEnabled && currentEpisode < totalEpisodes) {
      console.log('[Watch] Auto-playing next episode');
      goToEpisode(currentEpisode + 1);
    } else if (isLooping) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  // Screenshot function
  const takeScreenshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Download the screenshot
      const link = document.createElement('a');
      link.download = `${anime?.title || 'anime'}_ep${currentEpisode}_${formatTime(currentTime).replace(':', '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
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

  return (
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
          <div className={isTheaterMode ? 'w-full' : 'lg:col-span-3'}>
            <div className="relative bg-black rounded-xl overflow-hidden">
              {/* Back Button */}
              <Link
                to={`/anime/${id}`}
                className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white/70 hover:text-white transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </Link>

              {/* Video Container */}
              <div
                ref={videoContainerRef}
                className="relative aspect-video bg-black overflow-hidden flex items-center justify-center"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
                onDoubleClick={handleDoubleClick}
                style={{ filter: `brightness(${brightness}%)` }}
              >

                {/* Video Render */}
                {videoUrl && (videoUrl.startsWith('http') || videoUrl.startsWith('//')) ? (
                  isEmbed ? (
                    <iframe
                      src={videoUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={togglePlay}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onProgress={handleProgress}
                      onEnded={handleVideoEnd}
                      onCanPlay={() => {}}
                      onError={(e) => {
                        const video = e.target as HTMLVideoElement;
                        console.error('[Watch] Video Error:', video.error?.message, video.error?.code);
                        setVideoError(`Video tidak dapat diputar: ${video.error?.message || 'Unknown error'}`);
                      }}
                      poster={anime.banner || anime.poster}
                      key={videoUrl}
                      src={videoUrl}
                      autoPlay={isPlaying}
                      playsInline
                      // @ts-ignore - webkit attribute for iOS Safari
                      webkit-playsinline="true"
                      x-webkit-airplay="allow"
                      loop={isLooping}
                      crossOrigin="anonymous"
                    >
                      {subtitleUrl && (
                        <track
                          kind="subtitles"
                          label="Subtitle"
                          srcLang="id"
                          src={subtitleUrl}
                          default
                        />
                      )}
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {!videoError && !isLoadingVideo && (
                      <div className="w-12 h-12 border-4 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
                    )}
                    <p className="text-white/40 text-sm">
                      {videoError ? videoError : "Menyiapkan aliran video..."}
                    </p>
                  </div>
                )}

                {/* Loading Overlay */}
                {isLoadingVideo && videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {/* Big Play Button */}
                {!isPlaying && !isLoadingVideo && videoUrl && !isEmbed && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <button
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-full bg-[#6C5DD3]/90 flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto"
                    >
                      <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </button>
                  </div>
                )}

                {/* Controls Overlay */}
                {!isEmbed && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 pointer-events-none ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium text-sm">{anime.title}</span>
                        <span className="text-white/50 text-sm">EP {currentEpisode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-white/70 hover:text-white transition-colors">
                          <Flag className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-white/70 hover:text-white transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                      {/* Skip Intro Button */}
                      {showSkipIntro && (
                        <button
                          onClick={skipIntro}
                          className="absolute -top-12 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-black font-medium rounded-lg hover:bg-white transition-all animate-pulse"
                        >
                          <FastForward className="w-4 h-4" />
                          Skip Intro
                        </button>
                      )}

                      {/* Progress Bar with Buffer */}
                      <div className="mb-3 relative h-1.5 group">
                        {/* Buffer Progress (background) */}
                        <div
                          className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all"
                          style={{ width: `${buffered}%` }}
                        />
                        {/* Current Progress (foreground) */}
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="absolute top-0 left-0 w-full h-full bg-transparent rounded-full appearance-none cursor-pointer [&::-webkit-slider-runnable-track]:bg-white/20 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#6C5DD3] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:mt-[-3px] group-hover:[&::-webkit-slider-thumb]:scale-125"
                          style={{
                            background: `linear-gradient(to right, #6C5DD3 0%, #6C5DD3 ${(currentTime / (duration || 100)) * 100}%, transparent ${(currentTime / (duration || 100)) * 100}%)`
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button onClick={togglePlay} className="text-white hover:text-[#6C5DD3] transition-colors p-1">
                            {isPlaying ? <Pause className="w-5 h-5 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-5 h-5 sm:w-5 sm:h-5 fill-current" />}
                          </button>
                          <button onClick={() => goToEpisode(currentEpisode - 1)} disabled={currentEpisode <= 1} className="text-white hover:text-[#6C5DD3] transition-colors disabled:opacity-30 p-1">
                            <SkipBack className="w-4 h-4" />
                          </button>
                          <button onClick={() => goToEpisode(currentEpisode + 1)} disabled={currentEpisode >= totalEpisodes} className="text-white hover:text-[#6C5DD3] transition-colors disabled:opacity-30 p-1">
                            <SkipForward className="w-4 h-4" />
                          </button>

                          {/* Volume - hidden on mobile */}
                          <div className="hidden sm:flex items-center gap-2">
                            <button onClick={toggleMute} className="text-white hover:text-[#6C5DD3] transition-colors">
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input type="range" min={0} max={1} step={0.1} value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 bg-white/20 rounded-full cursor-pointer" />
                          </div>
                          <span className="text-white text-[10px] sm:text-xs whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {/* Playback Speed - always visible */}
                          <button
                            onClick={changePlaybackSpeed}
                            className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                            title="Playback Speed (S)"
                          >
                            {playbackSpeed}x
                          </button>

                          {/* Brightness Control - hidden on mobile */}
                          <div className="relative group hidden sm:block">
                            <button className="p-1.5 text-white hover:text-[#6C5DD3] transition-colors" title="Brightness">
                              <Sun className="w-4 h-4" />
                            </button>
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
                                      onClick={() => {
                                        // Find stream with this quality
                                        const stream = allDirectStreams.find(s => s.quality === quality);
                                        if (stream) {
                                          setSelectedQuality(quality);
                                          setVideoUrl(stream.url);
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

                          {/* Fullscreen - always visible */}
                          <button
                            onClick={toggleFullscreen}
                            className="p-1.5 text-white hover:text-[#6C5DD3] transition-colors"
                            title="Fullscreen (F)"
                          >
                            <Maximize className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                      to={`/watch/${anime.id}/${epNum}`}
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
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">{anime.title} - Episode {currentEpisode}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm mb-6">
            <span className="px-3 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] rounded-full font-medium">{anime.studio}</span>
            <span className="px-2 py-1 bg-white/5 text-white/60 rounded-full">{anime.releasedYear}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span className="text-white/50">Episode {currentEpisode} / {totalEpisodes}</span>
          </div>

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

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => goToEpisode(currentEpisode - 1)} disabled={currentEpisode <= 1} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-white/70 hover:bg-white/10 disabled:opacity-30 text-sm"><ChevronLeftIcon className="w-4 h-4" />Prev</button>
            <button onClick={() => goToEpisode(currentEpisode + 1)} disabled={currentEpisode >= totalEpisodes} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-white/70 hover:bg-white/10 disabled:opacity-30 text-sm">Next<ChevronRight className="w-4 h-4" /></button>
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
    </main>
  );
}

