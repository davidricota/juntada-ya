import React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { PlaylistItem } from "@/app/types";
import { YouTubeService, YouTubeVideo } from "@/features/playlist-management/api/youtubeService";
import { toast } from "sonner";
import YouTubeSearchResults from "@/features/playlist-management/ui/YouTubeSearchResults";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelected: (
    videoData: Omit<
      PlaylistItem,
      "id" | "event_id" | "added_by_user_id" | "added_at" | "participant_name"
    >
  ) => void;
}

export function SearchDialog({ isOpen, onClose, onSongSelected }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await YouTubeService.searchVideos(searchQuery);
      setSearchResults(results);
    } catch {
      toast.error("No se pudieron buscar los videos. Inténtalo de nuevo.");
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
              onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            />
            <Button onClick={() => void handleSearch()} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <YouTubeSearchResults
            results={searchResults}
            onSongSelected={handleSongSelect}
            showAddButton={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
