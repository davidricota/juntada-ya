import React from "react";
import { Trash, Youtube } from "lucide-react";
import { PlaylistItem } from "@/types";
import { cn } from "@/lib/utils";

interface PlayListProps {
  playlistItems: PlaylistItem[];
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
  onVideoDelete: (id: string, title: string) => void;
}

const Playlist: React.FC<PlayListProps> = ({ playlistItems, currentVideoIndex, onVideoSelect, onVideoDelete }) => {
  if (!playlistItems) return null;

  return (
    <ul className="space-y-3 max-h-96 px-4">
      {playlistItems.map((item, index) => (
        <li
          key={`${item.id}-${index}`}
          className={cn(
            "flex items-center gap-3 p-3 bg-background text-foreground border border-primary rounded-md shadow transition-colors hover:bg-card hover:text-card-foreground group",
            currentVideoIndex === index && "border-red-500/50 bg-red-500/10 text-red-500"
          )}
        >
          <img
            src={item.thumbnail_url || `https://img.youtube.com/vi/${item.youtube_video_id}/mqdefault.jpg`}
            alt={item.title}
            className="w-16 h-12 rounded object-cover shadow-sm"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/48x36?text=${item.title.charAt(0)}`;
            }}
          />
          <div className="flex-grow">
            <p className="font-semibold text-base leading-tight">{item.title}</p>
            <p className="text-sm opacity-80">{item.channel_title}</p>
            <p className="text-xs opacity-60">Añadido por: {item.participant_name}</p>
          </div>

          <button
            onClick={() => onVideoSelect(index)}
            title="Reproducir"
            className="ml-auto p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <Youtube className={cn("h-6 w-6 text-muted group-hover:text-red-400", currentVideoIndex === index && "text-red-500")} />
          </button>
          <button
            onClick={() => onVideoDelete(item.id, item.title)}
            title="Eliminar"
            className="ml-auto p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <Trash className={cn("h-6 w-6 text-muted group-hover:text-red-400", currentVideoIndex === index && "text-red-500")} />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Playlist;
