import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useParticipantStore } from "@/stores/participantStore";
import { EventService } from "@/services/eventService";
import { UserService } from "@/services/userService";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { cn } from "@/lib/utils";

const JoinEventPage: React.FC = () => {
  const [accessCode, setAccessCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantWhatsapp, setParticipantWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    if (!accessCode.trim()) {
      toast({ title: "Error", description: "El código de acceso no puede estar vacío.", variant: "destructive" });
      return;
    }

    if (!participantName.trim() || !participantWhatsapp) {
      toast({ title: "Error", description: "Por favor completa tu nombre y número de WhatsApp.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Buscar el evento por código de acceso
      const event = await EventService.getEventByAccessCode(accessCode);
      if (!event) {
        toast({ title: "Error", description: "Código de acceso inválido.", variant: "destructive" });
        return;
      }

      // Obtener o crear el usuario
      const user = await UserService.getOrCreateUser(participantWhatsapp, participantName);

      // Verificar si ya es participante
      const existingParticipant = await EventService.isParticipant(event.id, participantWhatsapp);
      if (existingParticipant) {
        // Si ya es participante, guardar la información y redirigir
        setParticipant(participantName, participantWhatsapp);
        setEventParticipant(event.id, user.id, participantName);
        navigate(`/event/${event.id}`);
        return;
      }

      // Si no es participante, unirse al evento
      const participant = await EventService.joinEvent(event.id, participantWhatsapp, participantName);

      // Guardar la información del participante
      setParticipant(participantName, participantWhatsapp);
      setEventParticipant(event.id, user.id, participantName);

      toast({ title: "¡Bienvenido!", description: `Te has unido al evento ${event.name}` });
      navigate(`/event/${event.id}`);
    } catch (error) {
      console.error("Error joining event:", error);
      toast({ title: "Error", description: "No se pudo unir al evento. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Unirse a un Evento</CardTitle>
          <CardDescription className="text-muted-foreground">Ingresa el código de acceso y tus datos para unirte.</CardDescription>
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
              {isLoading ? "Uniéndose..." : "Unirse al Evento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default JoinEventPage;
