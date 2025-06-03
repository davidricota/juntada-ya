import React, { useState, Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ListMusic, Play, Youtube } from "lucide-react";
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

const PlaylistTab: React.FC<PlaylistTabProps> = ({ eventId, participants, playlist, onPlaylistChange }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const handleVideoSelect = (index) => {
    setCurrentVideoIndex(index);
  };

  // Funciones para navegación entre videos
  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else {
      setCurrentVideoIndex(playlist.length - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < playlist.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      setCurrentVideoIndex(0);
    }
  };

  const handleVideoDelete = (index: string, title: string) => {
    console.log("Eliminar video en el índice:", index);
    PlaylistService.removeFromPlaylist(index);
    toast({ title: "Canción Eliminada", description: `${title}` });
  };

  return (
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
            <YouTubePlayer
              playlistItems={playlist}
              currentVideoIndex={currentVideoIndex}
              onVideoEnd={handleNextVideo}
              onPreviousVideo={handlePreviousVideo}
              onNextVideo={handleNextVideo}
            />
            <ScrollArea className="max-h-96 rounded-lg pr-4">
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
};

export default PlaylistTab;
