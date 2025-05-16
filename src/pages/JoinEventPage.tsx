
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
// Ensure this path is exactly as the package name
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'; 
import 'react-phone-number-input/style.css'; // Estilos para el input de teléfono
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Estilos para react-phone-number-input para que coincidan con ShadCN Input
// Adaptado para que sea más similar a los inputs de ShadCN
const phoneInputStyles = "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

type EventType = {
  id: string;
  name: string;
  access_code: string;
};

const JoinEventPage: React.FC = () => {
  const { accessCode: routeAccessCode } = useParams<{ accessCode?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inputAccessCode, setInputAccessCode] = useState(routeAccessCode || '');
  const [event, setEvent] = useState<EventType | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined); // react-phone-number-input usa string | undefined
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const findEvent = async (codeToFind: string) => {
    if (!codeToFind.trim()) {
      toast({ title: 'Error', description: 'Ingresa un código de acceso.', variant: 'destructive' });
      return;
    }
    setIsLoadingEvent(true);
    setShowJoinForm(false); // Reset join form visibility
    setEvent(null); // Reset event state

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('access_code', codeToFind.trim().toUpperCase()) // Aseguramos que el código se busque en mayúsculas
      .maybeSingle(); // Usar maybeSingle para evitar error si no se encuentra

    if (error) {
      console.error('Error finding event:', error);
      toast({ title: 'Error', description: 'Error al buscar el evento. Intenta de nuevo.', variant: 'destructive' });
    } else if (!data) {
      toast({ title: 'Evento no encontrado', description: 'El código de acceso no es válido o el evento no existe.', variant: 'destructive' });
    } else {
      setEvent(data as EventType);
      setShowJoinForm(true);
      toast({ title: 'Evento Encontrado', description: `Te unirás a: ${data.name}`});
    }
    setIsLoadingEvent(false);
  };
  
  useEffect(() => {
    if (routeAccessCode) {
      setInputAccessCode(routeAccessCode.toUpperCase()); // Normalizar a mayúsculas
      findEvent(routeAccessCode.toUpperCase());
    }
  }, [routeAccessCode]); // No es necesario toast aquí porque findEvent lo maneja


  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Por favor, ingresa tu nombre.', variant: 'destructive' });
      return;
    }
    if (!whatsapp || !isValidPhoneNumber(whatsapp)) {
      toast({ title: 'Error', description: 'Por favor, ingresa un número de WhatsApp válido.', variant: 'destructive' });
      return;
    }

    setIsJoining(true);
    const { data: participantData, error: participantError } = await supabase
      .from('event_participants')
      .insert({ event_id: event.id, name: name.trim(), whatsapp_number: whatsapp })
      .select()
      .single();

    if (participantError) {
      console.error('Error joining event:', participantError);
      // Comprobar si el error es por unique constraint (ej. mismo número de teléfono ya registrado para el evento)
      if (participantError.code === '23505') { // Código de error de PostgreSQL para violación de unicidad
        toast({ title: 'Error', description: 'Este número de WhatsApp ya está registrado en el evento.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'No se pudo unir al evento. Inténtalo más tarde.', variant: 'destructive' });
      }
    } else if (participantData) {
      toast({ title: '¡Te has unido!', description: `Bienvenido/a ${name} al evento ${event.name}!` });
      localStorage.setItem(`event_${event.id}_participant_id`, participantData.id);
      localStorage.setItem(`event_${event.id}_participant_name`, participantData.name);
      navigate(`/event/${event.id}`);
    }
    setIsJoining(false);
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen bg-spotify-dark">
      <Card className="w-full max-w-md bg-spotify-light-dark text-spotify-text shadow-xl">
        {!showJoinForm && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl text-spotify-green">Unirse a un Evento</CardTitle>
              <CardDescription className="text-spotify-text-muted">Ingresa el código de acceso del evento.</CardDescription>
            </CardHeader>
            <form onSubmit={(e) => { e.preventDefault(); findEvent(inputAccessCode); }}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="accessCode" className="text-spotify-text-muted">Código de Acceso</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    value={inputAccessCode}
                    onChange={(e) => setInputAccessCode(e.target.value.toUpperCase())}
                    placeholder="EJ: ABC123"
                    className="bg-card border-input text-foreground placeholder:text-muted-foreground"
                    maxLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoadingEvent} className="w-full bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark font-semibold">
                  {isLoadingEvent ? 'Buscando...' : 'Buscar Evento'}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {showJoinForm && event && (
          <form onSubmit={handleJoinSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl text-spotify-green">Unirse a: {event.name}</CardTitle>
              <CardDescription className="text-spotify-text-muted">Completa tus datos para unirte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-spotify-text-muted">Tu Nombre</Label>
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
                <Label htmlFor="whatsapp" className="text-spotify-text-muted">Número de WhatsApp</Label>
                 <PhoneInput
                  id="whatsapp"
                  placeholder="Ingresa tu número de WhatsApp"
                  value={whatsapp}
                  onChange={setWhatsapp} // setWhatsapp espera string | undefined
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="AR" 
                  className={phoneInputStyles} // Aplicamos los estilos aquí
                  // El input interno de react-phone-number-input usará estas clases
                  // La clase 'PhoneInputInput' se puede usar para estilizar el input más específicamente si es necesario
                />
                {whatsapp && !isValidPhoneNumber(whatsapp) && (
                  <p className="text-xs text-destructive mt-1">Número de WhatsApp inválido.</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isJoining} className="w-full bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark font-semibold">
                {isJoining ? 'Uniéndote...' : 'Unirme al Evento'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default JoinEventPage;
