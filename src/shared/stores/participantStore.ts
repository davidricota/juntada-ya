import { create } from "zustand";
import { persist } from "zustand/middleware";
import { encrypt, decrypt } from "@/shared/lib/encryption";

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
  setEventParticipant: (planId: string, participantId: string, name: string) => void;
  getParticipant: () => Participant | null;
  getEventParticipant: (planId: string) => EventParticipant | null;
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
      setEventParticipant: (planId, participantId, name) => {
        const eventParticipant = { id: participantId, name };
        const encrypted = encrypt(JSON.stringify(eventParticipant));
        localStorage.setItem(`event_${planId}_participant`, encrypted);
      },
      getParticipant: () => {
        const stored = localStorage.getItem("participant_data");
        if (typeof stored !== "string" || stored.length === 0) return null;
        try {
          const decrypted = decrypt(stored);
          const parsed: unknown = JSON.parse(decrypted);
          if (isParticipant(parsed)) {
            return parsed;
          }
          return null;
        } catch {
          return null;
        }
      },
      getEventParticipant: (planId) => {
        const stored = localStorage.getItem(`event_${planId}_participant`);
        if (typeof stored !== "string" || stored.length === 0) return null;
        try {
          const decrypted = decrypt(stored);
          const parsed: unknown = JSON.parse(decrypted);
          if (isEventParticipant(parsed)) {
            return parsed;
          }
          return null;
        } catch {
          return null;
        }
      },
      getUserStorage: () => {
        const stored = localStorage.getItem("user_data");
        if (typeof stored !== "string" || stored.length === 0) return null;
        try {
          const decrypted = decrypt(stored);
          const parsed: unknown = JSON.parse(decrypted);
          if (isUserStorage(parsed)) {
            return parsed;
          }
          return null;
        } catch {
          return null;
        }
      },
      getName: () => {
        const participant = get().getParticipant();
        return typeof participant?.name === "string" && participant.name.length > 0
          ? participant.name
          : null;
      },
      getWhatsapp: () => {
        const participant = get().getParticipant();
        return typeof participant?.phone === "string" && participant.phone.length > 0
          ? participant.phone
          : null;
      },
      getUserId: () => {
        const userStorage = get().getUserStorage();
        return typeof userStorage?.id === "string" && userStorage.id.length > 0
          ? userStorage.id
          : null;
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

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null;
}

function isParticipant(obj: unknown): obj is Participant {
  return isRecord(obj) && typeof obj["name"] === "string" && typeof obj["phone"] === "string";
}

function isEventParticipant(obj: unknown): obj is EventParticipant {
  return isRecord(obj) && typeof obj["id"] === "string" && typeof obj["name"] === "string";
}

function isUserStorage(obj: unknown): obj is UserStorage {
  return isRecord(obj) && typeof obj["id"] === "string" && typeof obj["whatsapp"] === "string";
}
