
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import YouTubeSongSearch from '@/components/YouTubeSongSearch'; // Reutilizamos el buscador
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ListMusic, Youtube } from 'lucide-react';

type EventDetails = {
  id: string;
  name: string;
  access_code: string;
  created_at: string;
};

type Participant = {
  id: string;
  name: string;
  whatsapp_number: string;
};

type PlaylistItem = {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  added_by_participant_id: string;
  participant_name?: string; // Para mostrar quién la añadió
};

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [currentParticipantName, setCurrentParticipantName] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      navigate('/');
      return;
    }

    const participantId = localStorage.getItem(`event_${eventId}_participant_id`);
    const participantName = localStorage.getItem(`event_${eventId}_participant_name`);
    
    if (!participantId) {
      // Si no hay ID de participante para este evento, quizás deba unirse primero
      // O si el código de acceso se usó para llegar aquí, pedir unirse.
      // Por ahora, si no hay ID, no podrá añadir canciones.
      // Redirigir a join si es necesario es una mejora futura.
      toast({ title: "Información", description: "No estás registrado como participante en este evento. Para añadir canciones, únete primero.", variant: "default"});
    }
    setCurrentParticipantId(participantId);
    setCurrentParticipantName(participantName);


    const fetchEventData = async () => {
      setIsLoading(true);
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        toast({ title: 'Error', description: 'Evento no encontrado.', variant: 'destructive' });
        navigate('/');
        return;
      }
      setEventDetails(eventData);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId);
      
      if (participantsData) setParticipants(participantsData);

      // Fetch playlist items and map participant names
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlist_items')
        .select(`
          *,
          event_participants ( name )
        `)
        .eq('event_id', eventId)
        .order('added_at', { ascending: true });

      if (playlistData) {
        const itemsWithNames = playlistData.map((item: any) => ({
          ...item,
          participant_name: item.event_participants?.name || 'Desconocido'
        }));
        setPlaylistItems(itemsWithNames);
      }
      
      setIsLoading(false);
    };

    fetchEventData();

    // Suscripción a cambios en la playlist (realtime)
    const playlistSubscription = supabase
      .channel(`playlist_items_event_${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'playlist_items', filter: `event_id=eq.${eventId}` },
        async (payload) => {
          console.log('Playlist change received!', payload);
          // Fetch the new item with participant name
           const { data: newItemWithParticipant, error } = await supabase
            .from('playlist_items')
            .select('*, event_participants (name)')
            .eq('id', (payload.new as PlaylistItem).id)
            .single();

          if (error) {
            console.error("Error fetching new item with participant", error);
            // Fallback: add without participant name or re-fetch all
            setPlaylistItems(prevItems => [...prevItems, payload.new as PlaylistItem]);
          } else if (newItemWithParticipant) {
             const formattedNewItem = {
              ...newItemWithParticipant,
              participant_name: (newItemWithParticipant as any).event_participants?.name || 'Desconocido'
            };
            setPlaylistItems(prevItems => [...prevItems, formattedNewItem]);
          }
        }
      )
      .subscribe();
    
    // Suscripción a cambios en participantes (realtime)
    const participantsSubscription = supabase
      .channel(`event_participants_event_${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_participants', filter: `event_id=eq.${eventId}` },
        (payload) => {
          console.log('Participant change received!', payload);
          setParticipants(prevParticipants => [...prevParticipants, payload.new as Participant]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playlistSubscription);
      supabase.removeChannel(participantsSubscription);
    };

  }, [eventId, navigate, toast]);

  const handleSongSelected = async (song: { id: string; title: string; thumbnail: string; channelTitle: string; }) => {
    if (!currentParticipantId) {
      toast({ title: 'Acción Requerida', description: 'Debes unirte al evento para agregar canciones.', variant: 'destructive'});
      // Podríamos ofrecer un botón para ir a la página de "unirse" con el código del evento actual.
      return;
    }
    if (!eventDetails) return;

    const { error } = await supabase
      .from('playlist_items')
      .insert({
        event_id: eventDetails.id,
        added_by_participant_id: currentParticipantId,
        youtube_video_id: song.id,
        title: song.title,
        thumbnail_url: song.thumbnail,
        channel_title: song.channelTitle
      });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo agregar la canción. Inténtalo de nuevo.', variant: 'destructive' });
      console.error("Error adding song:", error);
    } else {
      toast({ title: '¡Canción Agregada!', description: `${song.title} se añadió a la playlist.` });
      // La actualización en tiempo real debería manejar la visualización del nuevo ítem.
    }
  };


  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Cargando evento...</div>;
  }

  if (!eventDetails) {
    return <div className="container mx-auto p-4 text-center">Evento no encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card className="bg-spotify-dark text-spotify-text">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{eventDetails.name}</CardTitle>
          <CardDescription className="text-spotify-text-muted">Código de Acceso: <span className="font-semibold text-spotify-green">{eventDetails.access_code}</span></CardDescription>
           {currentParticipantName && <p className="text-sm text-spotify-text-muted">Conectado como: {currentParticipantName}</p>}
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-spotify-light-dark text-spotify-text">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-spotify-green" /> Participantes ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {participants.map(p => (
                    <li key={p.id} className="flex items-center gap-3 p-2 bg-spotify-dark rounded-md">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${p.name}.png`} alt={p.name} />
                        <AvatarFallback>{p.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{p.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-spotify-text-muted">Aún no hay participantes.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-spotify-light-dark text-spotify-text">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListMusic className="mr-2 h-5 w-5 text-spotify-green" /> Playlist Colaborativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {playlistItems.length > 0 ? (
                <ul className="space-y-3 max-h-[500px] overflow-y-auto">
                  {playlistItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3 p-2 bg-spotify-dark rounded-md hover:bg-opacity-80">
                      <img src={item.thumbnail_url || `https://via.placeholder.com/48x36?text=${item.title.charAt(0)}`} alt={item.title} className="w-12 h-9 rounded object-cover" />
                      <div className="flex-grow">
                        <p className="font-semibold text-sm leading-tight">{item.title}</p>
                        <p className="text-xs text-spotify-text-muted">{item.channel_title}</p>
                        <p className="text-xs text-spotify-text-muted/70">Añadido por: {item.participant_name}</p>
                      </div>
                       <a href={`https://www.youtube.com/watch?v=${item.youtube_video_id}`} target="_blank" rel="noopener noreferrer" title="Ver en YouTube">
                         <Youtube className="h-5 w-5 text-red-500 hover:text-red-400"/>
                       </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-spotify-text-muted text-center py-4">¡La playlist está vacía! Agrega la primera canción.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Aquí integramos el componente de búsqueda. Le pasaremos una función para manejar la selección de canción */}
          <YouTubeSongSearch onSongSelected={handleSongSelected} />
        </div>
      </div>

      <div className="text-center mt-8">
        <Button onClick={() => navigate('/')} variant="outline">
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};

export default EventPage;
