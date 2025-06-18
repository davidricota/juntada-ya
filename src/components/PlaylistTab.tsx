import React, { useState, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ListMusic, Loader2 } from "lucide-react";
import YouTubePlayer from "./YoutubePlayer";
import Playlist from "./Playlist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistService } from "@/services/playlistService";
import { toast } from "@/hooks/use-toast";
import { Participant, PlaylistItem, PlaylistChangePayload } from "@/types";
import YouTubeSongSearch from "./YouTubeSongSearch";
import { YouTubeVideo } from "@/services/youtubeService";
import JoinEventCard from "./JoinEventCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { usePlayer } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import MiniPlayer from "./MiniPlayer";
import { useParams } from "react-router-dom";

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
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getVideoData: () => { video_id: string } | null;
}

export interface PlaylistTabProps {
  planId: string;
  participants: Participant[];
  playlist: PlaylistItem[];
  onPlaylistChange: Dispatch<SetStateAction<PlaylistItem[]>>;
  currentParticipantId: string | null;
  accessCode: string;
  isHost: boolean;
  isLoading: boolean;
  currentTab: string;
  onRemoveSong: (itemId: string) => Promise<void>;
}

const fetchPlaylist = async (planId: string): Promise<PlaylistItem[]> => {
  const playlist = await PlaylistService.getPlaylist(planId);
  return playlist;
};

export default function PlaylistTab({
  planId,
  participants,
  playlist: initialPlaylist,
  onPlaylistChange,
  currentParticipantId,
  accessCode,
  isHost,
  isLoading: initialLoading,
  currentTab,
  onRemoveSong,
}: PlaylistTabProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const queryClient = useQueryClient();

  const { data: playlist = initialPlaylist, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ["playlist", planId],
    queryFn: () => fetchPlaylist(planId),
    initialData: initialPlaylist,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

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
  const { isMinimized: usePlayerMinimized } = usePlayer();
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const { planId: useParamsplanId } = useParams<{ planId: string }>();

  // Update currentVideoIndex when video changes
  useEffect(() => {
    if (playerRef.current && isPlaying) {
      const checkVideo = () => {
        const currentTime = playerRef.current?.getCurrentTime() || 0;
        const videoDuration = playerRef.current?.getDuration() || 0;

        // Si el video está cerca del final, asumimos que está por cambiar
        if (videoDuration - currentTime < 1) {
          const nextIndex = currentVideoIndex === playlist.length - 1 ? 0 : currentVideoIndex + 1;
          setCurrentVideoIndex(nextIndex);
        }
      };

      const interval = setInterval(checkVideo, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentVideoIndex, playlist.length]);

  // Update context when video changes
  useEffect(() => {
    if (playlist.length > 0 && currentVideoIndex < playlist.length) {
      setCurrentVideo(playlist[currentVideoIndex]);
    }
  }, [playlist, currentVideoIndex, setCurrentVideo]);

  // Subscribe to playlist changes
  useEffect(() => {
    const subscription = PlaylistService.subscribeToPlaylist(planId, async (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        // Invalidate and refetch
        await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      } else if (payload.eventType === "DELETE" && payload.old) {
        // Invalidate and refetch
        await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      }
    });

    return () => {
      PlaylistService.unsubscribeFromPlaylist(subscription);
    };
  }, [planId, queryClient]);

  // Update progress in real-time
  useEffect(() => {
    if (!isPlaying || !playerRef.current) {
      return;
    }

    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        setProgress(currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, setProgress]);

  // Memoize the YouTubePlayer to prevent unnecessary re-renders
  const memoizedYouTubePlayer = React.useMemo(
    () => (
      <YouTubePlayer
        key="youtube-player"
        playlistItems={playlist}
        initialVideoIndex={currentVideoIndex}
        onPlayerReady={(player) => {
          playerRef.current = player;
          setIsPlayerReady(true);
          setPlayer(player);
          // Restaurar el volumen y estado de mute
          player.setVolume(volume * 100);
          if (isMuted) {
            player.mute();
          }
        }}
        onVideoChange={(index) => {
          setCurrentVideoIndex(index);
        }}
      />
    ),
    [currentVideoIndex]
  );

  // Efecto para manejar cambios en el video actual
  useEffect(() => {
    if (playerRef.current && playlist[currentVideoIndex]) {
      playerRef.current.loadVideoById(playlist[currentVideoIndex].youtube_video_id);
      if (isPlaying) {
        playerRef.current.playVideo();
      }
    }
  }, [currentVideoIndex, playlist]);

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const handleVideoDelete = async (id: string, title: string) => {
    try {
      // Actualizar el estado local inmediatamente
      const newItems = playlist.filter((item) => item.id !== id);
      // Si el video actual fue eliminado, movemos al siguiente
      if (currentVideoIndex >= newItems.length) {
        setCurrentVideoIndex(Math.max(0, newItems.length - 1));
      }

      // Luego intentar eliminar en la base de datos
      await onRemoveSong(id);
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      toast({ title: "Canción Eliminada", description: `${title}` });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la canción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSongSelected = async (song: YouTubeVideo) => {
    if (!currentParticipantId) {
      toast({
        title: "Acción Requerida",
        description: "Debes unirte al evento para agregar canciones.",
        variant: "destructive",
      });
      return;
    }

    try {
      await PlaylistService.addToPlaylist(planId, currentParticipantId, {
        youtube_video_id: song.id,
        title: song.title,
        thumbnail_url: song.thumbnail,
        channel_title: song.channelTitle,
      });
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      toast({ title: "¡Canción Agregada!", description: `${song.title} se añadió a la playlist.` });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la canción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentVideoIndex === 0 ? playlist.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
    if (playerRef.current) {
      playerRef.current.loadVideoById(playlist[prevIndex].youtube_video_id);
      playerRef.current.playVideo();
    }
  };

  const handleNext = () => {
    const nextIndex = currentVideoIndex === playlist.length - 1 ? 0 : currentVideoIndex + 1;
    setCurrentVideoIndex(nextIndex);
    if (playerRef.current) {
      playerRef.current.loadVideoById(playlist[nextIndex].youtube_video_id);
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100);
    }
  };

  const handleMuteToggle = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    if (playerRef.current) {
      playerRef.current.seekTo(newProgress, true);
    }
  };

  const handlePlayerReady = (player: YouTubePlayer) => {
    setPlayer(player);
  };

  if (isPlaylistLoading || initialLoading) {
    return (
      <div className="flex flex-col h-full">
        <Card className="bg-card text-card-foreground shadow-lg">
          <CardHeader className="p-2 md:p-6">
            <CardTitle className="text-xl flex items-center">
              <ListMusic className="mr-2 h-5 w-5 text-primary" />
              Playlist Colaborativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-2 md:p-6">
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "transition-all duration-200",
          currentTab !== "playlist" && "opacity-0 w-0 h-0 overflow-hidden"
        )}
      >
        <Card className="bg-card text-card-foreground shadow-lg">
          <CardHeader className="p-2 md:p-6">
            <CardTitle className="text-xl flex items-center">
              <ListMusic className="mr-2 h-5 w-5 text-primary" />
              Playlist Colaborativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-2 md:p-6">
            {playlist.length > 0 ? (
              <>
                <div
                  className={cn(
                    "transition-all duration-200",
                    isPlayerReady ? "opacity-100" : "opacity-0"
                  )}
                >
                  {memoizedYouTubePlayer}
                </div>
                <ScrollArea className="max-h-96 rounded-lg">
                  <Playlist
                    playlistItems={playlist}
                    currentVideoIndex={currentVideoIndex}
                    onVideoSelect={handleVideoSelect}
                    onVideoDelete={handleVideoDelete}
                    currentParticipantId={currentParticipantId}
                    isHost={isHost}
                  />
                </ScrollArea>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-6 italic">
                ¡La playlist está vacía! Agrega la primera canción.
              </p>
            )}
          </CardContent>
        </Card>
        {currentParticipantId ? (
          <YouTubeSongSearch onSongSelected={handleSongSelected} />
        ) : (
          <JoinEventCard
            accessCode={accessCode}
            message="unirte al evento para agregar canciones"
          />
        )}
      </div>
      {currentTab !== "playlist" && playlist.length > 0 && (
        <MiniPlayer
          currentVideo={playlist[currentVideoIndex]}
          player={playerRef.current}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          onSeek={(value) => {
            setProgress(value);
            if (playerRef.current) {
              playerRef.current.seekTo(value, true);
            }
          }}
        />
      )}
    </div>
  );
}
