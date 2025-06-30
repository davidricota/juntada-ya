import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { useParticipantStore } from "@/shared/stores/participantStore";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { cn } from "@/shared/lib/utils";
import { EventService } from "@/features/event-creation/api/eventService";
import { UserService } from "@/shared/api/userService";
import { encrypt } from "@/shared/lib/encryption";
import { Copy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const CreatePlanPage: React.FC = () => {
  const [eventName, setEventName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantWhatsapp, setParticipantWhatsapp] = useState("");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [planId, setplanId] = useState<string | null>(null);
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

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventName.trim()) {
        throw new Error("El nombre del plancito no puede estar vacío.");
      }

      if (!participantName.trim() || !participantWhatsapp) {
        throw new Error("Por favor completa tu nombre y número de WhatsApp.");
      }

      // Crear o obtener el usuario
      const user = await UserService.getOrCreateUser(participantWhatsapp, participantName);

      // Crear el evento usando el ID del usuario
      const eventData = await EventService.createEvent(eventName, user.id);
      const planId = eventData.id;

      // Crear el participante (host) del evento
      const participantData = await EventService.createHostParticipant(planId, user.id, user.name);

      return { eventData, user, participantData };
    },
    onSuccess: ({ eventData, user, participantData }) => {
      // Guardar la información del usuario
      const userStorage = { id: user.id, whatsapp: participantWhatsapp };
      localStorage.setItem("user_data", encrypt(JSON.stringify(userStorage)));

      // Guardar la información del participante del evento
      setEventParticipant(eventData.id, user.id, participantData.name);

      // Guardar la información del participante en el store
      setParticipant(participantName, participantWhatsapp);

      setAccessCode(eventData.access_code);
      setplanId(eventData.id);
      toast({
        title: "¡Plancito Creado!",
        description: `Nombre: ${eventName}, Código: ${eventData.access_code}`,
      });

      setTimeout(() => {
        navigate(`/plan/${eventData.id}`);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el plancito. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate();
  };

  if (accessCode && planId) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">¡Plancito Creado Exitosamente!</CardTitle>
            <CardDescription>
              Comparte este código con tus amigos para que puedan unirse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre del Plancito:</p>
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
                      description:
                        "El enlace para unirse al plancito ha sido copiado al portapapeles.",
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
              onClick={() => navigate(`/plan/${planId}`)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Ir al Plancito
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
          <CardTitle className="text-2xl">Crear Nuevo Plancito</CardTitle>
          <CardDescription className="text-muted-foreground">
            Dale un nombre a tu plancito y completa tus datos para empezar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="eventName" className="text-muted-foreground">
                Nombre del Plancito
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
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {createEventMutation.isPending ? "Creando..." : "Crear Plancito"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreatePlanPage;
