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
  setSession: (planId: string, session: EventSession) => void;
  getSession: (planId: string) => EventSession | undefined;
  clearSession: (planId: string) => void;
}

export const useEventSessionStore = create(
  persist<EventSessionState>(
    (set, get) => ({
      sessions: {},
      setSession: (planId, session) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [planId]: session,
          },
        })),
      getSession: (planId) => get().sessions[planId],
      clearSession: (planId) =>
        set((state) => {
          const { [planId]: _, ...rest } = state.sessions;
          return { sessions: rest };
        }),
    }),
    {
      name: "event-sessions",
    }
  )
);
