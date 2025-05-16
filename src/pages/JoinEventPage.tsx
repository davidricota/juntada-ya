
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { supabase } from '@/integrations/supabase/client'; // Comentado: Usaremos mock data
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const phoneInputStyles = "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

type EventType = {
  id: string;
  name: string;
  access_code: string;
};

// Mock Data
const mockEvents: EventType[] = [
  { id: 'mock1', name: 'Fiesta de Prueba', access_code: 'TEST123' },
  { id: 'mock2', name: 'Concierto Simulado', access_code: 'MUSICGO' },
];

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

  const findEventMock = async (codeToFind: string): Promise<EventType | null> => {
    return new Promise((resolve) => {
      setTimeout(() => { // Simular delay de red
        const foundEvent = mockEvents.find(e => e.access_code === codeToFind.trim().toUpperCase());
        resolve(foundEvent || null);
      }, 500);
    });
  };

  const findEvent = async (codeToFind: string) => {
    if (!codeToFind.trim()) {
      toast({ title: 'Error', description: 'Ingresa un código de acceso.', variant: 'destructive' });
      return;
    }
    setIsLoadingEvent(true);
    setShowJoinForm(false);
    setEvent(null);

    // const { data, error } = await supabase // Comentado
    //   .from('events')
    //   .select('*')
    //   .eq('access_code', codeToFind.trim().toUpperCase())
    //   .maybeSingle();

    const data = await findEventMock(codeToFind); // Usar mock function

    // if (error) { // Comentado
    //   console.error('Error finding event:', error);
    //   toast({ title: 'Error', description: 'Error al buscar el evento. Intenta de nuevo.', variant: 'destructive' });
    // } else 
    if (!data) {
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
      toast({ title: 'Error', description: 'Por favor, ingresa tu nombre.', variant: 'destructive' });
      return;
    }
    if (!whatsapp || !isValidPhoneNumber(whatsapp)) {
      toast({ title: 'Error', description: 'Por favor, ingresa un número de WhatsApp válido.', variant: 'destructive' });
      return;
    }

    setIsJoining(true);

    // Simulación de unión a evento
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay

    // const { data: participantData, error: participantError } = await supabase // Comentado
    //   .from('event_participants')
    //   .insert({ event_id: event.id, name: name.trim(), whatsapp_number: whatsapp })
    //   .select()
    //   .single();

    // Mock participant data
    const participantData = {
      id: `mock_participant_${Date.now()}`,
      event_id: event.id,
      name: name.trim(),
      whatsapp_number: whatsapp,
    };
    const participantError = null; // Simular éxito

    if (participantError) {
      console.error('Error joining event (mock):', participantError);
      // Comprobar si el error es por unique constraint (ej. mismo número de teléfono ya registrado para el evento)
      // if (participantError.code === '23505') { // Código de error de PostgreSQL para violación de unicidad // Comentado
      //   toast({ title: 'Error', description: 'Este número de WhatsApp ya está registrado en el evento.', variant: 'destructive' });
      // } else {
        toast({ title: 'Error (Mock)', description: 'No se pudo unir al evento. Inténtalo más tarde.', variant: 'destructive' });
      // }
    } else if (participantData) {
      toast({ title: '¡Te has unido! (Mock)', description: `Bienvenido/a ${name} al evento ${event.name}!` });
      localStorage.setItem(`event_${event.id}_participant_id`, participantData.id);
      localStorage.setItem(`event_${event.id}_participant_name`, participantData.name);
      // Guardamos también el número de WhatsApp, podría ser útil
      localStorage.setItem(`event_${event.id}_participant_whatsapp`, participantData.whatsapp_number);
      navigate(`/event/${event.id}`); // Navegar a la página del evento (que también deberá usar mock data)
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
                    placeholder="EJ: TEST123 o MUSICGO"
                    className="bg-card border-input text-foreground placeholder:text-muted-foreground"
                    maxLength={10} // Aumentado por si acaso los códigos mock son más largos
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
                  onChange={setWhatsapp}
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="AR" 
                  className={phoneInputStyles}
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

