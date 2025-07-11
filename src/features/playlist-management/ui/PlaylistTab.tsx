import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ListMusic, Loader2 } from "lucide-react";
import YouTubePlayer from "@/widgets/PlayerWidget/ui/YoutubePlayer";
import Playlist from "./Playlist";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { PlaylistService } from "../api/playlistService";
import { toast } from "@/shared/hooks/use-toast";
import { PlaylistItem } from "@/app/types";
import YouTubeSongSearch from "./YouTubeSongSearch";
import { YouTubeVideo } from "../api/youtubeService";
import JoinEventCard from "@/widgets/EventTabs/ui/JoinEventCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { usePlayer } from "@/app/providers/PlayerContext";
import { cn } from "@/shared/lib/utils";
import MiniPlayer from "@/widgets/PlayerWidget/ui/MiniPlayer";

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

interface PlaylistTabProps {
  planId: string;
  playlist: PlaylistItem[];
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
  playlist: initialPlaylist,
  currentParticipantId,
  accessCode,
  isHost,
  isLoading: initialLoading,
  currentTab,
  onRemoveSong,
}: PlaylistTabProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<PlaylistItem[]>([]);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const currentVideoIndexRef = useRef(currentVideoIndex);
  const pendingVideoIndexRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const { data: originalPlaylist = initialPlaylist, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ["playlist", planId],
    queryFn: () => fetchPlaylist(planId),
    initialData: initialPlaylist,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  const { setCurrentVideo, isPlaying, setIsPlaying, progress, setProgress, duration, setDuration } =
    usePlayer();

  // Use shuffled playlist if enabled, otherwise use original playlist
  const displayPlaylist =
    isShuffleEnabled === true && Array.isArray(shuffledPlaylist) && shuffledPlaylist.length > 0
      ? shuffledPlaylist
      : originalPlaylist;

  // Update ref when currentVideoIndex changes
  useEffect(() => {
    currentVideoIndexRef.current = currentVideoIndex;
  }, [currentVideoIndex]);

  // Efecto para resetear isInitialLoad cuando cambia el plan
  useEffect(() => {
    setIsInitialLoad(true);
    setIsShuffleEnabled(false);
    setShuffledPlaylist([]);
  }, [planId]);

  // Efecto para guardar el orden original de la playlist
  useEffect(() => {
    if (
      Array.isArray(originalPlaylist) &&
      originalPlaylist.length > 0 &&
      Array.isArray(shuffledPlaylist) &&
      shuffledPlaylist.length === 0
    ) {
      setShuffledPlaylist([...originalPlaylist]);
    }
  }, [originalPlaylist, shuffledPlaylist.length]);

  // Función para cargar video de forma segura
  const loadVideoSafely = (videoIndex: number) => {
    if (
      !playerRef.current ||
      !isPlayerReady ||
      !displayPlaylist ||
      !Array.isArray(displayPlaylist) ||
      !displayPlaylist[videoIndex]
    ) {
      // Si el reproductor no está listo, guardar el índice pendiente
      pendingVideoIndexRef.current = videoIndex;
      return;
    }

    try {
      // Verificar que el reproductor esté realmente listo
      const videoData = playerRef.current.getVideoData();
      if (!videoData) {
        // Si no hay video cargado, intentar de nuevo en un momento
        setTimeout(() => loadVideoSafely(videoIndex), 100);
        return;
      }

      // Resetear las variables de tiempo antes de cargar el nuevo video
      setProgress(0);
      setDuration(0);

      playerRef.current.loadVideoById(displayPlaylist[videoIndex].youtube_video_id);
      pendingVideoIndexRef.current = null;

      // El YouTubePlayer manejará la reproducción automática basada en shouldAutoPlay
    } catch (error) {
      console.warn("Error loading video:", error);
      // Intentar de nuevo en un momento
      setTimeout(() => loadVideoSafely(videoIndex), 500);
    }
  };

  // Efecto para procesar videos pendientes cuando el reproductor esté listo
  useEffect(() => {
    if (
      isPlayerReady &&
      pendingVideoIndexRef.current !== null &&
      pendingVideoIndexRef.current !== undefined
    ) {
      loadVideoSafely(pendingVideoIndexRef.current);
    }
  }, [isPlayerReady]);

  // Efecto para cargar el video inicial cuando el reproductor esté listo
  useEffect(() => {
    if (
      isPlayerReady &&
      Array.isArray(displayPlaylist) &&
      displayPlaylist.length > 0 &&
      typeof currentVideoIndex === "number" &&
      currentVideoIndex >= 0 &&
      currentVideoIndex < displayPlaylist.length
    ) {
      loadVideoSafely(currentVideoIndex);
    }
  }, [isPlayerReady, displayPlaylist.length, currentVideoIndex]);

  // Update currentVideoIndex when video changes
  useEffect(() => {
    if (playerRef.current && isPlaying && isPlayerReady) {
      const checkVideo = () => {
        try {
          const videoData = playerRef.current?.getVideoData();
          if (!videoData) return; // Si no hay video cargado, no hacer nada

          const currentTime = playerRef.current?.getCurrentTime() || 0;
          const videoDuration = playerRef.current?.getDuration() || 0;

          // Solo proceder si tenemos valores válidos
          if (isNaN(currentTime) || isNaN(videoDuration) || videoDuration <= 0) {
            return;
          }

          // Si el video está cerca del final, asumimos que está por cambiar
          if (videoDuration - currentTime < 1) {
            const nextIndex =
              typeof currentVideoIndexRef.current === "number" &&
              currentVideoIndexRef.current === displayPlaylist.length - 1
                ? 0
                : (currentVideoIndexRef.current ?? 0) + 1;

            // Solo cambiar al siguiente video si no es el último o si el loop está activado
            if (
              (typeof currentVideoIndexRef.current === "number" &&
                currentVideoIndexRef.current < displayPlaylist.length - 1) ||
              isRepeatEnabled
            ) {
              // Marcar que el usuario ha interactuado (porque el video se está reproduciendo)
              markUserInteraction();
              setCurrentVideoIndex(nextIndex);
              loadVideoSafely(nextIndex);
            } else {
              // Si es el último video y el loop no está activado, pausar
              if (playerRef.current) {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
              }
            }
          }
        } catch (error) {
          console.warn("Error checking video progress:", error);
        }
      };

      const interval = setInterval(checkVideo, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, displayPlaylist.length, isPlayerReady]);

  // Update context when video changes
  useEffect(() => {
    if (
      typeof currentVideoIndex !== "number" ||
      !Array.isArray(displayPlaylist) ||
      currentVideoIndex < 0 ||
      currentVideoIndex >= displayPlaylist.length
    )
      return;
    setCurrentVideo(displayPlaylist[currentVideoIndex]);
  }, [currentVideoIndex, displayPlaylist, setCurrentVideo]);

  // Subscribe to playlist changes
  useEffect(() => {
    const subscription = PlaylistService.subscribeToPlaylist(planId, async (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        void queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      } else if (payload.eventType === "DELETE" && payload.old) {
        void queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      }
    });

    return () => {
      PlaylistService.unsubscribeFromPlaylist(subscription);
    };
  }, [planId, queryClient]);

  // Update progress in real-time
  useEffect(() => {
    if (!isPlaying || !playerRef.current || !isPlayerReady) {
      return;
    }

    const interval = setInterval(() => {
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const videoDuration = playerRef.current.getDuration();

          // Solo actualizar si los valores son válidos
          if (!isNaN(currentTime) && currentTime >= 0) {
            setProgress(currentTime);
          }

          if (!isNaN(videoDuration) && videoDuration > 0) {
            setDuration(videoDuration);
          }
        } catch (error) {
          console.warn("Error updating progress:", error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, setProgress, setDuration, isPlayerReady]);

  // Función para marcar que el usuario ha interactuado con el reproductor
  const markUserInteraction = () => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  };

  // Función para activar/desactivar shuffle
  const toggleShuffle = () => {
    markUserInteraction();
    console.log("Toggle shuffle - isShuffleEnabled:", isShuffleEnabled);
    console.log(
      "Playlist actual:",
      originalPlaylist.map((item) => item.title)
    );

    if (!isShuffleEnabled) {
      // Activar shuffle: desordenar la playlist
      const shuffled = [...originalPlaylist].sort(() => Math.random() - 0.5);
      console.log(
        "Playlist desordenada:",
        shuffled.map((item) => item.title)
      );
      // Resetear el índice al primer video
      setCurrentVideoIndex(0);
      setShuffledPlaylist(shuffled);
    } else {
      // Desactivar shuffle: restaurar orden original
      console.log(
        "Restaurando orden original:",
        originalPlaylist.map((item) => item.title)
      );
      // Encontrar el video actual en el orden original
      const currentVideo = displayPlaylist[currentVideoIndex];
      const originalIndex = originalPlaylist.findIndex((item) => item.id === currentVideo.id);
      setCurrentVideoIndex(originalIndex >= 0 ? originalIndex : 0);
      setShuffledPlaylist([]);
    }
    setIsShuffleEnabled(!isShuffleEnabled);
  };

  // Memoize the YouTubePlayer to prevent unnecessary re-renders
  const memoizedYouTubePlayer = React.useMemo(
    () => (
      <YouTubePlayer
        key="youtube-player"
        playlistItems={displayPlaylist}
        initialVideoIndex={currentVideoIndex}
        shouldAutoPlay={!isInitialLoad}
        onPlayerReady={(player) => {
          playerRef.current = player;
          setIsPlayerReady(true);
        }}
        onVideoChange={(index) => {
          setCurrentVideoIndex(index);
        }}
        onRepeatChange={(isEnabled) => {
          setIsRepeatEnabled(isEnabled);
        }}
        onShuffleToggle={toggleShuffle}
        isShuffleEnabled={isShuffleEnabled}
      />
    ),
    [currentVideoIndex, isInitialLoad, isShuffleEnabled, displayPlaylist]
  );

  const handleVideoSelect = (index: number) => {
    markUserInteraction();
    setCurrentVideoIndex(index);
    loadVideoSafely(index);
  };

  const handleVideoDelete = (id: string, title: string) => {
    void onRemoveSong(id);
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
      console.log("Adding song to playlist:", {
        planId,
        currentParticipantId,
        song: {
          youtube_video_id: song.id,
          title: song.title,
          thumbnail_url: song.thumbnail,
          channel_title: song.channelTitle,
        },
      });

      const result = await PlaylistService.addToPlaylist(planId, currentParticipantId, {
        youtube_video_id: song.id,
        title: song.title,
        thumbnail_url: song.thumbnail,
        channel_title: song.channelTitle,
      });

      console.log("Song added successfully:", result);

      // Invalidate and refetch
      void queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      toast({ title: "¡Canción Agregada!", description: `${song.title} se añadió a la playlist.` });
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      toast({
        title: "Error",
        description: `No se pudo agregar la canción: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    markUserInteraction();
    console.log(
      "handlePrevious - isInitialLoad:",
      isInitialLoad,
      "shouldAutoPlay:",
      !isInitialLoad
    );
    const prevIndex = currentVideoIndex === 0 ? displayPlaylist.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
    loadVideoSafely(prevIndex);
  };

  const handleNext = () => {
    markUserInteraction();
    console.log("handleNext - isInitialLoad:", isInitialLoad, "shouldAutoPlay:", !isInitialLoad);
    const nextIndex = currentVideoIndex === displayPlaylist.length - 1 ? 0 : currentVideoIndex + 1;
    setCurrentVideoIndex(nextIndex);
    loadVideoSafely(nextIndex);
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
            {displayPlaylist.length > 0 ? (
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
                    playlistItems={displayPlaylist}
                    currentVideoIndex={currentVideoIndex}
                    onVideoSelect={handleVideoSelect}
                    onVideoDelete={(id) => handleVideoDelete(id, "")}
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
      {currentTab !== "playlist" && displayPlaylist.length > 0 && (
        <MiniPlayer
          currentVideo={displayPlaylist[currentVideoIndex]}
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
