import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateAccessCode } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useParticipantStore } from "@/stores/participantStore";
import { StorageService } from "@/services/storageService";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { cn } from "@/lib/utils";
import { EncryptionService } from "@/services/encryptionService";

const CreateEventPage: React.FC = () => {
  const [eventName, setEventName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantWhatsapp, setParticipantWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getName, getWhatsapp, setParticipant } = useParticipantStore();

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

    let newAccessCode = generateAccessCode();
    let eventCreated = false;
    let attempts = 0;
    let createdEventData = null;

    try {
      // Intentar generar un código de acceso único
      while (!eventCreated && attempts < 5) {
        attempts++;
        const encryptedWhatsapp = StorageService.encrypt(participantWhatsapp);

        console.log("=== Creando Evento ===");
        console.log("WhatsApp Original:", participantWhatsapp);
        console.log("WhatsApp Encriptado:", encryptedWhatsapp);

        const { data, error } = await supabase
          .from("events")
          .insert({
            name: eventName,
            access_code: newAccessCode,
            host_id: encryptedWhatsapp,
          })
          .select()
          .single();

        if (error) {
          if (error.message.includes('duplicate key value violates unique constraint "events_access_code_key"')) {
            newAccessCode = generateAccessCode();
          } else {
            throw error;
          }
        } else {
          createdEventData = data;
          eventCreated = true;
        }
      }

      if (!eventCreated || !createdEventData) {
        throw new Error("No se pudo generar un código de acceso único");
      }

      // Guardar el WhatsApp encriptado en el storage después de tener el ID del evento
      const encryptedWhatsapp = StorageService.encrypt(participantWhatsapp);
      StorageService.setItem(`event_${createdEventData.id}_whatsapp`, encryptedWhatsapp);

      // Agregar al creador como participante usando el mismo valor encriptado
      console.log("=== Agregando Participante ===");
      console.log("WhatsApp Original:", participantWhatsapp);
      console.log("WhatsApp Encriptado:", encryptedWhatsapp);

      const { data: participantData, error: participantError } = await supabase
        .from("event_participants")
        .insert({
          event_id: createdEventData.id,
          name: participantName,
          whatsapp_number: encryptedWhatsapp,
        })
        .select()
        .single();

      if (participantError) throw participantError;

      // Guardar la información del participante en el store
      setParticipant(participantName, participantWhatsapp);
      console.log("=== Guardando en LocalStorage ===");
      console.log("Participant Data:", participantData);
      console.log("Participant ID:", participantData.id);
      console.log("Participant Name:", participantName);

      // Guardar en localStorage para mantener la sesión
      StorageService.setItem(`event_${createdEventData.id}_participant_id`, participantData.id);
      StorageService.setItem(`event_${createdEventData.id}_participant_name`, participantName);

      setAccessCode(createdEventData.access_code);
      setEventId(createdEventData.id);
      toast({ title: "¡Evento Creado!", description: `Nombre: ${eventName}, Código: ${createdEventData.access_code}` });
    } catch (error) {
      console.error("Error creating event:", error);
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
