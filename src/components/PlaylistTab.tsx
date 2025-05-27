import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ListMusic, Play, Youtube } from "lucide-react";
import YouTubePlayer from "./YoutubePlayer";
import Playlist from "./Playlist";
import { ScrollArea } from "@/components/ui/scroll-area";
interface PlaylistTabProps {
  playlistItems: Array<{
    id: string;
    youtube_video_id: string;
    title: string;
    thumbnail_url: string | null;
    channel_title: string | null;
    added_by_participant_id: string;
    participant_name?: string; // Para mostrar quién la añadió
  }>;
}
const PlaylistTab: React.FC<PlaylistTabProps> = ({ playlistItems }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const handleVideoSelect = (index) => {
    setCurrentVideoIndex(index);
  };

  // Funciones para navegación entre videos
  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else {
      setCurrentVideoIndex(playlistItems.length - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < playlistItems.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      setCurrentVideoIndex(0);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ListMusic className="mr-2 h-5 w-5 text-primary" /> Playlist Colaborativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {playlistItems.length > 0 ? (
          <>
            <YouTubePlayer
              playlistItems={playlistItems}
              currentVideoIndex={currentVideoIndex}
              onVideoEnd={handleNextVideo}
              onPreviousVideo={handlePreviousVideo}
              onNextVideo={handleNextVideo}
            />
            <ScrollArea className="h-screen max-h-96 rounded-lg pr-4">
              <Playlist playlistItems={playlistItems} currentVideoIndex={currentVideoIndex} onVideoSelect={handleVideoSelect} />
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
