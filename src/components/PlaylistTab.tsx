import React, { useState, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ListMusic } from "lucide-react";
import YouTubePlayer from "./YoutubePlayer";
import Playlist from "./Playlist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistService } from "@/services/playlistService";
import { toast } from "@/hooks/use-toast";
import { Participant, PlaylistItem, PlaylistChangePayload } from "@/types";
import YouTubeSongSearch from "./YouTubeSongSearch";
import { YouTubeVideo } from "@/services/youtubeService";
import JoinEventCard from "./JoinEventCard";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import MiniPlayer from "./MiniPlayer";

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
}

export interface PlaylistTabProps {
  eventId: string;
  participants: Participant[];
  playlist: PlaylistItem[];
  onPlaylistChange: Dispatch<SetStateAction<PlaylistItem[]>>;
  currentParticipantId: string | null;
  accessCode: string;
  isHost: boolean;
  isLoading: boolean;
  currentTab: string;
}

const PlaylistTab: React.FC<PlaylistTabProps> = ({
  eventId,
  participants,
  playlist,
  onPlaylistChange,
  currentParticipantId,
  accessCode,
  isHost,
  isLoading,
  currentTab,
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const {
    isMinimized,
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
    setIsMinimized,
  } = usePlayer();

  // Update context when video changes
  useEffect(() => {
    if (playlist.length > 0 && currentVideoIndex < playlist.length) {
      setCurrentVideo(playlist[currentVideoIndex]);
    }
  }, [playlist, currentVideoIndex, setCurrentVideo]);

  // Subscribe to playlist changes
  useEffect(() => {
    const subscription = PlaylistService.subscribeToPlaylist(eventId, (payload: PlaylistChangePayload) => {
      if (payload.eventType === "DELETE") {
        onPlaylistChange((prevItems) => {
          const newItems = prevItems.filter((item) => item.id !== payload.old.id);
          // If the deleted item was the current video, move to the next one
          if (currentVideoIndex >= newItems.length) {
            setCurrentVideoIndex(Math.max(0, newItems.length - 1));
          }
          return newItems;
        });
      } else if (payload.eventType === "INSERT") {
        const participant = participants.find((p) => p.id === payload.new.added_by_participant_id);
        const newItem: PlaylistItem = {
          id: payload.new.id,
          youtube_video_id: payload.new.youtube_video_id,
          title: payload.new.title,
          thumbnail_url: payload.new.thumbnail_url,
          channel_title: payload.new.channel_title,
          added_by_participant_id: payload.new.added_by_participant_id,
          event_id: payload.new.event_id,
          added_at: payload.new.added_at,
          participant_name: participant?.name || "Desconocido",
        };
        onPlaylistChange((prevItems) => [...prevItems, newItem]);
      }
    });

    return () => {
      PlaylistService.unsubscribeFromPlaylist(subscription);
    };
  }, [eventId, participants, onPlaylistChange, currentVideoIndex]);

  const handleVideoSelect = (index: number) => {
    console.log("Selecting video at index:", index);
    setCurrentVideoIndex(index);
  };

  const handleVideoDelete = async (id: string, title: string) => {
    try {
      await PlaylistService.removeFromPlaylist(id);
      toast({ title: "Canción Eliminada", description: `${title}` });
    } catch (error) {
      console.error("Error deleting video:", error);
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
      const newSong = await PlaylistService.addToPlaylist(eventId, currentParticipantId, {
        youtube_video_id: song.id,
        title: song.title,
        thumbnail_url: song.thumbnail,
        channel_title: song.channelTitle,
      });
      onPlaylistChange((prev) => [...prev, newSong]);
      toast({ title: "¡Canción Agregada!", description: `${song.title} se añadió a la playlist.` });
    } catch (error) {
      console.error("Error adding song:", error);
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
  };

  const handleNext = () => {
    const nextIndex = currentVideoIndex === playlist.length - 1 ? 0 : currentVideoIndex + 1;
    setCurrentVideoIndex(nextIndex);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard
          header={{
            title: true,
            description: false,
            meta: false,
            actions: 0,
          }}
          content={{
            items: 4,
            itemHeight: "h-16",
            itemWidth: "w-full",
          }}
        />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className={cn("transition-all duration-200", currentTab !== "playlist" && "opacity-0 w-0 h-0 overflow-hidden")}>
        <Card className="bg-card text-card-foreground shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <ListMusic className="mr-2 h-5 w-5 text-primary" />
              Playlist Colaborativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {playlist.length > 0 ? (
              <>
                <YouTubePlayer playlistItems={playlist} initialVideoIndex={currentVideoIndex} />
                <ScrollArea className="max-h-96 rounded-lg">
                  <Playlist
                    playlistItems={playlist}
                    currentVideoIndex={currentVideoIndex}
                    onVideoSelect={handleVideoSelect}
                    onVideoDelete={handleVideoDelete}
                  />
                </ScrollArea>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-6 italic">¡La playlist está vacía! Agrega la primera canción.</p>
            )}
          </CardContent>
        </Card>
        {currentParticipantId ? (
          <YouTubeSongSearch onSongSelected={handleSongSelected} />
        ) : (
          <JoinEventCard accessCode={accessCode} message="unirte al evento para agregar canciones" />
        )}
      </div>
      {currentTab !== "playlist" && playlist.length > 0 && playlist[currentVideoIndex] && isPlaying && (
        <MiniPlayer
          currentVideo={playlist[currentVideoIndex]}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onProgressChange={handleProgressChange}
          onMaximize={() => setIsMinimized(false)}
        />
      )}
    </>
  );
};

export default PlaylistTab;
