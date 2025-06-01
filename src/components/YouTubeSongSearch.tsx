import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { YouTubeService, YouTubeVideo } from "@/services/youtubeService";

interface YouTubeSongSearchProps {
  onSongSelected?: (song: YouTubeVideo) => void;
}

const YouTubeSongSearch: React.FC<YouTubeSongSearchProps> = ({ onSongSelected }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: "Campo Vacío",
        description: "Por favor, ingresa un término de búsqueda.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const results = await YouTubeService.searchVideos(searchTerm);
      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "Sin Resultados",
          description: "No se encontraron canciones para tu búsqueda.",
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error desconocido durante la búsqueda.");
      toast({
        title: "Error de Búsqueda",
        description: err instanceof Error ? err.message : "No se pudieron obtener los resultados. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSong = (song: YouTubeVideo) => {
    if (onSongSelected) {
      onSongSelected(song);
      toast({ title: "Canción Pre-seleccionada", description: `${song.title} lista para ser añadida.` });
    } else {
      console.log("Song selected:", song);
      toast({ title: "Canción Seleccionada (dev)", description: `${song.title}` });
    }
  };

  return (
    <div className="mt-8 p-4 md:p-6 bg-card/70 rounded-lg shadow-lg backdrop-blur-sm">
      <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-4">Buscar y Agregar Canciones de YouTube</h3>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          placeholder="Nombre de la canción o artista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-card border-input text-primary placeholder:text-muted-foreground"
          aria-label="Buscar canción en YouTube"
        />
        <Button
          type="submit"
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Buscar
        </Button>
      </form>

      {error && (
        <div className="my-4 p-3 bg-red-900/30 border border-red-700 text-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-md font-semibold text-muted-foreground">Resultados:</h4>

          <ScrollArea className="h-screen max-h-96 rounded-lg pr-4">
            <ul className="space-y-3">
              {searchResults.map((video) => (
                <li
                  key={video.id}
                  className="flex items-center gap-3 p-2.5 bg-background rounded-md hover:bg-opacity-80 transition-colors cursor-pointer"
                  onClick={() => handleSelectSong(video)}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === "Enter" && handleSelectSong(video)}
                  role="button"
                  aria-label={`Seleccionar canción ${video.title}`}
                >
                  <img src={video.thumbnail} alt={video.title} className="w-16 h-12 rounded object-cover shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground" title={video.title}>
                      {video.title}
                    </p>
                    <p className="text-xs text-foreground truncate" title={video.channelTitle}>
                      {video.channelTitle}
                    </p>
                  </div>
                  {onSongSelected && (
                    <Button size="sm" variant="ghost" className="ml-auto border-foreground border text-foreground hover:text-primary/80 shrink-0">
                      Agregar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default YouTubeSongSearch;
