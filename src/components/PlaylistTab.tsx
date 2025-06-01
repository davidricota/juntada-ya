import React, { useState, Dispatch, SetStateAction, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ListMusic } from "lucide-react";
import YouTubePlayer from "./YoutubePlayer";
import Playlist from "./Playlist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistService } from "@/services/playlistService";
import { toast } from "@/hooks/use-toast";
import { Participant } from "@/services/eventService";
import { PlaylistItem } from "@/services/playlistService";

export interface PlaylistTabProps {
  eventId: string;
  participants: Participant[];
  playlist: PlaylistItem[];
  onPlaylistChange: Dispatch<SetStateAction<PlaylistItem[]>>;
}

const PlaylistTab: React.FC<PlaylistTabProps> = memo(({ eventId, participants, playlist, onPlaylistChange }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoSelect = useCallback((index: number) => {
    setCurrentVideoIndex(index);
  }, []);

  const handlePreviousVideo = useCallback(() => {
    setCurrentVideoIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : playlist.length - 1));
  }, [playlist.length]);

  const handleNextVideo = useCallback(() => {
    setCurrentVideoIndex((prevIndex) => (prevIndex < playlist.length - 1 ? prevIndex + 1 : 0));
  }, [playlist.length]);

  const handleVideoDelete = useCallback(
    async (id: string, title: string) => {
      try {
        await PlaylistService.deleteSong(id);
        onPlaylistChange((prevItems) => prevItems.filter((item) => item.id !== id));
        setCurrentVideoIndex((prevIndex) => {
          const newIndex = playlist.findIndex((item) => item.id === id);
          if (newIndex === -1) return prevIndex;
          if (newIndex === prevIndex) return 0;
          if (newIndex < prevIndex) return prevIndex - 1;
          return prevIndex;
        });
        toast({ title: "Canción Eliminada", description: `${title}` });
      } catch (error) {
        console.error("Error deleting song:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la canción. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    },
    [onPlaylistChange, playlist]
  );

  return (
    <Card className="bg-card text-card-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ListMusic className="mr-2 h-5 w-5 text-primary" /> Playlist Colaborativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {playlist.length > 0 ? (
          <>
            <YouTubePlayer
              playlistItems={playlist}
              currentVideoIndex={currentVideoIndex}
              onVideoEnd={handleNextVideo}
              onPreviousVideo={handlePreviousVideo}
              onNextVideo={handleNextVideo}
            />
            <ScrollArea className="h-screen max-h-96 rounded-lg pr-4">
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
  );
});

PlaylistTab.displayName = "PlaylistTab";

export default PlaylistTab;
