import { create } from "zustand";
import { persist } from "zustand/middleware";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET || "default_secret";

function encrypt(value: string) {
  return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
}

function decrypt(value: string) {
  const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

interface ParticipantState {
  encryptedName: string | null;
  encryptedWhatsapp: string | null;
  setParticipant: (name: string, whatsapp: string) => void;
  clearParticipant: () => void;
  getName: () => string | null;
  getWhatsapp: () => string | null;
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set, get) => ({
      encryptedName: null,
      encryptedWhatsapp: null,
      setParticipant: (name, whatsapp) => {
        set({
          encryptedName: encrypt(name),
          encryptedWhatsapp: encrypt(whatsapp),
        });
      },
      clearParticipant: () => set({ encryptedName: null, encryptedWhatsapp: null }),
      getName: () => {
        const encrypted = get().encryptedName;
        return encrypted ? decrypt(encrypted) : null;
      },
      getWhatsapp: () => {
        const encrypted = get().encryptedWhatsapp;
        return encrypted ? decrypt(encrypted) : null;
      },
    }),
    {
      name: "participant-storage",
    }
  )
);
