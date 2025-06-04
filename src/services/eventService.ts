import { supabase } from "@/integrations/supabase/client";
import { EventType, Participant, ParticipantChangePayload } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { UserService } from "./userService";
import { generateAccessCode } from "@/lib/utils";

export class EventService {
  static async getEvent(eventId: string): Promise<EventType & { participants?: Participant[] }> {
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
          created_at
        )
      `
      )
      .eq("id", eventId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Event not found");

    return {
      ...data,
      participants: data.participants || [],
    };
  }

  static async getEventByAccessCode(accessCode: string): Promise<(EventType & { participants?: Participant[] }) | null> {
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
          created_at
        )
      `
      )
      .eq("access_code", accessCode)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return {
      ...data,
      participants: data.participants || [],
    };
  }

  static async isParticipant(eventId: string, whatsappNumber: string): Promise<Participant | null> {
    const user = await UserService.getUserByWhatsApp(whatsappNumber);
    if (!user) return null;

    const { data, error } = await supabase.from("event_participants").select("*").eq("event_id", eventId).eq("user_id", user.id).single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return data;
  }

  static async getEventParticipants(eventId: string): Promise<Participant[]> {
    const { data, error } = await supabase.from("event_participants").select("*").eq("event_id", eventId).order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async joinEvent(eventId: string, whatsappNumber: string, name: string): Promise<Participant> {
    const user = await UserService.getOrCreateUser(whatsappNumber, name);
    const { data, error } = await supabase
      .from("event_participants")
      .insert({
        event_id: eventId,
        user_id: user.id,
        name,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async leaveEvent(eventId: string, whatsappNumber: string): Promise<void> {
    const user = await UserService.getUserByWhatsApp(whatsappNumber);
    if (!user) return;

    const { error } = await supabase.from("event_participants").delete().match({ event_id: eventId, user_id: user.id });

    if (error) throw error;
  }

  static async createEvent(name: string, userId: string): Promise<EventType> {
    const accessCode = generateAccessCode();
    let eventCreated = false;
    let attempts = 0;
    let createdEvent = null;

    // Intentar generar un código de acceso único
    while (!eventCreated && attempts < 5) {
      attempts++;
      const { data, error } = await supabase
        .from("events")
        .insert({
          name,
          access_code: accessCode,
          host_user_id: userId,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint "events_access_code_key"')) {
          // Si el código ya existe, generamos uno nuevo y lo intentamos de nuevo
          continue;
        }
        throw error;
      }

      createdEvent = data;
      eventCreated = true;
    }

    if (!eventCreated || !createdEvent) {
      throw new Error("No se pudo generar un código de acceso único");
    }

    // Obtener el usuario para usar su nombre
    const { data: userData, error: userError } = await supabase.from("users").select("name").eq("id", userId).single();
    if (userError) throw userError;

    // Agregar al creador como participante
    const { error: participantError } = await supabase.from("event_participants").insert({
      event_id: createdEvent.id,
      user_id: userId,
      name: userData.name || "Host",
    });

    if (participantError) throw participantError;

    return createdEvent;
  }

  static async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) throw error;
  }

  static subscribeToParticipants(eventId: string, callback: (payload: ParticipantChangePayload) => void): RealtimeChannel {
    return supabase
      .channel(`participants:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          callback(payload as ParticipantChangePayload);
        }
      )
      .subscribe();
  }

  static unsubscribeFromParticipants(subscription: RealtimeChannel): void {
    subscription.unsubscribe();
  }

  static async getEventsByHost(userId: string): Promise<(EventType & { participants?: Participant[] })[]> {
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
          created_at
        )
      `
      )
      .eq("host_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map((event) => ({
      ...event,
      participants: event.participants || [],
    }));
  }

  static async getEventsByParticipant(userId: string): Promise<(EventType & { participants?: Participant[] })[]> {
    const { data: participantData, error: participantError } = await supabase.from("event_participants").select("event_id").eq("user_id", userId);

    if (participantError) throw participantError;
    if (!participantData.length) return [];

    const eventIds = participantData.map((p) => p.event_id);
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        *,
        participants:event_participants (
          id,
          event_id,
          user_id,
          name,
          created_at
        )
      `
      )
      .in("id", eventIds)
      .order("created_at", { ascending: false });

    if (eventsError) throw eventsError;
    return eventsData.map((event) => ({
      ...event,
      participants: event.participants || [],
    }));
  }
}
