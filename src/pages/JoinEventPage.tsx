import React, { useState, useEffect } from "react";
import { useEventSessionStore } from "@/stores/useEventSessionStore";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Importamos el cliente de Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'; // Comentado temporalmente
// import 'react-phone-number-input/style.css'; // Comentado temporalmente
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// const phoneInputStyles = "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"; // Comentado temporalmente

type EventType = {
  id: string;
  name: string;
  access_code: string;
};

const JoinEventPage: React.FC = () => {
  const { accessCode: routeAccessCode } = useParams<{ accessCode?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inputAccessCode, setInputAccessCode] = useState(routeAccessCode || "");
  const [event, setEvent] = useState<EventType | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined); // Mantenemos el tipo, pero la entrada será un Input normal
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const getSession = useEventSessionStore((s) => s.getSession);
  const setSession = useEventSessionStore((s) => s.setSession);
  const [attendee, setAttendee] = useState<{ name: string; whatsapp_number: string } | null>(null);

  useEffect(() => {
    if (!event) return;
    const existing = getSession(event.id);
    if (existing) {
      setAttendee(existing);
      navigate(`/event/${event.id}`);
    }
  }, [event, getSession]);

  const fetchEventById = async (accessCode: string): Promise<EventType | null> => {
    const { data, error } = await supabase.from("events").select("*").eq("access_code", accessCode).single();
    console.log("Data fetched from Supabase:", data); // Debugging line
    if (error || !data) {
      return null;
    }

    return data;
  };

  const findEvent = async (codeToFind: string) => {
    if (!codeToFind.trim()) {
      toast({ title: "Error", description: "Ingresa un código de acceso.", variant: "destructive" });
      return;
    }
    setIsLoadingEvent(true);
    setShowJoinForm(false);
    setEvent(null);

    const data = await fetchEventById(codeToFind);

    if (!data) {
      toast({ title: "Evento no encontrado", description: "El código de acceso no es válido o el evento no existe.", variant: "destructive" });
    } else {
      setEvent(data as EventType);
      setShowJoinForm(true);
      toast({ title: "Evento Encontrado", description: `Te unirás a: ${data.name}` });
    }
    setIsLoadingEvent(false);
  };

  useEffect(() => {
    if (routeAccessCode) {
      const upperCaseAccessCode = routeAccessCode.toUpperCase();
      setInputAccessCode(upperCaseAccessCode);
      findEvent(upperCaseAccessCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAccessCode]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!name.trim()) {
      toast({ title: "Error", description: "Por favor, ingresa tu nombre.", variant: "destructive" });
      return;
    }
    // Validación de WhatsApp comentada temporalmente, se podría añadir una validación simple si es necesario
    if (!whatsapp || whatsapp.trim().length < 7) {
      // Validación muy básica para el input de texto
      toast({ title: "Error", description: "Por favor, ingresa un número de WhatsApp válido.", variant: "destructive" });
      return;
    }

    setIsJoining(true);

    let participantData: { event_id: string; name: string; whatsapp_number: string; id?: string } = {
      event_id: event.id,
      name: name.trim(),
      whatsapp_number: whatsapp, // Guardamos el string del input
    };
    const { data, error: participantError } = await supabase.from("event_participants").insert([participantData]).select();
    console.log("Data fetched from Supabase:", data); // Debugging line

    if (participantError) {
      console.error("Error joining event :", participantError);
      toast({ title: "Error ", description: "No se pudo unir al evento. Inténtalo más tarde.", variant: "destructive" });
    } else if (data) {
      participantData = { ...participantData, id: data[0].id }; // Asignamos el ID del participante
      toast({ title: "¡Te has unido! ", description: `Bienvenido/a ${name} al evento ${event.name}!` });
      localStorage.setItem(`event_${event.id}_participant_id`, participantData.id);
      localStorage.setItem(`event_${event.id}_participant_name`, participantData.name);
      localStorage.setItem(`event_${event.id}_participant_whatsapp`, participantData.whatsapp_number);

      setSession(event.id, { name: participantData.name, whatsapp_number: participantData.whatsapp_number });
      setAttendee({ name: participantData.name, whatsapp_number: participantData.whatsapp_number });
      navigate(`/event/${event.id}`);
    }
    setIsJoining(false);
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-xl">
        {!showJoinForm && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Unirse a un Evento</CardTitle>
              <CardDescription className="text-muted-foreground">Ingresa el código de acceso del evento.</CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                findEvent(inputAccessCode);
              }}
            >
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="accessCode" className="text-muted-foreground">
                    Código de Acceso
                  </Label>
                  <Input
                    id="accessCode"
                    type="text"
                    value={inputAccessCode}
                    onChange={(e) => setInputAccessCode(e.target.value)}
                    placeholder="EJ: TEST123 o MUSICGO"
                    className="bg-card border-input text-foreground placeholder:text-muted-foreground"
                    maxLength={10}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoadingEvent}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isLoadingEvent ? "Buscando..." : "Buscar Evento"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {showJoinForm && event && !attendee && (
          <form onSubmit={handleJoinSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Unirse a: {event.name}</CardTitle>
              <CardDescription className="text-muted-foreground">Completa tus datos para unirte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-muted-foreground">
                  Tu Nombre
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  className="bg-card border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp" className="text-muted-foreground">
                  Número de WhatsApp
                </Label>
                {/* PhoneInput comentado y reemplazado por Input normal temporalmente */}
                <Input
                  id="whatsapp"
                  type="tel" // Usamos type="tel" para semántica
                  placeholder="Ingresa tu número de WhatsApp"
                  value={whatsapp || ""}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="bg-card border-input text-foreground placeholder:text-muted-foreground"
                  required
                />
                {/* Validación de PhoneInput comentada */}
                {/* {whatsapp && !isValidPhoneNumber(whatsapp) && (
                  <p className="text-xs text-destructive mt-1">Número de WhatsApp inválido.</p>
                )} */}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isJoining} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {isJoining ? "Uniéndote..." : "Unirme al Evento"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default JoinEventPage;
