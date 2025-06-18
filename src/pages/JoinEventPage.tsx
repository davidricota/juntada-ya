import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParticipantStore } from "@/stores/participantStore";
import { EventService } from "@/services/eventService";
import { UserService } from "@/services/userService";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { cn } from "@/lib/utils";
import { encrypt } from "@/lib/encryption";
import { useMutation } from "@tanstack/react-query";

const JoinEventPage: React.FC = () => {
  const { accessCode: urlAccessCode } = useParams();
  const [accessCode, setAccessCode] = useState(urlAccessCode || "");
  const [participantName, setParticipantName] = useState("");
  const [participantWhatsapp, setParticipantWhatsapp] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getName, getWhatsapp, setParticipant, setEventParticipant } = useParticipantStore();

  // Inicializar los campos con los valores almacenados si existen
  useEffect(() => {
    const storedName = getName();
    const storedWhatsapp = getWhatsapp();
    if (storedName) setParticipantName(storedName);
    if (storedWhatsapp) setParticipantWhatsapp(storedWhatsapp);
  }, [getName, getWhatsapp]);

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      if (!accessCode.trim()) {
        throw new Error("El código de acceso no puede estar vacío.");
      }

      if (!participantName.trim() || !participantWhatsapp) {
        throw new Error("Por favor completa tu nombre y número de WhatsApp.");
      }

      // Buscar el evento por código de acceso
      const event = await EventService.getEventByAccessCode(accessCode);
      if (!event) {
        throw new Error("Código de acceso inválido.");
      }

      // Obtener o crear el usuario
      const user = await UserService.getOrCreateUser(participantWhatsapp, participantName);
      if (!user) {
        throw new Error("No se pudo crear o obtener el usuario.");
      }

      // Verificar si ya es participante
      const existingParticipant = await EventService.isParticipant(event.id, participantWhatsapp);
      if (existingParticipant) {
        return { event, user, isExisting: true };
      }

      // Si no es participante, unirse al evento
      const participant = await EventService.joinEvent(
        event.id,
        participantWhatsapp,
        participantName
      );
      if (!participant) {
        throw new Error("No se pudo unir al evento.");
      }

      return { event, user, isExisting: false };
    },
    onSuccess: ({ event, user, isExisting }) => {
      // Guardar la información del usuario en localStorage
      setParticipant(participantName, participantWhatsapp);

      // Guardar user_data en localStorage
      const userData = {
        id: user.id,
        whatsapp_number: participantWhatsapp,
      };
      localStorage.setItem("user_data", encrypt(JSON.stringify(userData)));

      // Guardar la información del participante en localStorage
      setEventParticipant(event.id, user.id, participantName);

      if (!isExisting) {
        toast({ title: "¡Bienvenido!", description: `Te has unido al evento ${event.name}` });
      }

      navigate(`/plan/${event.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo unir al evento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    joinEventMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Unirse a un Evento</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa el código de acceso y tus datos para unirte.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="accessCode" className="text-muted-foreground">
                Código de Acceso
              </Label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Ingresa el código de acceso"
                required
                readOnly={!!urlAccessCode}
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
              disabled={joinEventMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {joinEventMutation.isPending ? "Uniéndose..." : "Unirse al Evento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default JoinEventPage;
