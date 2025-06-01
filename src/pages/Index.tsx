import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogIn } from "lucide-react";

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-foreground mb-4">juntadaYa!</h1>
        <p className="text-xl text-muted-foreground">Tu plataforma para organizar eventos y playlists colaborativas.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
        <Card className="bg-card text-card-foreground hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Plus className="mr-2 h-6 w-6 text-primary" />
              Crear Nuevo Evento
            </CardTitle>
            <CardDescription className="text-muted-foreground">Inicia un nuevo evento y obtén un código para compartir.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/create-event">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Crear Evento</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <LogIn className="mr-2 h-6 w-6 text-primary" />
              Unirse a un Evento
            </CardTitle>
            <CardDescription className="text-muted-foreground">Ingresa con un código de acceso a un evento existente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/join">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Unirse a Evento</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
