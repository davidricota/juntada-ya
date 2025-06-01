import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type PlaylistItem = {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  added_by_participant_id: string;
  participant_name?: string;
};

export type PlaylistChangePayload = RealtimePostgresChangesPayload<{
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  added_by_participant_id: string;
  event_id: string;
  created_at: string;
}>;

export class PlaylistService {
  static async getPlaylistItems(eventId: string): Promise<PlaylistItem[]> {
    const { data, error } = await supabase
      .from("playlist_items")
      .select(
        `
        *,
        event_participants ( name )
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

  static async addSong(
    eventId: string,
    participantId: string,
    song: {
      id: string;
      title: string;
      thumbnail: string;
      channelTitle: string;
    }
  ): Promise<PlaylistItem> {
    const { data, error } = await supabase
      .from("playlist_items")
      .insert({
        event_id: eventId,
        added_by_participant_id: participantId,
        youtube_video_id: song.id,
        title: song.title,
        thumbnail_url: song.thumbnail,
        channel_title: song.channelTitle,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PlaylistItem;
  }

  static async deleteSong(songId: string): Promise<void> {
    const { error } = await supabase.from("playlist_items").delete().eq("id", songId);

    if (error) throw error;
  }

  static subscribeToPlaylist(eventId: string, callback: (payload: PlaylistChangePayload) => void) {
    return supabase
      .channel(`playlist_items_event_${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "playlist_items", filter: `event_id=eq.${eventId}` }, callback)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "playlist_items", filter: `event_id=eq.${eventId}` }, callback)
      .subscribe();
  }

  static unsubscribeFromPlaylist(subscription: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(subscription);
  }
}
