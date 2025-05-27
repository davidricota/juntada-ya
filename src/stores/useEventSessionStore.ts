// stores/useEventSessionStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Attendee = {
  name: string;
  whatsapp_number: string;
};

type EventSessionState = {
  sessions: Record<string, Attendee>; // clave = eventId
  setSession: (eventId: string, attendee: Attendee) => void;
  getSession: (eventId: string) => Attendee | undefined;
  clearSession: (eventId: string) => void;
};

export const useEventSessionStore = create(
  persist<EventSessionState>(
    (set, get) => ({
      sessions: {},
      setSession: (eventId, attendee) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [eventId]: attendee,
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
