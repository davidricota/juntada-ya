import React from "react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import { YouTubeVideo } from "../api/youtubeService";

interface YouTubeSearchResultsProps {
  results: YouTubeVideo[];
  onSongSelected: (song: YouTubeVideo) => void;
  showAddButton?: boolean;
}

const YouTubeSearchResults: React.FC<YouTubeSearchResultsProps> = ({
  results,
  onSongSelected,
  showAddButton = true,
}) => {
  if (results.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 w-full">
      <h4 className="text-md font-semibold text-muted-foreground">Resultados:</h4>
      <div className="w-full">
        <ScrollArea className="w-full max-h-96 rounded-lg">
          <ul className="space-y-3 max-h-96 px-1 sm:px-4 w-full">
            {results.map((video) => (
              <li
                key={video.id}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-background rounded-md hover:bg-opacity-80 transition-colors cursor-pointer w-full"
                onClick={() => onSongSelected(video)}
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && onSongSelected(video)}
                role="button"
                aria-label={`Seleccionar canción ${video.title}`}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-12 h-9 sm:w-16 sm:h-12 rounded object-cover shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <p
                    className="font-semibold text-xs sm:text-sm  text-foreground"
                    title={video.title}
                  >
                    {video.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground " title={video.channelTitle}>
                    {video.channelTitle}
                  </p>
                </div>
                {showAddButton && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto border-foreground border text-foreground hover:text-primary/80 shrink-0 text-xs sm:text-sm"
                  >
                    Agregar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
};

export default YouTubeSearchResults;
