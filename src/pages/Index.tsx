
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogIn } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-spotify-dark flex flex-col items-center justify-center p-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-spotify-green mb-4">EventoVibes</h1>
        <p className="text-xl text-spotify-text-muted">Tu plataforma para organizar eventos y playlists colaborativas.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
        <Card className="bg-spotify-light-dark text-spotify-text hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Plus className="mr-2 h-6 w-6 text-spotify-green" />
              Crear Nuevo Evento
            </CardTitle>
            <CardDescription className="text-spotify-text-muted">
              Inicia un nuevo evento y obtén un código para compartir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/create-event">
              <Button className="w-full bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark font-semibold">
                Crear Evento
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-spotify-light-dark text-spotify-text hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <LogIn className="mr-2 h-6 w-6 text-spotify-green" />
              Unirse a un Evento
            </CardTitle>
            <CardDescription className="text-spotify-text-muted">
              Ingresa con un código de acceso a un evento existente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/join">
              <Button className="w-full bg-spotify-blue hover:bg-spotify-blue/90 text-white font-semibold"> {/* Usando un color azul para diferenciar */}
                Unirse a Evento
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-16 text-center text-spotify-text-muted text-sm">
        <p>&copy; {new Date().getFullYear()} EventoVibes. Creado con Lovable.</p>
      </footer>
    </div>
  );
};

export default HomePage;
