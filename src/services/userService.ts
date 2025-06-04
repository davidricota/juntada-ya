import { supabase } from "@/integrations/supabase/client";
import CryptoJS from "crypto-js";

export interface User {
  id: string;
  whatsapp_hash: string;
  name: string | null;
  created_at: string;
  last_active_at: string;
}

export class UserService {
  private static hashWhatsApp(whatsappNumber: string): string {
    return CryptoJS.SHA256(whatsappNumber).toString();
  }

  static async getUserByWhatsApp(whatsappNumber: string): Promise<User | null> {
    const whatsappHash = this.hashWhatsApp(whatsappNumber);
    const { data, error } = await supabase.from("users").select("*").eq("whatsapp_hash", whatsappHash).single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return data;
  }

  static async createUser(whatsappNumber: string, name: string): Promise<User> {
    const whatsappHash = this.hashWhatsApp(whatsappNumber);
    const { data, error } = await supabase
      .from("users")
      .insert({
        whatsapp_hash: whatsappHash,
        name,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrCreateUser(whatsappNumber: string, name: string): Promise<User> {
    const existingUser = await this.getUserByWhatsApp(whatsappNumber);
    if (existingUser) return existingUser;

    return this.createUser(whatsappNumber, name);
  }

  static async updateUser(userId: string, updates: { name?: string }): Promise<User> {
    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single();

    if (error) throw error;
    return data;
  }

  static async updateLastActive(userId: string): Promise<void> {
    const { error } = await supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", userId);

    if (error) throw error;
  }
}
