
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const YouTubeSongSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      console.log('Search term is empty');
      // Podrías mostrar un toast aquí
      return;
    }
    console.log(`Searching YouTube for: ${searchTerm}`);
    // Aquí iría la lógica para llamar a la API de YouTube
    // Por ahora, solo mostramos en consola.
  };

  return (
    <div className="mt-8 p-6 bg-spotify-light-dark rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-spotify-text mb-4">Buscar canciones en YouTube</h3>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Nombre de la canción o artista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow bg-card border-input text-foreground placeholder:text-muted-foreground"
        />
        <Button type="submit" variant="default" className="bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark font-semibold">
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </form>
      {/* Aquí podrías mostrar los resultados de la búsqueda */}
    </div>
  );
};

export default YouTubeSongSearch;

