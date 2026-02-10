import { useState, useEffect, useRef, useCallback } from 'react';
import type { SkipTimes } from '@/services/aniskip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  PictureInPicture2,
  Sun,
  Repeat,
  FastForward,
  Users,
  Share2,
  ChevronLeft,
  MonitorPlay,
  Loader2
} from 'lucide-react';

// Types
interface Chapter {
  time: number;
  label: string;
  color?: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  poster?: string;
  title: string;
  episode: number;
  animeId: string;
  isEmbed?: boolean;
  subtitleUrl?: string;
  onEnded?: () => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  onBack?: () => void;
  onNobar?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  availableQualities?: string[];
  selectedQuality?: string;
  onQualityChange?: (quality: string) => void;
  resumeFrom?: number; // Resume from specific time (seconds)
  onSaveProgress?: (time: number) => void; // Callback to save progress
  chapters?: Chapter[]; // Array of chapter markers
  introEndTime?: number; // When intro ends (for skip intro button)
  skipTimes?: SkipTimes | null; // AniSkip data for auto-detected intro/outro
}

// Local storage key for video progress
const getProgressKey = (animeId: string, episode: number) => `video-progress-${animeId}-${episode}`;

// Utility functions
const formatTime = (time: number): string => {
  if (!isFinite(time) || time < 0) return '0:00';
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({
  videoUrl,
  poster,
  title,
  episode,
  animeId,
  isEmbed = false,
  subtitleUrl,
  onEnded,
  onTimeUpdate,
  onPlay,
  onPause,
  autoPlay = false,
  onBack,
  onNobar,
  onShare,
  onReport,
  availableQualities = [],
  selectedQuality,
  onQualityChange,
  resumeFrom,
  onSaveProgress,
  chapters = [],
  introEndTime = 85,
  skipTimes
}: VideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressSaveIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [_isPiP, setIsPiP] = useState(false);
  
  // Resume State
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  
  // UI State
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showBrightness, setShowBrightness] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  
  // Progress bar hover state
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Touch gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [gestureIndicator, setGestureIndicator] = useState<{ type: 'seek' | 'volume' | 'brightness'; value: string; visible: boolean }>({ type: 'seek', value: '', visible: false });
  const [startVolume, setStartVolume] = useState(1);
  const [startBrightness, setStartBrightness] = useState(100);
  const [lastTouchTap, setLastTouchTap] = useState<{ time: number; x: number } | null>(null);

  // Update loading state and reset playback when videoUrl changes
  useEffect(() => {
    if (videoUrl) {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Check for saved progress (show if > 30s watched)
      const savedTime = resumeFrom ?? parseFloat(localStorage.getItem(getProgressKey(animeId, episode)) || '0');
      if (savedTime > 30) { // Only resume if >30s watched
        setResumeTime(savedTime);
        setShowResumePrompt(true);
      }
    } else {
      setIsLoading(false);
    }
  }, [videoUrl, animeId, episode, resumeFrom]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;
    
    progressSaveIntervalRef.current = setInterval(() => {
      const time = videoRef.current?.currentTime || 0;
      if (time > 0) {
        localStorage.setItem(getProgressKey(animeId, episode), time.toString());
        onSaveProgress?.(time);
      }
    }, 5000);
    
    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [isPlaying, animeId, episode, onSaveProgress]);

  // Close quality selector when clicking outside
  useEffect(() => {
    if (!showQualitySelector) return;
    
    const handleClickOutside = () => {
      setShowQualitySelector(false);
    };
    
    // Delay to allow click event to process
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, { once: true });
    }, 100);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showQualitySelector]);

  // Keyboard shortcuts
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback for iOS
      const video = videoRef.current as any;
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {
      // PiP not supported
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  }, [duration]);

  const skipIntro = useCallback(() => {
    if (!videoRef.current) return;
    // Use AniSkip end time if available, otherwise fallback
    const skipTo = skipTimes?.op?.endTime ?? introEndTime;
    videoRef.current.currentTime = skipTo;
    setShowSkipIntro(false);
  }, [skipTimes, introEndTime]);

  const changePlaybackSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    setPlaybackSpeed(nextSpeed);
  }, [playbackSpeed]);

  // Event Handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
      
      // Show skip intro button based on AniSkip data or fallback
      const introStart = skipTimes?.op?.startTime ?? 0;
      const introEnd = skipTimes?.op?.endTime ?? introEndTime;
      
      if (video.currentTime >= introStart + 5 && video.currentTime <= introEnd) {
        setShowSkipIntro(true);
      } else {
        setShowSkipIntro(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      onEnded?.();
    };

    const handleError = () => {
      setError('Gagal memuat video. Silakan refresh halaman.');
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onPlay, onPause, onTimeUpdate, onEnded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 's':
          e.preventDefault();
          changePlaybackSpeed();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, handleVolumeChange, volume, toggleMute, toggleFullscreen, togglePiP, changePlaybackSpeed]);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (isEmbed) {
    return (
      <div 
        className="relative w-full bg-black lg:rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        <iframe
          src={videoUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchStartTime(Date.now());
    setStartVolume(volume);
    setStartBrightness(brightness);
  }, [volume, brightness]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !containerRef.current || !videoRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touchStart.y - touch.clientY; // Inverted for natural feel
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    
    const touchX = touchStart.x / containerWidth;
    
    // Determine gesture type based on dominant direction and touch position
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      // Horizontal swipe - Seek
      const seekAmount = (deltaX / containerWidth) * duration * 0.5; // 0.5x sensitivity
      const newTime = Math.max(0, Math.min(duration, currentTime + seekAmount));
      
      setGestureIndicator({
        type: 'seek',
        value: `${formatTime(newTime)}`,
        visible: true
      });
    } else if (Math.abs(deltaY) > 20) {
      if (touchX < 0.5) {
        // Left side - Brightness
        const brightnessDelta = (deltaY / containerHeight) * 100;
        const newBrightness = Math.max(50, Math.min(150, startBrightness + brightnessDelta));
        setBrightness(newBrightness);
        
        setGestureIndicator({
          type: 'brightness',
          value: `${Math.round(newBrightness)}%`,
          visible: true
        });
      } else {
        // Right side - Volume
        const volumeDelta = deltaY / containerHeight;
        const newVolume = Math.max(0, Math.min(1, startVolume + volumeDelta));
        handleVolumeChange(newVolume);
        
        setGestureIndicator({
          type: 'volume',
          value: `${Math.round(newVolume * 100)}%`,
          visible: true
        });
      }
    }
  }, [touchStart, duration, currentTime, startVolume, startBrightness, handleVolumeChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !videoRef.current || !containerRef.current) return;
    
    const touch = e.changedTouches[0];
    const touchDuration = Date.now() - touchStartTime;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const relativeX = (touch.clientX - rect.left) / rect.width;
    const side = relativeX < 0.5 ? 'left' : 'right';
    
    // Hide gesture indicator after delay
    setTimeout(() => setGestureIndicator(prev => ({ ...prev, visible: false })), 500);
    
    // Check if it's a tap (not swipe)
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    if (deltaX < 20 && deltaY < 20 && touchDuration < 300) {
      // It's a tap - check for double tap
      const now = Date.now();
      if (lastTouchTap && now - lastTouchTap.time < 300 && Math.abs(touch.clientX - lastTouchTap.x) < 50) {
        // Double tap - skip
        skip(side === 'left' ? -10 : 10);
        setGestureIndicator({
          type: 'seek',
          value: side === 'left' ? '-10s' : '+10s',
          visible: true
        });
        setTimeout(() => setGestureIndicator(prev => ({ ...prev, visible: false })), 800);
        setLastTouchTap(null);
      } else {
        // Single tap - toggle play
        setLastTouchTap({ time: now, x: touch.clientX });
        setTimeout(() => {
          setLastTouchTap(prev => {
            if (prev?.time === now) {
              togglePlay();
              return null;
            }
            return prev;
          });
        }, 300);
      }
    }
    
    setTouchStart(null);
  }, [touchStart, touchStartTime, lastTouchTap, skip, togglePlay]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black lg:rounded-xl overflow-hidden group select-none touch-none"
      style={{ 
        filter: `brightness(${brightness}%)`,
        aspectRatio: '16/9'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Element - only render when videoUrl is available */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          autoPlay={autoPlay}
          playsInline
          loop={isLooping}
          crossOrigin="anonymous"
        >
          {subtitleUrl && (
            <track kind="subtitles" src={subtitleUrl} srcLang="id" label="Indonesia" default />
          )}
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          {poster ? (
            <img src={poster} alt={title} className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#6C5DD3] animate-spin" />
              <p className="text-white/70 text-sm">Memuat video...</p>
            </div>
          )}
        </div>
      )}

      {/* Gesture Indicator */}
      <AnimatePresence>
        {gestureIndicator.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2 px-6 py-4 bg-black/70 backdrop-blur-sm rounded-2xl">
              {gestureIndicator.type === 'seek' && <SkipForward className="w-8 h-8 text-white" />}
              {gestureIndicator.type === 'volume' && (
                volume === 0 ? <VolumeX className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />
              )}
              {gestureIndicator.type === 'brightness' && <Sun className="w-8 h-8 text-white" />}
              <span className="text-white font-medium text-lg">{gestureIndicator.value}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 z-30"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#6C5DD3] animate-spin" />
              <p className="text-white/70 text-sm">Memuat video...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-40"
          >
            <div className="text-center px-6">
              <MonitorPlay className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#6C5DD3] hover:bg-[#5a4ec0] text-white rounded-lg text-sm transition-colors"
              >
                Refresh Halaman
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Prompt */}
      <AnimatePresence>
        {showResumePrompt && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-[#1A1A2E]/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl">
              <span className="text-white/80 text-sm">
                Lanjutkan dari <span className="text-[#6C5DD3] font-medium">{formatTime(resumeTime)}</span>?
              </span>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = resumeTime;
                    videoRef.current.play().catch(() => {});
                  }
                  setShowResumePrompt(false);
                }}
                className="px-3 py-1.5 bg-[#6C5DD3] hover:bg-[#5a4ec0] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Lanjutkan
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(getProgressKey(animeId, episode));
                  setShowResumePrompt(false);
                }}
                className="px-3 py-1.5 text-white/60 hover:text-white text-xs transition-colors"
              >
                Dari Awal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Play Button (Center) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && !error && !showResumePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-[#6C5DD3] flex items-center justify-center pointer-events-auto shadow-2xl shadow-[#6C5DD3]/30"
            >
              <Play className="w-10 h-10 text-white fill-current ml-1" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Intro Button */}
      <AnimatePresence>
        {showSkipIntro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={skipIntro}
            className="absolute top-20 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-white/95 hover:bg-white text-black font-semibold rounded-lg shadow-lg transition-all"
          >
            <FastForward className="w-4 h-4" />
            <span className="text-sm">Lewati Intro</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/60 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Kembali</span>
            </button>
            <div className="hidden sm:block">
              <h3 className="text-white font-medium text-sm truncate max-w-xs">{title}</h3>
              <p className="text-white/50 text-xs">Episode {episode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNobar}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#6C5DD3]/80 hover:bg-[#6C5DD3] text-white rounded-lg text-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Nobar</span>
            </button>
            <button
              onClick={onShare}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onReport}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <MonitorPlay className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="group mb-4">
            <div 
              ref={progressBarRef}
              className="relative h-1.5 bg-white/20 rounded-full cursor-pointer overflow-visible"
              onMouseMove={(e) => {
                if (!progressBarRef.current || !duration) return;
                const rect = progressBarRef.current.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const time = Math.max(0, Math.min(duration, pos * duration));
                setHoverTime(time);
                setHoverPosition(pos * 100);
                setIsHoveringProgress(true);
              }}
              onMouseLeave={() => setIsHoveringProgress(false)}
              onClick={(e) => {
                if (!progressBarRef.current || !duration || !videoRef.current) return;
                const rect = progressBarRef.current.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const time = Math.max(0, Math.min(duration, pos * duration));
                videoRef.current.currentTime = time;
              }}
            >
              {/* Buffer */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all duration-300"
                style={{ width: `${buffered}%` }}
              />
              {/* Progress */}
              <motion.div
                className="absolute top-0 left-0 h-full bg-[#6C5DD3] rounded-full"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
              {/* Hover Preview Line */}
              {isHoveringProgress && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-white/80 z-10"
                  style={{ left: `${hoverPosition}%` }}
                />
              )}
              {/* Hover Tooltip */}
              {isHoveringProgress && (
                <div
                  className="absolute -top-10 transform -translate-x-1/2 bg-[#1A1A2E] border border-white/10 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20"
                  style={{ left: `${hoverPosition}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#6C5DD3] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
              />
              
              {/* Chapter Markers */}
              {chapters.map((chapter, index) => {
                const position = (chapter.time / (duration || 1)) * 100;
                return (
                  <div
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 cursor-pointer group/marker z-10 hover:scale-125 transition-transform rounded-full"
                    style={{ left: `${position}%`, backgroundColor: chapter.color || '#FFD700' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        videoRef.current.currentTime = chapter.time;
                      }
                    }}
                  >
                    {/* Chapter Dot - Small indicator */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full opacity-0 group-hover/marker:opacity-100 transition-opacity"
                      style={{ backgroundColor: chapter.color || '#FFD700' }}
                    />
                    {/* Chapter Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-30">
                      <div className="bg-[#1A1A2E] border border-white/20 px-3 py-1.5 rounded-lg text-xs text-white whitespace-nowrap shadow-xl">
                        <span className="font-medium">{chapter.label}</span>
                        <span className="text-white/60 ml-1">({formatTime(chapter.time)})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between mt-1.5 text-xs text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={togglePlay}
                className="p-2.5 text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>

              <button
                onClick={() => skip(-10)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => skip(10)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Playback Speed */}
              <button
                onClick={changePlaybackSpeed}
                className="px-2 py-1 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-all min-w-[40px]"
              >
                {playbackSpeed}x
              </button>

              {/* Quality Selector */}
              {availableQualities.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualitySelector(!showQualitySelector);
                    }}
                    className="px-2 py-1 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-all min-w-[50px] cursor-pointer"
                    title={`Available: ${availableQualities.join(', ')}`}
                  >
                    {selectedQuality || 'Auto'}
                  </button>
                  {showQualitySelector && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 py-1 bg-[#1A1A2E] border border-white/10 rounded-lg shadow-xl min-w-[80px] z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {availableQualities.map((quality) => (
                        <button
                          key={quality}
                          onClick={() => {
                            onQualityChange?.(quality);
                            setShowQualitySelector(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                            selectedQuality === quality
                              ? 'text-[#6C5DD3] bg-[#6C5DD3]/10'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Brightness */}
              <div className="relative">
                <button
                  onClick={() => setShowBrightness(!showBrightness)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <Sun className="w-4 h-4" />
                </button>
                {showBrightness && (
                  <div className="absolute bottom-full right-0 mb-2 p-3 bg-[#1A1A2E] border border-white/10 rounded-lg shadow-xl">
                    <div className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-white/50" />
                      <input
                        type="range"
                        min={50}
                        max={150}
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-24 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#6C5DD3] [&::-webkit-slider-thumb]:rounded-full"
                      />
                      <span className="text-xs text-white w-8">{brightness}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Loop */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 rounded-lg transition-all ${isLooping ? 'text-[#6C5DD3] bg-[#6C5DD3]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* PiP */}
              <button
                onClick={togglePiP}
                className="hidden sm:block p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Clickable overlay for toggling controls */}
      <div
        className="absolute inset-0 z-0"
        onClick={(e) => {
          // Only toggle play if clicking on empty area (not on controls)
          if (e.target === e.currentTarget) {
            togglePlay();
          }
        }}
      />
    </div>
  );
}
