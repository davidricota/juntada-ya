import React from "react";
import { Youtube } from "lucide-react";
interface PlayListProps {
  playlistItems: Array<{
    id: string;
    youtube_video_id: string;
    title: string;
    thumbnail_url: string | null;
    channel_title: string | null;
    added_by_participant_id: string;
    participant_name?: string;
  }> | null;
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
}

const Playlist: React.FC<PlayListProps> = ({ playlistItems, currentVideoIndex, onVideoSelect }) => {
  const handleVideoSelect = (index) => {
    onVideoSelect(index);
  };
  return (
    <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {playlistItems.map((item) => (
        <li key={item.id} className="flex items-center gap-3 p-3 bg-spotify-dark rounded-md shadow hover:bg-opacity-80 transition-colors">
          <img
            src={item.thumbnail_url || `https://via.placeholder.com/48x36?text=${item.title.charAt(0)}`}
            alt={item.title}
            className="w-16 h-12 rounded object-cover shadow-sm"
          />
          <div className="flex-grow">
            <p className="font-semibold text-base leading-tight">{item.title}</p>
            <p className="text-sm text-spotify-text-muted">{item.channel_title}</p>
            <p className="text-xs text-spotify-text-muted/80">Añadido por: {item.participant_name}</p>
          </div>
          <a
            onClick={() => handleVideoSelect(playlistItems.indexOf(item))}
            title="Ver en YouTube"
            className="ml-auto p-2 rounded-full hover:bg-spotify-gray transition-colors"
          >
            <Youtube className="h-6 w-6 text-red-500 hover:text-red-400" />
          </a>
        </li>
      ))}
    </ul>
  );
};
export default Playlist;
