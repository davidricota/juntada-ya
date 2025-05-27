import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import YouTubeSongSearch from "@/components/YouTubeSongSearch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ListMusic, Youtube, Users } from "lucide-react";
import PlaylistTab from "@/components/PlaylistTab";
import PollsTab from "@/components/PollsTab";
import { ScrollArea } from "@/components/ui/scroll-area";
type EventType = {
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

  const [eventDetails, setEventDetails] = useState<EventType | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [currentParticipantName, setCurrentParticipantName] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      navigate("/");
      return;
    }

    const participantId = localStorage.getItem(`event_${eventId}_participant_id`);
    const participantName = localStorage.getItem(`event_${eventId}_participant_name`);

    if (!participantId) {
      toast({
        title: "Información",
        description: "No estás registrado como participante en este evento. Para añadir canciones, únete primero usando el código del evento.",
        variant: "default",
      });
    }
    setCurrentParticipantId(participantId);
    setCurrentParticipantName(participantName);

    const fetchEventData = async () => {
      setIsLoading(true);
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single();

      if (eventError || !eventData) {
        toast({ title: "Error", description: "Evento no encontrado.", variant: "destructive" });
        navigate("/");
        return;
      }
      setEventDetails(eventData as EventType); // Cast to EventType

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase.from("event_participants").select("*").eq("event_id", eventId);

      if (participantsData) setParticipants(participantsData as Participant[]); // Cast to Participant[]

      // Fetch playlist items and map participant names
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlist_items")
        .select(
          `
          *,
          event_participants ( name )
        `
        )
        .eq("event_id", eventId)
        .order("added_at", { ascending: true });

      if (playlistData) {
        const itemsWithNames = playlistData.map((item: any) => ({
          ...item,
          participant_name: item.event_participants?.name || "Desconocido",
        })) as PlaylistItem[]; // Cast to PlaylistItem[]
        setPlaylistItems(itemsWithNames);
      }

      setIsLoading(false);
    };

    fetchEventData();

    // Suscripción a cambios en la playlist (realtime)
    const playlistSubscription = supabase
      .channel(`playlist_items_event_${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "playlist_items", filter: `event_id=eq.${eventId}` }, async (payload) => {
        console.log("Playlist change received!", payload);
        // Fetch the new item with participant name
        const { data: newItemWithParticipant, error } = await supabase
          .from("playlist_items")
          .select("*, event_participants (name)")
          .eq("id", (payload.new as PlaylistItem).id)
          .single();

        if (error) {
          console.error("Error fetching new item with participant", error);
          // Fallback: add without participant name or re-fetch all
          setPlaylistItems((prevItems) => [...prevItems, payload.new as PlaylistItem]);
        } else if (newItemWithParticipant) {
          const formattedNewItem = {
            ...(newItemWithParticipant as any), // Cast to any to access event_participants
            participant_name: (newItemWithParticipant as any).event_participants?.name || "Desconocido",
          } as PlaylistItem; // Cast to PlaylistItem
          setPlaylistItems((prevItems) => [...prevItems, formattedNewItem]);
        }
      })
      .subscribe();

    // Suscripción a cambios en participantes (realtime)
    const participantsSubscription = supabase
      .channel(`event_participants_event_${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_participants", filter: `event_id=eq.${eventId}` }, (payload) => {
        console.log("Participant change received!", payload);
        setParticipants((prevParticipants) => [...prevParticipants, payload.new as Participant]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playlistSubscription);
      supabase.removeChannel(participantsSubscription);
    };
  }, [eventId, navigate, toast]);

  const handleSongSelected = async (song: { id: string; title: string; thumbnail: string; channelTitle: string }) => {
    if (!currentParticipantId) {
      toast({ title: "Acción Requerida", description: "Debes unirte al evento para agregar canciones.", variant: "destructive" });
      return;
    }
    if (!eventDetails) return;
    console.log("Event details:", eventDetails);
    const { error } = await supabase.from("playlist_items").insert({
      event_id: eventDetails.id,
      added_by_participant_id: currentParticipantId,
      youtube_video_id: song.id,
      title: song.title,
      thumbnail_url: song.thumbnail,
      channel_title: song.channelTitle,
    });

    if (error) {
      toast({ title: "Error", description: "No se pudo agregar la canción. Inténtalo de nuevo.", variant: "destructive" });
      console.error("Error adding song:", error);
    } else {
      toast({ title: "¡Canción Agregada!", description: `${song.title} se añadió a la playlist.` });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center text-spotify-text-muted">Cargando evento...</div>;
  }

  if (!eventDetails) {
    return <div className="container mx-auto p-4 text-center text-spotify-text-muted">Evento no encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8 bg-background min-h-screen text-foreground">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-card text-card-foreground shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{eventDetails.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                Código de Acceso: <span className="font-semibold text-primary">{eventDetails.access_code}</span>
              </CardDescription>
              {currentParticipantName && (
                <p className="text-sm text-muted-foreground">
                  Conectado como: <span className="font-medium text-card-foreground">{currentParticipantName}</span>
                </p>
              )}
            </CardHeader>
          </Card>
          <Card className="bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle className="text-xl flex items-center text-primary">
                <Users className="mr-2 h-5 w-5 text-primary" /> Participantes ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-screen max-h-screen rounded-lg pr-4">
                {participants.length > 0 ? (
                  <ul className="space-y-3">
                    {participants.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-md shadow">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://avatar.vercel.sh/${p.name}.png?size=40`} alt={p.name} />
                          <AvatarFallback>{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{p.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">Aún no hay participantes.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="playlist" className="w-full">
            <TabsList>
              <TabsTrigger value="playlist">Playlist</TabsTrigger>
              <TabsTrigger value="polls">Encuestas</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
            </TabsList>
            <TabsContent value="playlist">
              <PlaylistTab playlistItems={playlistItems} />

              {currentParticipantId ? (
                <YouTubeSongSearch onSongSelected={handleSongSelected} />
              ) : (
                <Card className="bg-card text-card-foreground p-6 text-center shadow-lg">
                  <p className="text-muted-foreground">
                    Debes{" "}
                    <Button
                      variant="link"
                      onClick={() => navigate(`/join/${eventDetails?.access_code}`)}
                      className="p-0 h-auto text-primary hover:underline"
                    >
                      unirte al evento
                    </Button>{" "}
                    para agregar canciones.
                  </p>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="polls">
              <PollsTab eventId={eventId} currentParticipantId={currentParticipantId} />
            </TabsContent>
            <TabsContent value="gastos">Change your password here.</TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="text-center mt-12">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="border-muted-foreground text-muted-foreground hover:bg-muted hover:text-card-foreground"
        >
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};

export default EventPage;
