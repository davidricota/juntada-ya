import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlaylistItem } from "@/types";
import { YouTubeService, YouTubeVideo } from "@/services/youtubeService";
import { useToast } from "@/components/ui/use-toast";
import YouTubeSearchResults from "./YouTubeSearchResults";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelected: (videoData: Omit<PlaylistItem, "id" | "event_id" | "added_by_user_id" | "added_at" | "participant_name">) => void;
}

export function SearchDialog({ isOpen, onClose, onSongSelected }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await YouTubeService.searchVideos(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron buscar los videos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSongSelect = (video: YouTubeVideo) => {
    onSongSelected({
      youtube_video_id: video.id,
      title: video.title,
      thumbnail_url: video.thumbnail,
      channel_title: video.channelTitle,
      added_by_participant_id: "", // Este valor será reemplazado por el servicio
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buscar Canción</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar en YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <YouTubeSearchResults results={searchResults} onSongSelected={handleSongSelect} showAddButton={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
