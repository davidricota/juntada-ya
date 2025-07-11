import { supabase } from "@/shared/integrations/supabase/client";
import CryptoJS from "crypto-js";

export interface User {
  id: string;
  whatsapp_hash: string;
  name: string | null;
  created_at: string;
  last_active_at: string;
}

// Cache para usuarios
const userCache = new Map<string, { data: User; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export class UserService {
  private static hashWhatsApp(whatsappNumber: string): string {
    return CryptoJS.SHA256(whatsappNumber).toString();
  }

  private static clearCache() {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        userCache.delete(key);
      }
    }
  }

  static async getUserByWhatsApp(whatsappNumber: string): Promise<User | null> {
    // Limpiar cache expirado
    this.clearCache();

    // Verificar cache
    const cached = userCache.get(whatsappNumber);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const whatsappHash = this.hashWhatsApp(whatsappNumber);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_hash", whatsappHash)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    // Guardar en cache
    userCache.set(whatsappNumber, { data, timestamp: Date.now() });

    return data;
  }

  static async createUser(whatsappNumber: string, name: string): Promise<User> {
    const whatsappHash = this.hashWhatsApp(whatsappNumber);
    const { data, error } = await supabase
      .from("users")
      .insert({
        whatsapp_hash: whatsappHash,
        name,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrCreateUser(whatsappNumber: string, name: string): Promise<User> {
    // Limpiar cache expirado
    this.clearCache();

    // Verificar cache
    const cached = userCache.get(whatsappNumber);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Intentar obtener el usuario existente
    let user = await this.getUserByWhatsApp(whatsappNumber);

    if (!user) {
      // Si no existe, crear uno nuevo
      user = await this.createUser(whatsappNumber, name);
      // Guardar en cache
      userCache.set(whatsappNumber, { data: user, timestamp: Date.now() });
    }

    return user;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Actualizar cache
    const whatsappHash = data.whatsapp_hash;
    userCache.set(whatsappHash, { data, timestamp: Date.now() });

    return data;
  }

  static async updateLastActive(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
  }

  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) throw error;

    // Limpiar cache
    for (const [key, value] of userCache.entries()) {
      if (value.data.id === userId) {
        userCache.delete(key);
        break;
      }
    }
  }
}
