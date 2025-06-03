import { supabase } from "@/integrations/supabase/client";
import { EventType, Participant, ParticipantChangePayload } from "@/types";

export class EventService {
  static async getEventById(eventId: string): Promise<EventType | null> {
    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single();

    if (error) throw error;
    return data as EventType;
  }

  static async getEventByAccessCode(accessCode: string): Promise<EventType | null> {
    const { data, error } = await supabase.from("events").select("*").eq("access_code", accessCode).single();

    if (error) throw error;
    return data as EventType;
  }

  static async isParticipant(eventId: string, whatsappNumber: string): Promise<Participant | null> {
    const { data, error } = await supabase
      .from("event_participants")
      .select("*")
      .eq("event_id", eventId)
      .eq("whatsapp_number", whatsappNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return data as Participant;
  }

  static async getEventParticipants(eventId: string): Promise<Participant[]> {
    const { data, error } = await supabase.from("event_participants").select("*").eq("event_id", eventId);

    if (error) throw error;
    return data as Participant[];
  }

  static async joinEvent(eventId: string, participantData: Omit<Participant, "id">): Promise<Participant> {
    const { data, error } = await supabase
      .from("event_participants")
      .insert({
        event_id: eventId,
        name: participantData.name,
        whatsapp_number: participantData.whatsapp_number,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  }

  static async leaveEvent(eventId: string, participantId: string) {
    const { error } = await supabase.from("event_participants").delete().eq("id", participantId).eq("event_id", eventId);
    if (error) throw error;
  }

  static subscribeToParticipants(eventId: string, callback: (payload: ParticipantChangePayload) => void) {
    return supabase
      .channel(`event_participants_event_${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_participants", filter: `event_id=eq.${eventId}` }, callback)
      .subscribe();
  }

  static unsubscribeFromParticipants(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }
}
