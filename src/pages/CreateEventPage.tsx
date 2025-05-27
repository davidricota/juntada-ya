import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateAccessCode } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const CreateEventPage: React.FC = () => {
  const [eventName, setEventName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      toast({ title: "Error", description: "El nombre del evento no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    let newAccessCode = generateAccessCode();
    let eventCreated = false;
    let attempts = 0;
    let createdEventData = null;

    // Intentar generar un código de acceso único
    while (!eventCreated && attempts < 5) {
      attempts++;
      const { data, error } = await supabase.from("events").insert({ name: eventName, access_code: newAccessCode }).select().single();

      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint "events_access_code_key"')) {
          // Código duplicado, intentar generar uno nuevo
          newAccessCode = generateAccessCode();
        } else {
          console.error("Error creating event:", error);
          toast({ title: "Error", description: "No se pudo crear el evento. Inténtalo de nuevo.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      } else {
        createdEventData = data;
        eventCreated = true;
      }
    }

    if (!eventCreated || !createdEventData) {
      toast({ title: "Error", description: "No se pudo generar un código de acceso único. Inténtalo de nuevo.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setAccessCode(createdEventData.access_code);
    setEventId(createdEventData.id);
    toast({ title: "¡Evento Creado!", description: `Nombre: ${eventName}, Código: ${createdEventData.access_code}` });
    setIsLoading(false);
    // No navegamos automáticamente, mostramos el código.
  };

  if (accessCode && eventId) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">¡Evento Creado Exitosamente!</CardTitle>
            <CardDescription>Comparte este código con tus amigos para que puedan unirse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre del Evento:</p>
              <p className="text-lg font-semibold">{eventName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código de Acceso:</p>
              <p className="text-3xl font-bold text-primary">{accessCode}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={() => navigate(`/event/${eventId}`)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Ir al Evento
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Volver al Inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Nuevo Evento</CardTitle>
          <CardDescription className="text-muted-foreground">Dale un nombre a tu evento para empezar.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="eventName" className="text-muted-foreground">
                Nombre del Evento
              </Label>
              <Input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ej: Fiesta de Sábado"
                required
                className="bg-card border-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {isLoading ? "Creando..." : "Crear Evento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateEventPage;
