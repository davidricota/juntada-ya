import React, { useEffect, useState, lazy, Suspense, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { LogOut, Users, Copy, UserPlus } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { EventService } from "@/features/event-creation/api/eventService";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ParticipantChangePayload, PlaylistItem, PlaylistChangePayload } from "@/app/types";
import { SearchDialog } from "@/widgets/EventTabs/ui/SearchDialog";
import { useParticipantStore } from "@/shared/stores/participantStore";
import JoinEventCard from "@/widgets/EventTabs/ui/JoinEventCard";
import EventInfoTab from "@/features/event-creation/ui/EventInfoTab";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlaylistService } from "@/features/playlist-management/api/playlistService";

// Lazy load components that are not immediately needed
const PlaylistTab = lazy(() => import("@/features/playlist-management/ui/PlaylistTab"));
const PollsTab = lazy(() => import("@/features/poll-voting/ui/PollsTab"));
const ExpensesTab = lazy(() => import("@/features/expense-splitting/ui/ExpensesTab"));

const fetchEvent = async (planId: string) => {
  const event = await EventService.getEvent(planId);
  return event;
};

const fetchParticipants = async (planId: string) => {
  const participants = await EventService.getEventParticipants(planId);
  return participants;
};

const fetchPlaylist = async (planId: string) => {
  const playlist = await PlaylistService.getPlaylist(planId);
  return playlist;
};

const PlanPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [currentParticipantName, setCurrentParticipantName] = useState<string>("");
  const [currentTab, setCurrentTab] = useState("info");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);
  const { getUserStorage, getUserId } = useParticipantStore();
  const userIdRef = useRef<string | null>(null);

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ["event", planId],
    queryFn: () => fetchEvent(planId!),
    enabled: !!planId && planId !== undefined,
  });

  const { data: participants = [], isLoading: isParticipantsLoading } = useQuery({
    queryKey: ["participants", planId],
    queryFn: () => fetchParticipants(planId!),
    enabled: !!planId && planId !== undefined,
  });

  const { data: playlist = [], isLoading: isPlaylistLoading } = useQuery({
    queryKey: ["playlist", planId],
    queryFn: () => fetchPlaylist(planId!),
    enabled: !!planId && planId !== undefined,
  });

  const isHost = typeof event?.host_user_id === "string" && event?.host_user_id === getUserId();

  const isLoading = isEventLoading || isParticipantsLoading || isPlaylistLoading;

  // Update current participant when participants change
  useEffect(() => {
    if (!Array.isArray(participants) || participants.length === 0 || !userIdRef.current) return;

    const currentParticipant = participants.find((p) => p.user_id === userIdRef.current);
    if (currentParticipant) {
      setCurrentParticipantId(currentParticipant.id);
      setCurrentParticipantName(currentParticipant.name);
    }
  }, [participants]);

  useEffect(() => {
    if (!planId || typeof planId !== "string" || planId.trim() === "") {
      navigate("/");
      return;
    }

    const userStorage = getUserStorage();
    const userId = getUserId();
    userIdRef.current = userId;

    if (!userStorage || typeof userId !== "string" || userId.trim() === "") {
      navigate("/");
      return;
    }

    // Check if user is already a participant
    const checkParticipant = () => {
      const currentParticipant = Array.isArray(participants)
        ? participants.find((p) => p.user_id === userId)
        : undefined;
      if (currentParticipant) {
        setCurrentParticipantId(currentParticipant.id);
        setCurrentParticipantName(currentParticipant.name);
      }
    };

    checkParticipant();

    // Subscribe to participants changes
    const participantsSubscription = EventService.subscribeToParticipants(
      planId,
      async (payload: ParticipantChangePayload) => {
        if (payload.eventType === "INSERT") {
          await queryClient.invalidateQueries({ queryKey: ["participants", planId] });
        }
      }
    );

    // Subscribe to playlist changes
    const playlistSubscription = PlaylistService.subscribeToPlaylist(
      planId,
      async (payload: PlaylistChangePayload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
          await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
        }
      }
    );

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
  }, [planId, navigate, queryClient]);

  const handleLogout = () => {
    const { clearParticipant } = useParticipantStore.getState();
    clearParticipant();
    navigate("/");
  };

  const handleSongSelected = async (
    videoData: Omit<
      PlaylistItem,
      "id" | "event_id" | "added_by_user_id" | "added_at" | "participant_name"
    >
  ) => {
    if (!planId || !currentParticipantId) return;

    try {
      await PlaylistService.addToPlaylist(planId, currentParticipantId, videoData);
      await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      setIsSearchOpen(false);
      toast.success("¡Canción Agregada!", {
        description: `${videoData.title} se añadió a la playlist.`,
      });
    } catch (error) {
      toast.error("Error al agregar canción", {
        description: "No se pudo agregar la canción a la playlist",
      });
    }
  };

  const handleRemoveSong = async (itemId: string) => {
    try {
      await PlaylistService.removeFromPlaylist(itemId);
      await queryClient.invalidateQueries({ queryKey: ["playlist", planId] });
      toast.success("Canción Eliminada", {
        description: "La canción ha sido eliminada de la playlist",
      });
    } catch (error) {
      toast.error("Error al eliminar canción", {
        description: "No se pudo eliminar la canción de la playlist",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Cargando plancito...
      </div>
    );
  }

  if (!event || typeof event !== "object") {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Evento no encontrado.
      </div>
    );
  }

  return (
    <div className="w-full px-2 md:px-6">
      <div className="grid md:grid-cols-3 gap-6 w-full">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card text-card-foreground shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">
                {event?.name}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                <div className="flex items-center gap-2">
                  Código de Acceso:{" "}
                  <span className="font-semibold text-primary">{event?.access_code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const joinUrl = `${window.location.origin}/join/${event?.access_code}`;
                      navigator.clipboard.writeText(joinUrl);
                      toast.success("Código copiado", {
                        description:
                          "El enlace para unirse al evento ha sido copiado al portapapeles.",
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
                      Conectado como:{" "}
                      <span className="font-medium text-card-foreground">
                        {currentParticipantName}
                      </span>
                    </div>
                    <a
                      onClick={handleLogout}
                      className="font-bold cursor-pointer flex items-center gap-2 text-red-500"
                    >
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
                <Users className="mr-2 h-5 w-5 text-primary" /> Participantes ({participants.length}
                )
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-screen rounded-lg pr-2 md:pr-4">
                {Array.isArray(participants) && participants.length > 0 ? (
                  <ul className="space-y-3">
                    {participants.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 p-2 bg-primary text-primary-foreground rounded-md shadow"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${p.name}.png?size=40`}
                            alt={p.name}
                          />
                          <AvatarFallback>{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.is_extra && (
                          <UserPlus
                            className="inline h-4 w-4 text-primary-foreground ml-1"
                            title="Participante extra"
                          />
                        )}
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
          <Tabs
            defaultValue="info"
            className="w-full"
            onValueChange={(value) => setCurrentTab(value)}
          >
            <TabsList>
              <TabsTrigger value="info" className="data-[state=inactive]:text-destructive">
                Información
              </TabsTrigger>
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
            <TabsContent value="info">
              <Suspense fallback={<div className="text-center p-4">Cargando información...</div>}>
                <EventInfoTab planId={planId} isHost={isHost} />
              </Suspense>
            </TabsContent>
            <TabsContent value="playlist" forceMount>
              <Suspense fallback={<div className="text-center p-4">Cargando playlist...</div>}>
                <PlaylistTab
                  planId={planId}
                  participants={participants}
                  playlist={playlist}
                  currentParticipantId={currentParticipantId}
                  accessCode={event?.access_code || ""}
                  isHost={isHost}
                  isLoading={isLoading}
                  currentTab={currentTab}
                  onRemoveSong={handleRemoveSong}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="polls">
              <Suspense fallback={<div className="text-center p-4">Cargando encuestas...</div>}>
                <PollsTab
                  planId={planId}
                  currentParticipantId={currentParticipantId}
                  isHost={isHost}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="gastos">
              <Suspense fallback={<div className="text-center p-4">Cargando gastos...</div>}>
                {currentParticipantId ? (
                  <ExpensesTab
                    planId={planId}
                    participants={participants}
                    currentParticipantId={currentParticipantId}
                    isHost={isHost}
                  />
                ) : (
                  <JoinEventCard
                    accessCode={event?.access_code || ""}
                    message="unirte al evento para ver y agregar gastos"
                  />
                )}
              </Suspense>
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

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSongSelected={handleSongSelected}
      />
    </div>
  );
};

export default PlanPage;
