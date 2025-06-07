import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useParticipantStore } from "@/stores/participantStore";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { cn } from "@/lib/utils";
import { EventService } from "@/services/eventService";
import { UserService } from "@/services/userService";
import { encrypt } from "@/lib/encryption";
import { Copy } from "lucide-react";

const CreateEventPage: React.FC = () => {
  const [eventName, setEventName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantWhatsapp, setParticipantWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getName, getWhatsapp, setParticipant, setEventParticipant } = useParticipantStore();

  // Inicializar los campos con los valores almacenados si existen
  React.useEffect(() => {
    const storedName = getName();
    const storedWhatsapp = getWhatsapp();
    if (storedName) setParticipantName(storedName);
    if (storedWhatsapp) setParticipantWhatsapp(storedWhatsapp);
  }, [getName, getWhatsapp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      toast({ title: "Error", description: "El nombre del evento no puede estar vacío.", variant: "destructive" });
      return;
    }

    if (!participantName.trim() || !participantWhatsapp) {
      toast({ title: "Error", description: "Por favor completa tu nombre y número de WhatsApp.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Crear o obtener el usuario
      const user = await UserService.getOrCreateUser(participantWhatsapp, participantName);

      // Crear el evento usando el ID del usuario
      const eventData = await EventService.createEvent(eventName, user.id);
      const eventId = eventData.id;

      // Crear el participante (host) del evento
      const participantData = await EventService.createHostParticipant(eventId, user.id, user.name);

      // Guardar la información del usuario
      const userStorage = { id: user.id, whatsapp: participantWhatsapp };
      localStorage.setItem("user_data", encrypt(JSON.stringify(userStorage)));

      // Guardar la información del participante del evento
      setEventParticipant(eventId, user.id, participantData.name);

      // Guardar la información del participante en el store
      setParticipant(participantName, participantWhatsapp);

      setAccessCode(eventData.access_code);
      setEventId(eventId);
      toast({ title: "¡Evento Creado!", description: `Nombre: ${eventName}, Código: ${eventData.access_code}` });

      setTimeout(() => {
        navigate(`/event/${eventId}`);
      }, 2000);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear el evento. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (accessCode && eventId) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
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
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-primary">{accessCode}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const joinUrl = `${window.location.origin}/join/${accessCode}`;
                    navigator.clipboard.writeText(joinUrl);
                    toast({
                      title: "Código copiado",
                      description: "El enlace para unirse al evento ha sido copiado al portapapeles.",
                    });
                  }}
                  className="h-8 w-8"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={() => navigate(`/event/${eventId}`)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Ir al Evento
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full bg-primary-foreground hover:bg-primary hover:text-primary-foreground"
            >
              Volver al Inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Nuevo Evento</CardTitle>
          <CardDescription className="text-muted-foreground">Dale un nombre a tu evento y completa tus datos para empezar.</CardDescription>
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
                className="bg-card border-input text-primary placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="participantName" className="text-muted-foreground">
                Tu Nombre
              </Label>
              <Input
                id="participantName"
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="bg-card border-input text-primary placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="participantWhatsapp" className="text-muted-foreground">
                Tu WhatsApp
              </Label>
              <PhoneInput
                country="ar"
                value={participantWhatsapp}
                onChange={setParticipantWhatsapp}
                inputProps={{
                  className: cn(
                    "flex h-10 w-full rounded-md border border-input bg-foreground pl-14 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground !text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  ),
                }}
                buttonClass="border-input bg-background hover:bg-accent hover:text-accent-foreground"
                dropdownClass="bg-foreground border-input"
                searchClass="bg-background border-input text-foreground"
                containerClass="w-full"
                inputStyle={{
                  width: "100%",
                  color: "hsl(var(--foreground))",
                }}
                buttonStyle={{
                  backgroundColor: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--input))",
                }}
                dropdownStyle={{
                  backgroundColor: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--input))",
                }}
                searchStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--input))",
                  color: "hsl(var(--foreground))",
                }}
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
