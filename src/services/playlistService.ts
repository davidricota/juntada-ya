import { supabase } from "@/integrations/supabase/client";
import { PlaylistItem, PlaylistChangePayload } from "@/types";

export class PlaylistService {
  static async getPlaylistItems(eventId: string): Promise<PlaylistItem[]> {
    const { data, error } = await supabase
      .from("playlist_items")
      .select(
        `
        *,
        event_participants!added_by_participant_id (
          name
        )
      `
      )
      .eq("event_id", eventId)
      .order("added_at", { ascending: true });

    if (error) throw error;
    return data.map((item) => ({
      ...item,
      participant_name: item.event_participants?.name || "Desconocido",
    })) as PlaylistItem[];
  }

  static async addToPlaylist(
    eventId: string,
    participantId: string,
    videoData: Omit<PlaylistItem, "id" | "event_id" | "added_by_participant_id" | "added_at" | "participant_name">
  ): Promise<PlaylistItem> {
    const { data, error } = await supabase
      .from("playlist_items")
      .insert({
        event_id: eventId,
        added_by_participant_id: participantId,
        youtube_video_id: videoData.youtube_video_id,
        title: videoData.title,
        channel_title: videoData.channel_title,
        thumbnail_url: videoData.thumbnail_url,
      })
      .select(
        `
        *,
        event_participants!added_by_participant_id (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      participant_name: data.event_participants?.name || "Desconocido",
    } as PlaylistItem;
  }

  static async removeFromPlaylist(itemId: string) {
    const { error } = await supabase.from("playlist_items").delete().eq("id", itemId);
    if (error) throw error;
  }

  static subscribeToPlaylist(eventId: string, callback: (payload: PlaylistChangePayload) => void) {
    return supabase
      .channel(`playlist_items_event_${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "playlist_items", filter: `event_id=eq.${eventId}` }, callback)
      .subscribe();
  }

  static unsubscribeFromPlaylist(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }
}
