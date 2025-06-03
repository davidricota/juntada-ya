"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { PlaylistItem } from "@/types";

interface PlayerContextType {
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
  currentVideo: PlaylistItem | null;
  setCurrentVideo: (video: PlaylistItem | null) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  progress: number;
  setProgress: (value: number) => void;
  duration: number;
  setDuration: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  isMuted: boolean;
  setIsMuted: (value: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<PlaylistItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <PlayerContext.Provider
      value={{
        isMinimized,
        setIsMinimized,
        currentVideo,
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
