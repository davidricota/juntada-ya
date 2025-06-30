import React from "react";
import { PlayCircleIcon, Trash, Youtube } from "lucide-react";
import { PlaylistItem } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

interface PlayListProps {
  playlistItems: PlaylistItem[];
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
  onVideoDelete: (id: string, title: string) => void;
  currentParticipantId: string | null;
  isHost: boolean;
}

const Playlist: React.FC<PlayListProps> = ({
  playlistItems,
  currentVideoIndex,
  onVideoSelect,
  onVideoDelete,
  currentParticipantId,
  isHost,
}) => {
  if (!playlistItems) return null;

  return (
    <ul className="space-y-3 max-h-96 px-1 md:px-4">
      {playlistItems.map((item, index) => (
        <li
          key={`${item.id}-${index}`}
          className={cn(
            "flex items-center gap-3 p-3 bg-background text-foreground border border-primary rounded-md shadow transition-colors hover:bg-card hover:text-card-foreground group",
            currentVideoIndex === index && "border-red-500/50 bg-red-500/10 text-red-500"
          )}
        >
          <button
            onClick={() => onVideoSelect(index)}
            title="Reproducir"
            className="rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <PlayCircleIcon
              className={cn(
                "h-6 w-6 md:h-10 md:w-10 text-muted group-hover:text-red-400",
                currentVideoIndex === index && "text-red-500"
              )}
            />
          </button>

          <div className="flex-grow">
            <p className="font-semibold text-xs sm:text-sm leading-tight">{item.title}</p>
            <p className="text-[10px] sm:text-xs opacity-80">{item.channel_title}</p>
            <p className="hidden md:block text-xs opacity-60">
              Añadido por: {item.participant_name}
            </p>
          </div>
          <div className="flex gap-3 flex-col md:flex-row">
            {(item.added_by_participant_id === currentParticipantId || isHost) && (
              <button
                onClick={() => onVideoDelete(item.id, item.title)}
                title="Eliminar"
                className="p-2  rounded-full hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash
                  className={cn(
                    "h-3 w-3 md:h-4 md:w-4 text-muted group-hover:text-red-400",
                    currentVideoIndex === index && "text-red-500"
                  )}
                />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default Playlist;
