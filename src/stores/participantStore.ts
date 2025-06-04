import { create } from "zustand";
import { persist } from "zustand/middleware";
import { encrypt, decrypt } from "@/lib/encryption";

interface Participant {
  name: string;
  phone: string;
  userId?: string;
}

interface EventParticipant {
  id: string;
  name: string;
}

interface UserStorage {
  id: string;
  whatsapp: string;
}

interface ParticipantState {
  participant: Participant | null;
  setParticipant: (name: string, phone: string, userId?: string) => void;
  setEventParticipant: (eventId: string, participantId: string, name: string) => void;
  getParticipant: () => Participant | null;
  getEventParticipant: (eventId: string) => EventParticipant | null;
  getUserStorage: () => UserStorage | null;
  getName: () => string | null;
  getWhatsapp: () => string | null;
  getUserId: () => string | null;
  clearParticipant: () => void;
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set, get) => ({
      participant: null,
      setParticipant: (name, phone, userId) => {
        const participant = { name, phone, userId };
        const encrypted = encrypt(JSON.stringify(participant));
        set({ participant: { name, phone, userId } });
        localStorage.setItem("participant_data", encrypted);
      },
      setEventParticipant: (eventId, participantId, name) => {
        const eventParticipant = { id: participantId, name };
        const encrypted = encrypt(JSON.stringify(eventParticipant));
        localStorage.setItem(`event_${eventId}_participant`, encrypted);
      },
      getParticipant: () => {
        const stored = localStorage.getItem("participant_data");
        if (!stored) return null;
        try {
          const decrypted = decrypt(stored);
          return JSON.parse(decrypted);
        } catch (error) {
          console.error("Error decrypting participant:", error);
          return null;
        }
      },
      getEventParticipant: (eventId) => {
        const stored = localStorage.getItem(`event_${eventId}_participant`);
        if (!stored) return null;
        try {
          const decrypted = decrypt(stored);
          return JSON.parse(decrypted);
        } catch (error) {
          console.error("Error decrypting event participant:", error);
          return null;
        }
      },
      getUserStorage: () => {
        const stored = localStorage.getItem("user_data");
        if (!stored) return null;
        try {
          const decrypted = decrypt(stored);
          return JSON.parse(decrypted);
        } catch (error) {
          console.error("Error decrypting user data:", error);
          return null;
        }
      },
      getName: () => {
        const participant = get().getParticipant();
        return participant?.name || null;
      },
      getWhatsapp: () => {
        const participant = get().getParticipant();
        return participant?.phone || null;
      },
      getUserId: () => {
        const userStorage = get().getUserStorage();
        return userStorage?.id || null;
      },
      clearParticipant: () => {
        set({ participant: null });
        localStorage.removeItem("participant_data");
        localStorage.removeItem("user_data");
        // Limpiar todos los event_participants
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("event_") && key.endsWith("_participant")) {
            localStorage.removeItem(key);
          }
        });
      },
    }),
    {
      name: "participant_data",
    }
  )
);
