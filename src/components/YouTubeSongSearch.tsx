import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { YouTubeService, YouTubeVideo } from "@/services/youtubeService";
import YouTubeSearchResults from "./YouTubeSearchResults";

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
    <div className="mt-8 p-2 sm:p-4 md:p-6 bg-card/70 rounded-lg shadow-lg backdrop-blur-sm">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-card-foreground mb-4">Buscar y Agregar Canciones de YouTube</h3>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          placeholder="Nombre de la canción o artista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-card border-input text-primary placeholder:text-muted-foreground text-sm sm:text-base"
          aria-label="Buscar canción en YouTube"
        />
        <Button
          type="submit"
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 text-sm sm:text-base"
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

      <YouTubeSearchResults results={searchResults} onSongSelected={handleSelectSong} showAddButton={!!onSongSelected} />
    </div>
  );
};

export default YouTubeSongSearch;
