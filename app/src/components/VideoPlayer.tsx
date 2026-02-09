import { useState, useEffect, useRef, useCallback } from 'react';
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
  Settings,
  PictureInPicture2,
  Sun,
  Repeat,
  FastForward,
  Film,
  Users,
  Share2,
  ChevronLeft,
  MonitorPlay,
  Loader2
} from 'lucide-react';

// Types
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
}

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
  onReport
}: VideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  
  // UI State
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);

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
    videoRef.current.currentTime = 85; // Skip to 1:25
    setShowSkipIntro(false);
  }, []);

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
      
      // Show skip intro button (5-120 seconds)
      if (video.currentTime >= 5 && video.currentTime <= 120) {
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
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={videoUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Video Element */}
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

      {/* Big Play Button (Center) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && !error && (
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
            <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden">
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
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#6C5DD3] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
              />
              {/* Seek Input */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
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
