import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users } from "lucide-react";
import PlaylistTab from "@/components/PlaylistTab";
import PollsTab from "@/components/PollsTab";
import ExpensesTab from "@/components/ExpensesTab";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventService } from "@/services/eventService";
import { PlaylistService } from "@/services/playlistService";
import { YouTubeService, YouTubeVideo } from "@/services/youtubeService";
import YouTubeSongSearch from "@/components/YouTubeSongSearch";
import { RealtimeChannel } from "@supabase/supabase-js";
import { EventType, Participant, ParticipantChangePayload, PlaylistItem, PlaylistChangePayload } from "@/types";

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
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);

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
      try {
        // Fetch event details
        const eventData = await EventService.getEventById(eventId);
        if (!eventData) {
          toast({ title: "Error", description: "Evento no encontrado.", variant: "destructive" });
          navigate("/");
          return;
        }
        setEventDetails(eventData);

        // Fetch participants
        const participantsData = await EventService.getEventParticipants(eventId);
        setParticipants(participantsData);

        // Fetch playlist items
        const playlistData = await PlaylistService.getPlaylistItems(eventId);
        setPlaylistItems(playlistData);
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast({ title: "Error", description: "Error al cargar los datos del evento.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();

    // Subscribe to participants changes
    const participantsSubscription = EventService.subscribeToParticipants(eventId, (payload: ParticipantChangePayload) => {
      if (payload.eventType === "INSERT") {
        fetchEventData();
      }
    });

    // Subscribe to playlist changes
    const playlistSubscription = PlaylistService.subscribeToPlaylist(eventId, (payload: PlaylistChangePayload) => {
      if (payload.eventType === "DELETE") {
        setPlaylistItems((prevItems) => prevItems.filter((item) => item.id !== payload.old.id));
      } else if (payload.eventType === "INSERT") {
        // En lugar de recargar todo, solo agregamos el nuevo item
        const participant = participants.find((p) => p.id === payload.new.added_by_participant_id);
        const newItem: PlaylistItem = {
          id: payload.new.id,
          youtube_video_id: payload.new.youtube_video_id,
          title: payload.new.title,
          thumbnail_url: payload.new.thumbnail_url,
          channel_title: payload.new.channel_title,
          added_by_participant_id: payload.new.added_by_participant_id,
          event_id: payload.new.event_id,
          added_at: payload.new.added_at,
          participant_name: participant?.name || "Desconocido",
        };
        setPlaylistItems((prevItems) => [...prevItems, newItem]);
      }
    });

    setSubscriptions([participantsSubscription, playlistSubscription]);

    return () => {
      // Cleanup subscriptions
      subscriptions.forEach((subscription) => {
        if (subscription) {
          EventService.unsubscribeFromParticipants(subscription);
          PlaylistService.unsubscribeFromPlaylist(subscription);
        }
      });
    };
  }, [eventId, navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem(`event_${eventId}_participant_id`);
    localStorage.removeItem(`event_${eventId}_participant_name`);
    EventService.leaveEvent(eventId, currentParticipantId);
    navigate("/");
  };

  const handleSongSelected = async (song: YouTubeVideo) => {
    if (!currentParticipantId) {
      toast({ title: "Acción Requerida", description: "Debes unirte al evento para agregar canciones.", variant: "destructive" });
      return;
    }
    if (!eventDetails) return;

    try {
      await PlaylistService.addToPlaylist(eventDetails.id, currentParticipantId, {
        youtube_video_id: song.id,
        title: song.title,
        thumbnail_url: song.thumbnail,
        channel_title: song.channelTitle,
      });
      toast({ title: "¡Canción Agregada!", description: `${song.title} se añadió a la playlist.` });
    } catch (error) {
      console.error("Error adding song:", error);
      toast({ title: "Error", description: "No se pudo agregar la canción. Inténtalo de nuevo.", variant: "destructive" });
    }
  };
  if (isLoading) {
    return <div className="container mx-auto p-4 text-center text-spotify-text-muted">Cargando evento...</div>;
  }

  if (!eventDetails) {
    return <div className="container mx-auto p-4 text-center text-spotify-text-muted">Evento no encontrado.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="grid md:grid-cols-3 gap-6 w-full">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card text-card-foreground shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{eventDetails.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                Código de Acceso: <span className="font-semibold text-primary">{eventDetails.access_code}</span>
                {currentParticipantName && (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Conectado como: <span className="font-medium text-card-foreground">{currentParticipantName}</span>
                    </div>
                    <a onClick={handleLogout} className="font-bold cursor-pointer flex items-center gap-2 text-red-500">
                      <LogOut className="h-4 w-4" /> Abandonar Evento
                    </a>
                  </>
                )}
              </CardDescription>
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
              <TabsTrigger value="playlist" className="data-[state=inactive]:text-destructive">
                Playlist
              </TabsTrigger>
              <TabsTrigger value="polls" className="data-[state=inactive]:text-destructive">
                Encuestas
              </TabsTrigger>
              <TabsTrigger value="gastos" className="data-[state=inactive]:text-destructive">
                Gastos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="playlist">
              <PlaylistTab eventId={eventId} participants={participants} playlist={playlistItems} onPlaylistChange={setPlaylistItems} />
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
            <TabsContent value="gastos">
              {currentParticipantId ? (
                <ExpensesTab
                  eventId={eventId}
                  participants={participants}
                  currentParticipantId={currentParticipantId}
                  isHost={eventDetails?.host_id === currentParticipantId}
                />
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
                    para ver y agregar gastos.
                  </p>
                </Card>
              )}
            </TabsContent>
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
