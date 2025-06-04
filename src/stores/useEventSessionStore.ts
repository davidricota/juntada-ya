// stores/useEventSessionStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EventSession {
  eventName: string;
  description?: string;
  createdAt: string;
  hostPhone: string;
  accessCode: string;
  participants?: string[];
}

interface EventSessionState {
  sessions: Record<string, EventSession>;
  setSession: (eventId: string, session: EventSession) => void;
  getSession: (eventId: string) => EventSession | undefined;
  clearSession: (eventId: string) => void;
}

export const useEventSessionStore = create(
  persist<EventSessionState>(
    (set, get) => ({
      sessions: {},
      setSession: (eventId, session) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [eventId]: session,
          },
        })),
      getSession: (eventId) => get().sessions[eventId],
      clearSession: (eventId) =>
        set((state) => {
          const { [eventId]: _, ...rest } = state.sessions;
          return { sessions: rest };
        }),
    }),
    {
      name: "event-sessions",
    }
  )
);
