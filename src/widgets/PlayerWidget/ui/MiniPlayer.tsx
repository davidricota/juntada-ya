"use client";

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import { PlaylistItem } from "@/app/types";
import { usePlayer } from "@/app/providers/PlayerContext";

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
}

interface MiniPlayerProps {
  currentVideo: PlaylistItem;
  player: YouTubePlayer | null;
  onPrevious: () => void;
  onNext: () => void;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onSeek: (value: number) => void;
}

export default function MiniPlayer({
  currentVideo,
  player,
  onPrevious,
  onNext,
  isPlaying,
  progress,
  duration,
  onSeek,
}: MiniPlayerProps) {
  const { setIsPlaying, volume, setVolume, isMuted, setIsMuted } = usePlayer();

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume * 100);
    }
    if (newVolume === 0) {
      setIsMuted(true);
      if (player) player.mute();
    } else {
      setIsMuted(false);
      if (player) player.unMute();
    }
  };

  const handleMuteToggle = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-800/90 backdrop-blur-md border-t border-zinc-700/50 p-2 z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <img
            src={
              currentVideo.thumbnail_url ||
              `https://img.youtube.com/vi/${currentVideo.youtube_video_id}/default.jpg`
            }
            alt={currentVideo.title}
            className="w-12 h-12 rounded-md object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white truncate max-w-[150px] md:max-w-[200px]">
              {currentVideo.title}
            </span>
            <span className="text-xs text-zinc-400">{currentVideo.channel_title}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => onPrevious()}
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => handlePlayPause()}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => onNext()}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
              onClick={() => handleMuteToggle()}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <span className="text-xs text-zinc-400">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              min={0}
              max={duration || 1}
              step={1}
              onValueChange={(value) => onSeek(value[0])}
              className="w-32"
            />
            <span className="text-xs text-zinc-400">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
