import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react';
import { BACKEND_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';

interface WatchPartyVideoPlayerProps {
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isHost: boolean;
  isPlaying?: boolean;
  currentTime?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
}

// Helper to generate signed URL for video
async function getSignedVideoUrl(videoUrl: string, animeId: string, episode: number): Promise<string> {
  try {
    const tokenRes = await apiFetch(`${BACKEND_URL}/api/anime/video-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, animeId, episode })
    });
    
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      return tokenData.signedUrl || videoUrl;
    }
  } catch (err) {
    console.error('[getSignedVideoUrl] Failed:', err);
  }
  return videoUrl;
}

export default function WatchPartyVideoPlayer({
  animeId,
  animeTitle,
  episodeNumber,
  videoRef,
  isHost,
  isPlaying: syncIsPlaying,
  currentTime: syncCurrentTime,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
}: WatchPartyVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch video URL
  useEffect(() => {
    const fetchVideo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiFetch(
          `${BACKEND_URL}/api/anime/stream/${encodeURIComponent(animeTitle)}/${episodeNumber}?server=server1`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal mengambil video');
        }

        const data = await response.json();

        if (!data.streams || data.streams.length === 0) {
          throw new Error('Video tidak tersedia');
        }

        const directStreams = data.streams.filter((s: any) => s.type === 'direct');
        
        if (directStreams.length > 0) {
          const qualities = directStreams
            .map((s: any) => s.quality)
            .filter((q: string) => q)
            .sort((a: string, b: string) => {
              const numA = parseInt(a.replace('p', '')) || 0;
              const numB = parseInt(b.replace('p', '')) || 0;
              return numB - numA;
            });
          
          setAvailableQualities([...new Set(qualities)] as string[]);
          
          const targetQuality = selectedQuality || qualities[0] || '';
          const selectedStream = directStreams.find((s: any) => s.quality === targetQuality) || directStreams[0];
          
          if (!selectedQuality && selectedStream.quality) {
            setSelectedQuality(selectedStream.quality);
          }

          const signedUrl = await getSignedVideoUrl(selectedStream.url, animeId, episodeNumber);
          setVideoUrl(signedUrl);
        } else {
          throw new Error('Video tidak tersedia');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [animeId, animeTitle, episodeNumber, selectedQuality]);

  // Sync video state from host (for participants)
  useEffect(() => {
    if (isHost || !videoRef.current) return;
    
    const video = videoRef.current;
    
    // Sync play/pause
    if (syncIsPlaying !== undefined) {
      if (syncIsPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!syncIsPlaying && !video.paused) {
        video.pause();
      }
    }
    
    // Sync time (with buffer check)
    if (syncCurrentTime !== undefined) {
      const timeDiff = Math.abs(video.currentTime - syncCurrentTime);
      // Sync if difference > 3 seconds or if video just started playing
      if (timeDiff > 3 || (syncIsPlaying && video.paused)) {
        console.log('[WatchPartyVideoPlayer] Syncing time:', syncCurrentTime, 'current:', video.currentTime, 'diff:', timeDiff);
        video.currentTime = syncCurrentTime;
      }
    }
  }, [syncIsPlaying, syncCurrentTime, isHost, videoRef]);

  // Video event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  }, [videoRef, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [videoRef]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onSeek?.(time);
    }
  }, [videoRef, onSeek]);

  // Controls handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white/60">
          <p className="text-lg mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full w-auto h-auto"
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={isHost ? togglePlay : undefined}
            style={{ pointerEvents: isHost ? 'auto' : 'none' }}
          />

          {/* Non-host indicator */}
          {!isHost && (
            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg">
              <span className="text-white/60 text-sm">👑 Host controls video</span>
            </div>
          )}

          {/* Controls Overlay - only for host */}
          {isHost && (
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Bar - Quality */}
            <div className="absolute top-4 right-4">
              {availableQualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-lg text-white text-sm hover:bg-black/70"
                  >
                    <Settings className="w-4 h-4" />
                    {selectedQuality || 'Auto'}
                  </button>
                  
                  {showQualityMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-black/90 rounded-lg overflow-hidden min-w-[100px]">
                      {availableQualities.map((quality) => (
                        <button
                          key={quality}
                          onClick={() => {
                            setSelectedQuality(quality);
                            setShowQualityMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${
                            selectedQuality === quality ? 'text-[#6C5DD3]' : 'text-white'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#6C5DD3]/90 rounded-full flex items-center justify-center hover:bg-[#6C5DD3] transition-colors"
              >
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
              </button>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#6C5DD3] [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="text-white hover:text-[#6C5DD3]">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  
                  <button className="text-white/60 hover:text-white">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button className="text-white/60 hover:text-white">
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button onClick={toggleMute} className="text-white hover:text-[#6C5DD3]">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>

                  <span className="text-white/60 text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <button onClick={toggleFullscreen} className="text-white hover:text-[#6C5DD3]">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}
