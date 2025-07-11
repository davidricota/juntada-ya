import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventService } from "@/features/event-creation/api/eventService";
import { EventType } from "@/app/types";
import { useParticipantStore } from "@/shared/stores/participantStore";

export function useEvent(planId: string) {
  const queryClient = useQueryClient();
  const { getUserId } = useParticipantStore();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", planId],
    queryFn: () => EventService.getEvent(planId),
  });

  const { mutate: updateEvent } = useMutation({
    mutationFn: (updates: Partial<EventType>) => EventService.updateEvent(planId, updates),
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData(["event", planId], updatedEvent);
    },
  });

  const userId = getUserId();
  const isHost = event?.host_user_id === userId;

  return {
    event,
    isLoading,
    error,
    updateEvent,
    isHost,
  };
}
