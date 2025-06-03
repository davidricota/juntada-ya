import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ParticipantState {
  name: string | null;
  whatsapp: string | null;
  setParticipant: (name: string, whatsapp: string) => void;
  clearParticipant: () => void;
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set) => ({
      name: null,
      whatsapp: null,
      setParticipant: (name, whatsapp) => set({ name, whatsapp }),
      clearParticipant: () => set({ name: null, whatsapp: null }),
    }),
    {
      name: "participant-storage",
    }
  )
);
