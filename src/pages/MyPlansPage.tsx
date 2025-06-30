import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { EventService } from "@/features/event-creation/api/eventService";
import { useParticipantStore } from "@/shared/stores/participantStore";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const fetchEvents = async (userId: string, navigate: ReturnType<typeof useNavigate>) => {
  const userStorage = useParticipantStore.getState().getUserStorage();
  if (
    !userStorage ||
    typeof userStorage !== "object" ||
    !userId ||
    typeof userId !== "string" ||
    userId.trim() === ""
  ) {
    navigate("/");
    return [];
  }
  // Obtener eventos donde el usuario es host
  const hostedEvents = await EventService.getEventsByHost(userId);
  // Obtener eventos donde el usuario es participante
  const participantEvents = await EventService.getEventsByParticipant(userId);
  // Combinar y eliminar duplicados
  const allEvents = [...hostedEvents, ...participantEvents];
  const uniqueEvents = Array.from(new Map(allEvents.map((event) => [event.id, event])).values());
  return uniqueEvents;
};

const MyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getUserStorage, getUserId } = useParticipantStore();
  const rawUserId = getUserId();
  const userId =
    typeof rawUserId === "string" && rawUserId.trim().length > 0 ? rawUserId : undefined;

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events", userId],
    queryFn: () => fetchEvents(userId ?? "", navigate),
    enabled: typeof userId === "string" && userId.length > 0,
  });

  const handleDeleteEvent = (planId: string) => {
    void EventService.deleteEvent(planId)
      .then(() => {
        toast.success("Evento eliminado", {
          description: "Plancito eliminado correctamente.",
        });
        void queryClient.invalidateQueries({ queryKey: ["events", userId] });
      })
      .catch(() => {
        toast.error("Error al eliminar evento", {
          description: "Error al eliminar el plancito.",
        });
      });
  };

  const handleCopyCode = (code: string) => {
    const joinUrl = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success("Código copiado", {
      description: "El enlace para unirse al evento ha sido copiado al portapapeles.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Cargando plancitos...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="container mx-auto p-4 text-center text-destructive">
        Error al cargar plancitos.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Plancitos</h1>
        <Button
          onClick={() => navigate("/create")}
          className="bg-primary text-primary-foreground border border-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Plancito
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>{event.name}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  Código: {event.access_code}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCode(event.access_code)}
                    className="h-6 w-6"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <br />
                Creado: {new Date(event.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Participantes: {Array.isArray(event.participants) ? event.participants.length : 0}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate(`/plan/${event.id}`)}
                className="text-primary-foreground"
              >
                Ver Plancito
              </Button>
              {typeof event.host_user_id === "string" &&
                typeof getUserStorage()?.id === "string" &&
                event.host_user_id === getUserStorage()?.id && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      void handleDeleteEvent(event.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {Array.isArray(events) && events.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No has creado ni te has unido a ningún plancito aún.
          </p>
          <Button className="mt-4" onClick={() => navigate("/create")}>
            Crear tu Primer Plancito
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyPlansPage;
