import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type EventType = {
  id: string;
  name: string;
  access_code: string;
  created_at: string;
};

export type Participant = {
  id: string;
  name: string;
  whatsapp_number: string;
};

export type ParticipantChangePayload = RealtimePostgresChangesPayload<{
  id: string;
  name: string;
  whatsapp_number: string;
  event_id: string;
  created_at: string;
}>;

export class EventService {
  static async getEventById(eventId: string): Promise<EventType | null> {
    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single();

    if (error) throw error;
    return data as EventType;
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
