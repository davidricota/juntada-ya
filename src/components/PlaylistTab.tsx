import React, { useState, Dispatch, SetStateAction, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { ListMusic, Play, Youtube, Plus, Loader2 } from "lucide-react";
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

export interface PlaylistTabProps {
  eventId: string;
  participants: Participant[];
  playlist: PlaylistItem[];
  onPlaylistChange: Dispatch<SetStateAction<PlaylistItem[]>>;
  currentParticipantId: string | null;
  accessCode: string;
  isHost: boolean;
  isLoading: boolean;
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
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

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
    </>
  );
};

export default PlaylistTab;
