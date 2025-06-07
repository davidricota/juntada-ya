import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Copy } from "lucide-react";
import PlaylistTab from "@/components/PlaylistTab";
import PollsTab from "@/components/PollsTab";
import ExpensesTab from "@/components/ExpensesTab";
import JoinEventCard from "@/components/JoinEventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventService } from "@/services/eventService";
import { PlaylistService } from "@/services/playlistService";
import { YouTubeService, YouTubeVideo } from "@/services/youtubeService";
import YouTubeSongSearch from "@/components/YouTubeSongSearch";
import { RealtimeChannel } from "@supabase/supabase-js";
import { EventType, Participant, ParticipantChangePayload, PlaylistItem, PlaylistChangePayload } from "@/types";
import { EncryptionService } from "@/services/encryptionService";
import { SearchDialog } from "@/components/SearchDialog";
import { ParticipantsTab } from "@/components/ParticipantsTab";
import { useParticipantStore } from "@/stores/participantStore";
import { toast } from "sonner";

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<(EventType & { participants?: Participant[] }) | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [currentParticipantName, setCurrentParticipantName] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("playlist");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { getUserStorage, getUserId } = useParticipantStore();

  useEffect(() => {
    if (!eventId) {
      navigate("/");
      return;
    }

    const userStorage = getUserStorage();
    const userId = getUserId();

    if (!userStorage || !userId) {
      navigate("/");
      return;
    }

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const eventData = await EventService.getEvent(eventId);

        if (!eventData) {
          toast({ title: "Error", description: "Evento no encontrado.", variant: "destructive" });
          navigate("/");
          return;
        }

        setEvent(eventData);
        setParticipants(eventData.participants || []);

        // Encontrar el participante actual usando user_id
        const currentParticipant = eventData.participants?.find((p) => p.user_id === userId);

        if (currentParticipant) {
          setCurrentParticipantId(currentParticipant.id);
          setCurrentParticipantName(currentParticipant.name);
        } else {
          toast({
            title: "Información",
            description: "No estás registrado como participante en este evento. Para añadir canciones, únete primero usando el código del evento.",
            variant: "default",
          });
        }

        // Verificar si el usuario es el host
        const isUserHost = eventData.host_user_id === userId;

        setIsHost(isUserHost);

        // Fetch playlist items

        const playlistData = await PlaylistService.getPlaylistItems(eventId);

        setPlaylist(playlistData);
      } catch (error) {
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
        setPlaylist((prev) => prev.filter((item) => item.id !== payload.old.id));
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
        setPlaylist((prev) => [...prev, newItem]);
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

  useEffect(() => {
    const storedParticipantId = localStorage.getItem("currentParticipantId");
    setCurrentParticipantId(storedParticipantId);
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && participants.length > 0) {
      const userStorage = getUserStorage();
      if (!userStorage) {
        return;
      }
      const isParticipant = participants.some((p) => p.user_id === userStorage.id);
      if (!isParticipant) {
        toast({
          title: "Información",
          description: "No estás registrado como participante en este evento. Para añadir canciones, únete primero usando el código del evento.",
          variant: "default",
        });
      }
    }
  }, [isLoading, participants]);

  const handleLogout = () => {
    const { clearParticipant } = useParticipantStore.getState();
    clearParticipant();
    EventService.leaveEvent(eventId, currentParticipantId);
    navigate("/");
  };

  const handleSongSelected = async (videoData: Omit<PlaylistItem, "id" | "event_id" | "added_by_user_id" | "added_at" | "participant_name">) => {
    if (!eventId || !currentParticipantId) return;

    try {
      const newItem = await PlaylistService.addToPlaylist(eventId, currentParticipantId, videoData);
      setPlaylist((prev) => [...prev, newItem]);
      setIsSearchOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la canción a la playlist",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSong = async (itemId: string) => {
    try {
      await PlaylistService.removeFromPlaylist(itemId);
      setPlaylist((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la canción de la playlist",
        variant: "destructive",
      });
    }
  };

  // Find the current participant object
  const currentParticipant = participants.find((p) => p.id === currentParticipantId);

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center text-spotify-text-muted">Cargando evento...</div>;
  }

  if (!event) {
    return <div className="container mx-auto p-4 text-center text-spotify-text-muted">Evento no encontrado.</div>;
  }

  return (
    <div className="w-full px-2 md:px-6">
      <div className="grid md:grid-cols-3 gap-6 w-full">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card text-card-foreground shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{event.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                <div className="flex items-center gap-2">
                  Código de Acceso: <span className="font-semibold text-primary">{event.access_code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const joinUrl = `${window.location.origin}/join/${event.access_code}`;
                      navigator.clipboard.writeText(joinUrl);
                      toast({
                        title: "Código copiado",
                        description: "El enlace para unirse al evento ha sido copiado al portapapeles.",
                      });
                    }}
                    className="h-6 w-6"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
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
          <Card className="bg-card text-card-foreground shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center text-primary">
                <Users className="mr-2 h-5 w-5 text-primary" /> Participantes ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-screen rounded-lg pr-2 md:pr-4">
                {participants.length > 0 ? (
                  <ul className="space-y-3">
                    {participants.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 p-2  bg-primary text-primary-foreground rounded-md shadow">
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
          <Tabs defaultValue="playlist" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
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
            <TabsContent value="playlist" forceMount>
              <PlaylistTab
                eventId={eventId}
                participants={participants}
                playlist={playlist}
                onPlaylistChange={setPlaylist}
                currentParticipantId={currentParticipantId}
                accessCode={event.access_code || ""}
                isHost={isHost}
                isLoading={isLoading}
                currentTab={currentTab}
                onRemoveSong={handleRemoveSong}
              />
            </TabsContent>
            <TabsContent value="polls">
              <PollsTab eventId={eventId} currentParticipantId={currentParticipantId} isHost={isHost} />
            </TabsContent>
            <TabsContent value="gastos">
              {currentParticipantId ? (
                <ExpensesTab eventId={eventId} participants={participants} currentParticipantId={currentParticipantId} isHost={isHost} />
              ) : (
                <JoinEventCard accessCode={event.access_code || ""} message="unirte al evento para ver y agregar gastos" />
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

      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSongSelected={handleSongSelected} />
    </div>
  );
};

export default EventPage;
