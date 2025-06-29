"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MusicVisualization from "@/components/music-visualization";
import { usePlayer } from "@/contexts/PlayerContext";

// YouTube API types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string | HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerOptions {
  height: string;
  width: string;
  videoId: string;
  playerVars: {
    autoplay: number;
    controls: number;
    rel: number;
    showinfo: number;
    modestbranding: number;
    iv_load_policy: number;
  };
  events: {
    onReady: (event: YouTubePlayerEvent) => void;
    onStateChange: (event: YouTubePlayerEvent) => void;
    onError: (event: YouTubeErrorEvent) => void;
  };
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getVideoData: () => { video_id: string } | null;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

interface YouTubeErrorEvent {
  data: number;
}

interface VideoItem {
  id: string;
  youtube_video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  added_by_participant_id: string;
  added_at: string;
  participant_name?: string;
  event_id: string;
}

interface YouTubePlayerProps {
  playlistItems: VideoItem[];
  initialVideoIndex?: number;
  onPlayerReady?: (player: YouTubePlayer) => void;
  onVideoChange?: (index: number) => void;
}

export default function YouTubePlayer({
  playlistItems,
  initialVideoIndex = 0,
  onPlayerReady,
  onVideoChange,
}: YouTubePlayerProps) {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isVisualizationActive, setIsVisualizationActive] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const {
    setCurrentVideo,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    duration,
    setDuration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
  } = usePlayer();

  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);

  const currentVideo = playlistItems[currentVideoIndex] || {
    id: "",
    youtube_video_id: "",
    title: "No video available",
    channel_title: null,
    thumbnail_url: null,
    added_by_participant_id: "",
    added_at: "",
    event_id: "",
  };

  // Update context when video changes
  useEffect(() => {
    setCurrentVideo(currentVideo);
  }, [currentVideo, setCurrentVideo]);

  // Load YouTube API
  useEffect(() => {
    let isMounted = true;

    const loadYouTubeAPI = async () => {
      try {
        if (!window.YT) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

          await new Promise((resolve) => {
            window.onYouTubeIframeAPIReady = resolve;
          });
        }

        if (!isMounted) return;

        if (playerRef.current) {
          playerRef.current.destroy();
        }

        const player = new window.YT.Player(playerContainerRef.current, {
          height: "100%",
          width: "100%",
          videoId: playlistItems[initialVideoIndex].youtube_video_id,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              playerRef.current = event.target;
              setIsPlayerReady(true);
              setDuration(event.target.getDuration());
              onPlayerReady?.(event.target);
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              const playerState = event.data;

              // Update playing state
              setIsPlaying(playerState === window.YT.PlayerState.PLAYING);
              setIsBuffering(playerState === window.YT.PlayerState.BUFFERING);

              // Update visualization state
              setIsVisualizationActive(playerState === window.YT.PlayerState.PLAYING);

              // Handle video end
              if (playerState === window.YT.PlayerState.ENDED) {
                if (isRepeatEnabled) {
                  // If repeat is enabled, restart the current video
                  if (playerRef.current) {
                    playerRef.current.seekTo(0, true);
                    playerRef.current.playVideo();
                  }
                } else {
                  // If not the last video, play next
                  if (currentVideoIndex < playlistItems.length - 1) {
                    const nextIndex = currentVideoIndex + 1;
                    setCurrentVideoIndex(nextIndex);
                    onVideoChange?.(nextIndex);
                  } else {
                    // If it's the last video, stop
                    setIsPlaying(false);
                  }
                }
              }

              // Update duration when it becomes available
              if (playerState === window.YT.PlayerState.PLAYING) {
                const newDuration = playerRef.current?.getDuration() || 30;
                setDuration(newDuration);
              }
            },
            onError: () => {
              if (!isMounted) return;
              setError("Error playing video");

              // Try to play next video on error
              setTimeout(() => {
                handleNext();
              }, 3000);
            },
          },
        });

        playerRef.current = player;
      } catch (error) {
        if (!isMounted) return;
        setError("Failed to initialize YouTube player");
      }
    };

    loadYouTubeAPI();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          // Ignorar errores al destruir el player
        }
        playerRef.current = null;
      }
    };
  }, [playlistItems, initialVideoIndex, onPlayerReady, onVideoChange, isRepeatEnabled]);

  // Load new video when currentVideoIndex changes
  useEffect(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.loadVideoById === "function" &&
      playlistItems.length > 0
    ) {
      const videoId = playlistItems[currentVideoIndex]?.youtube_video_id;
      if (videoId) {
        try {
          playerRef.current.loadVideoById(videoId);
          // Add a small delay before playing to ensure the video is loaded
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          }, 100);
          setError(null);
        } catch (err) {
          setError("Failed to load video");
        }
      }
    }
  }, [currentVideoIndex, playlistItems]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {
      setError("Failed to control playback");
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentVideoIndex === 0 ? playlistItems.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
    onVideoChange?.(prevIndex);
  };

  const handleNext = () => {
    const nextIndex = currentVideoIndex === playlistItems.length - 1 ? 0 : currentVideoIndex + 1;
    setCurrentVideoIndex(nextIndex);
    onVideoChange?.(nextIndex);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100);
    }

    if (newVolume === 0) {
      setIsMuted(true);
      if (playerRef.current) playerRef.current.mute();
    } else {
      setIsMuted(false);
      if (playerRef.current) playerRef.current.unMute();
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);

    if (playerRef.current) {
      playerRef.current.seekTo(newProgress, true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Update currentVideoIndex when initialVideoIndex changes
  useEffect(() => {
    setCurrentVideoIndex(initialVideoIndex);
  }, [initialVideoIndex]);

  if (playlistItems.length === 0) {
    return (
      <div className="w-full max-w-md bg-zinc-800/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold">No videos available</h2>
        <p className="text-zinc-400 mt-2">Please add videos to your playlist</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-800/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
      {error && (
        <Alert
          variant="destructive"
          className="rounded-none border-x-0 border-t-0 border-b border-red-500/50"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        {/* Hidden YouTube player container */}
        <div ref={playerContainerRef} className="hidden" />

        <div className="aspect-video overflow-hidden bg-zinc-900 relative">
          <img
            src={
              currentVideo.thumbnail_url ||
              `https://img.youtube.com/vi/${currentVideo.youtube_video_id}/maxresdefault.jpg`
            }
            alt={`${currentVideo.title} thumbnail`}
            className={cn(
              "w-full h-full object-cover transition-all duration-1000",
              isPlaying ? "scale-105" : "scale-100"
            )}
            onError={(e) => {
              // Fallback to a lower quality thumbnail if maxresdefault fails
              const target = e.target as HTMLImageElement;
              target.src = `https://img.youtube.com/vi/${currentVideo.youtube_video_id}/hqdefault.jpg`;
            }}
          />

          {isVisualizationActive && (
            <div className="absolute inset-0 z-10">
              <MusicVisualization />
            </div>
          )}

          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent",
              isPlaying ? "opacity-70" : "opacity-90",
              "transition-opacity duration-1000"
            )}
          ></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-white text-xl font-bold truncate">{currentVideo.title}</h2>
          <p className="text-zinc-400 truncate">{currentVideo.channel_title}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Slider
            value={[progress]}
            min={0}
            max={duration || 1}
            step={1}
            onValueChange={handleProgressChange}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-700"
          >
            <Shuffle className="h-5 w-5" />
            <span className="sr-only">Shuffle</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-700"
              onClick={handlePrevious}
            >
              <SkipBack className="h-6 w-6" />
              <span className="sr-only">Previous</span>
            </Button>

            <Button
              variant="default"
              size="icon"
              className={cn(
                "rounded-full h-12 w-12 bg-red-500 hover:bg-red-600 text-white",
                "transition-all duration-300 ease-out transform hover:scale-105",
                isPlaying && "animate-pulse"
              )}
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-700"
              onClick={handleNext}
            >
              <SkipForward className="h-6 w-6" />
              <span className="sr-only">Next</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-zinc-400 hover:text-white hover:bg-zinc-700",
              isRepeatEnabled && "text-red-500"
            )}
            onClick={() => setIsRepeatEnabled(!isRepeatEnabled)}
          >
            <Repeat className="h-5 w-5" />
            <span className="sr-only">Repeat</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-700"
            onClick={handleMuteToggle}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
          </Button>

          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
