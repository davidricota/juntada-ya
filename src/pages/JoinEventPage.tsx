
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Estilos para el input de teléfono
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Estilos para react-phone-number-input para que coincidan con ShadCN Input
const phoneInputStyles = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";


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
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const findEvent = async (codeToFind: string) => {
    if (!codeToFind.trim()) {
      toast({ title: 'Error', description: 'Ingresa un código de acceso.', variant: 'destructive' });
      return;
    }
    setIsLoadingEvent(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('access_code', codeToFind.trim())
      .single();

    if (error || !data) {
      toast({ title: 'Error', description: 'Evento no encontrado o código incorrecto.', variant: 'destructive' });
      setEvent(null);
      setShowJoinForm(false);
    } else {
      setEvent(data as EventType);
      setShowJoinForm(true);
      toast({ title: 'Evento Encontrado', description: `Te unirás a: ${data.name}`});
    }
    setIsLoadingEvent(false);
  };
  
  useEffect(() => {
    if (routeAccessCode) {
      findEvent(routeAccessCode);
    }
  }, [routeAccessCode]);


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
      .insert({ event_id: event.id, name, whatsapp_number: whatsapp })
      .select()
      .single();

    if (participantError) {
      console.error('Error joining event:', participantError);
      toast({ title: 'Error', description: 'No se pudo unir al evento. Verifica si ya estás unido o inténtalo más tarde.', variant: 'destructive' });
    } else if (participantData) {
      toast({ title: '¡Te has unido!', description: `Bienvenido/a ${name} al evento ${event.name}!` });
      // Guardar info del participante para usarla en EventPage (ej. para añadir canciones)
      // Esto podría ser en localStorage o un context
      localStorage.setItem(`event_${event.id}_participant_id`, participantData.id);
      localStorage.setItem(`event_${event.id}_participant_name`, participantData.name);
      navigate(`/event/${event.id}`);
    }
    setIsJoining(false);
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md bg-spotify-light-dark text-spotify-text">
        {!showJoinForm && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Unirse a un Evento</CardTitle>
              <CardDescription>Ingresa el código de acceso del evento.</CardDescription>
            </CardHeader>
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
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => findEvent(inputAccessCode)} disabled={isLoadingEvent} className="w-full bg-spotify-green hover:bg-spotify-green/90 text-spotify-dark font-semibold">
                {isLoadingEvent ? 'Buscando...' : 'Buscar Evento'}
              </Button>
            </CardFooter>
          </>
        )}

        {showJoinForm && event && (
          <form onSubmit={handleJoinSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl">Unirse a: {event.name}</CardTitle>
              <CardDescription>Completa tus datos para unirte.</CardDescription>
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
                  onChange={setWhatsapp}
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="AR" // Puedes cambiar el país por defecto
                  className={phoneInputStyles} // Aplicamos los estilos aquí
                  // El input interno de react-phone-number-input puede tomar la clase
                  // inputComponent={Input} // Esto podría funcionar con ShadCN Input pero requiere más ajustes.
                                          // Por ahora, aplicamos estilos directos.
                />
                {whatsapp && !isValidPhoneNumber(whatsapp) && (
                  <p className="text-xs text-destructive">Número de WhatsApp inválido.</p>
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
