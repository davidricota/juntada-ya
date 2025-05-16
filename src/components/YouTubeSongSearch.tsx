
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Asegúrate que la ruta es correcta
import { useToast } from '@/hooks/use-toast'; // Para notificaciones

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface YouTubeSongSearchProps {
  onSongSelected?: (song: YouTubeVideo) => void; // Nueva prop
}

const YouTubeSongSearch: React.FC<YouTubeSongSearchProps> = ({ onSongSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: 'Campo Vacío',
        description: 'Por favor, ingresa un término de búsqueda.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]); // Limpiar resultados anteriores

    try {
      const { data, error: functionError } = await supabase.functions.invoke('youtube-search', {
        body: { searchTerm },
      });

      if (functionError) {
        console.error('Error invoking Supabase function:', functionError);
        throw new Error(functionError.message || 'Error al contactar la función de búsqueda.');
      }
      
      if (data && data.error) {
         console.error('Error from youtube-search function:', data.details || data.error);
         throw new Error(data.details?.message || data.error || 'Error en la búsqueda de YouTube.');
      }
      
      if (data && data.results) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          toast({
            title: 'Sin Resultados',
            description: 'No se encontraron canciones para tu búsqueda.',
          });
        }
      } else {
        // Esto podría indicar un problema inesperado con la respuesta de la función
        setSearchResults([]);
         toast({
            title: 'Respuesta Inesperada',
            description: 'La búsqueda no devolvió el formato esperado.',
            variant: "default"
          });
      }

    } catch (err: any) {
      console.error('Catch block error:', err);
      setError(err.message || 'Ocurrió un error desconocido durante la búsqueda.');
      toast({
        title: 'Error de Búsqueda',
        description: err.message || 'No se pudieron obtener los resultados. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSong = (song: YouTubeVideo) => {
    if (onSongSelected) {
      onSongSelected(song);
      // Opcional: limpiar búsqueda o dar feedback
      // setSearchTerm(''); 
      // setSearchResults([]);
      toast({ title: "Canción Pre-seleccionada", description: `${song.title} lista para ser añadida.`})
    } else {
      // Comportamiento por defecto si no hay onSongSelected (ej. solo mostrar en consola)
      console.log('Song selected:', song);
       toast({ title: "Canción Seleccionada (dev)", description: `${song.title}`})
    }
  };

  return (
    <div className="mt-8 p-4 md:p-6 bg-spotify-light-dark/70 rounded-lg shadow-lg backdrop-blur-sm">
      <h3 className="text-lg md:text-xl font-semibold text-spotify-text mb-4">Buscar y Agregar Canciones de YouTube</h3>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="text"
          placeholder="Nombre de la canción o artista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-card border-input text-foreground placeholder:text-muted-foreground"
          aria-label="Buscar canción en YouTube"
        />
        <Button 
          type="submit" 
          variant="default" 
          className="bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark font-semibold shrink-0"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
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
        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
          <h4 className="text-md font-semibold text-spotify-text-muted">Resultados:</h4>
          {searchResults.map((video) => (
            <div 
              key={video.id} 
              className="flex items-center gap-3 p-2.5 bg-spotify-dark rounded-md hover:bg-opacity-80 transition-colors cursor-pointer"
              onClick={() => handleSelectSong(video)}
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleSelectSong(video)}
              role="button"
              aria-label={`Seleccionar canción ${video.title}`}
            >
              <img src={video.thumbnail} alt={video.title} className="w-16 h-12 rounded object-cover shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm truncate text-spotify-text" title={video.title}>{video.title}</p>
                <p className="text-xs text-spotify-text-muted truncate" title={video.channelTitle}>{video.channelTitle}</p>
              </div>
               {onSongSelected && <Button size="sm" variant="ghost" className="ml-auto text-spotify-green hover:text-spotify-green/80 shrink-0">Agregar</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubeSongSearch;
