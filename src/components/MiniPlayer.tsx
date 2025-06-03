"use client";

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlaylistItem } from "@/types";

interface MiniPlayerProps {
  currentVideo: PlaylistItem;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (value: number[]) => void;
  onMuteToggle: () => void;
  onProgressChange: (value: number[]) => void;
  onMaximize: () => void;
}

export default function MiniPlayer({
  currentVideo,
  isPlaying,
  progress,
  duration,
  volume,
  isMuted,
  onPlayPause,
  onPrevious,
  onNext,
  onVolumeChange,
  onMuteToggle,
  onProgressChange,
  onMaximize,
}: MiniPlayerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      className="fixed bottom-4 left-4 w-96 bg-zinc-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-zinc-800 p-4 cursor-pointer hover:bg-zinc-900 transition-colors"
      onClick={onMaximize}
    >
      <div className="flex items-center gap-4">
        <img
          src={currentVideo.thumbnail_url || `https://img.youtube.com/vi/${currentVideo.youtube_video_id}/mqdefault.jpg`}
          alt={currentVideo.title}
          className="w-16 h-16 rounded object-cover shadow-lg"
        />
        <div className="flex-grow min-w-0">
          <p className="text-base font-medium truncate text-white">{currentVideo.title}</p>
          <p className="text-sm text-zinc-400 truncate">{currentVideo.channel_title}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Slider value={[progress]} min={0} max={duration || 1} step={1} onValueChange={onProgressChange} className="cursor-pointer" />
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={onPrevious}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button variant="default" size="icon" className="h-10 w-10 bg-red-500 hover:bg-red-600" onClick={onPlayPause}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={onNext}>
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={onMuteToggle}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.01} onValueChange={onVolumeChange} className="w-24 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
