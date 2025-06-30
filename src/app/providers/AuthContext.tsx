import React, { createContext, useContext, useState, useEffect } from "react";
import { useParticipantStore } from "@/shared/stores/participantStore";

interface AuthContextType {
  user: { phone: string } | null;
  login: (phone: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ phone: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getWhatsapp, getName, setParticipant, clearParticipant } = useParticipantStore();

  useEffect(() => {
    // Check for stored user data
    const whatsapp = getWhatsapp();
    if (typeof whatsapp === "string" && whatsapp.length > 0) {
      setUser({ phone: whatsapp });
    }
    setIsLoading(false);
  }, [getWhatsapp]);

  const login = (phone: string) => {
    const rawName = getName();
    const name = typeof rawName === "string" && rawName.length > 0 ? rawName : "Usuario"; // Si no hay nombre, usamos un valor por defecto
    setParticipant(name, phone);
    setUser({ phone });
  };

  const logout = () => {
    setUser(null);
    clearParticipant();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
