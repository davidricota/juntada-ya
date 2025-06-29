import { supabase } from "@/integrations/supabase/client";
import { EventType, Participant, ParticipantChangePayload } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { UserService } from "./userService";
import type { Database } from "@/integrations/supabase/types";

// Cache para eventos
const eventCache = new Map<
  string,
  { data: EventType & { participants?: Participant[] }; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export class EventService {
  private static clearCache() {
    const now = Date.now();
    for (const [key, value] of eventCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        eventCache.delete(key);
      }
    }
  }

  static async getEvent(id: string): Promise<EventType> {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        participants:event_participants (
          id,
          event_id,
          user_id,
          name,
          created_at,
          is_extra
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as EventType;
  }

  static async updateEvent(id: string, updates: Partial<EventType>): Promise<EventType> {
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as EventType;
  }

  static async getEventByAccessCode(
    accessCode: string
  ): Promise<(EventType & { participants?: Participant[] }) | null> {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        name,
        access_code,
        host_user_id,
        created_at,
        participants:event_participants!inner (
          id,
          event_id,
          user_id,
          name,
          created_at,
          is_extra
        )
      `
      )
      .eq("access_code", accessCode)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    const result = {
      id: data.id,
      name: data.name,
      access_code: data.access_code,
      host_user_id: data.host_user_id,
      created_at: data.created_at,
      participants: data.participants || [],
    };

    // Guardar en cache
    eventCache.set(data.id, { data: result, timestamp: Date.now() });

    return result;
  }

  static async isParticipant(planId: string, whatsappNumber: string): Promise<Participant | null> {
    const user = await UserService.getUserByWhatsApp(whatsappNumber);
    if (!user) return null;

    const { data, error } = await supabase
      .from("event_participants")
      .select("id, event_id, user_id, name, created_at")
      .eq("event_id", planId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  static async getEventParticipants(planId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from("event_participants")
      .select("id, event_id, user_id, name, created_at, is_extra")
      .eq("event_id", planId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async joinEvent(
    planId: string,
    whatsappNumber: string,
    name: string
  ): Promise<Participant> {
    const user = await UserService.getOrCreateUser(whatsappNumber, name);
    const { data, error } = await supabase
      .from("event_participants")
      .insert({
        event_id: planId,
        user_id: user.id,
        name,
      })
      .select("id, event_id, user_id, name, created_at")
      .single();

    if (error) throw error;

    // Invalidar cache del evento
    eventCache.delete(planId);

    return data;
  }

  static async leaveEvent(planId: string, whatsappNumber: string): Promise<void> {
    const user = await UserService.getUserByWhatsApp(whatsappNumber);
    if (!user) return;

    const { error } = await supabase
      .from("event_participants")
      .delete()
      .match({ event_id: planId, user_id: user.id });

    if (error) throw error;

    // Invalidar cache del evento
    eventCache.delete(planId);
  }

  static async createEvent(
    name: string,
    hostUserId: string
  ): Promise<{ id: string; access_code: string }> {
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from("events")
      .insert({ name, access_code: accessCode, host_user_id: hostUserId })
      .select("id, access_code")
      .single();

    if (error) throw error;
    return data;
  }

  static async createHostParticipant(
    planId: string,
    userId: string,
    name: string
  ): Promise<{ id: string; name: string }> {
    const { data, error } = await supabase
      .from("event_participants")
      .insert({ event_id: planId, user_id: userId, name })
      .select("id, name")
      .single();

    if (error) throw error;

    // Invalidar cache del evento
    eventCache.delete(planId);

    return data;
  }

  static async deleteEvent(planId: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", planId);

    if (error) throw error;

    // Invalidar cache del evento
    eventCache.delete(planId);
  }

  static subscribeToParticipants(
    planId: string,
    callback: (payload: ParticipantChangePayload) => void
  ): RealtimeChannel {
    return supabase
      .channel(`participants:${planId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${planId}`,
        },
        (payload) => {
          // Invalidar cache cuando hay cambios
          eventCache.delete(planId);
          callback(payload as unknown as ParticipantChangePayload);
        }
      )
      .subscribe();
  }

  static unsubscribeFromParticipants(subscription: RealtimeChannel): void {
    supabase.removeChannel(subscription);
  }

  static async getEventsByHost(
    userId: string
  ): Promise<(EventType & { participants?: Participant[] })[]> {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        name,
        access_code,
        host_user_id,
        created_at,
        participants:event_participants (
          id,
          event_id,
          user_id,
          name,
          created_at,
          is_extra
        )
      `
      )
      .eq("host_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const results = data.map((event) => ({
      ...event,
      participants: event.participants || [],
    }));

    // Actualizar cache
    results.forEach((event) => {
      eventCache.set(event.id, { data: event, timestamp: Date.now() });
    });

    return results;
  }

  static async getEventsByParticipant(
    userId: string
  ): Promise<(EventType & { participants?: Participant[] })[]> {
    const { data: participantData, error: participantError } = await supabase
      .from("event_participants")
      .select("event_id")
      .eq("user_id", userId);

    if (participantError) throw participantError;
    if (!participantData.length) return [];

    const planIds = participantData.map((p) => p.event_id);

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        id,
        name,
        access_code,
        host_user_id,
        created_at,
        participants:event_participants (
          id,
          event_id,
          user_id,
          name,
          created_at,
          is_extra
        )
      `
      )
      .in("id", planIds)
      .order("created_at", { ascending: false });

    if (eventsError) throw eventsError;

    const results = eventsData.map((event) => ({
      ...event,
      participants: event.participants || [],
    }));

    // Actualizar cache
    results.forEach((event) => {
      eventCache.set(event.id, { data: event, timestamp: Date.now() });
    });

    return results;
  }
}
