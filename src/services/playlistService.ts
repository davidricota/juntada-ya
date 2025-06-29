import { supabase } from "@/integrations/supabase/client";
import { PlaylistItem, PlaylistChangePayload } from "@/types";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Cache para playlists
const playlistCache = new Map<string, { data: PlaylistItem[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export class PlaylistService {
  private static clearCache() {
    const now = Date.now();
    for (const [key, value] of playlistCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        playlistCache.delete(key);
      }
    }
  }

  static async getPlaylistItems(planId: string): Promise<PlaylistItem[]> {
    // Limpiar cache expirado
    this.clearCache();

    // Verificar cache
    const cached = playlistCache.get(planId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from("playlist_items")
      .select(
        `
        id,
        youtube_video_id,
        title,
        thumbnail_url,
        channel_title,
        added_by_participant_id,
        event_id,
        added_at,
        participant:event_participants (
          name
        )
      `
      )
      .eq("event_id", planId)
      .order("added_at", { ascending: true });

    if (error) throw error;

    const items = data.map((item) => ({
      ...item,
      participant_name: item.participant?.name || "Desconocido",
    }));

    // Guardar en cache
    playlistCache.set(planId, { data: items, timestamp: Date.now() });

    return items;
  }

  static async addToPlaylist(
    planId: string,
    participantId: string,
    videoData: Omit<
      PlaylistItem,
      "id" | "event_id" | "added_by_participant_id" | "added_at" | "participant_name"
    >
  ): Promise<PlaylistItem> {
    try {
      console.log("PlaylistService.addToPlaylist called with:", {
        planId,
        participantId,
        videoData,
      });

      const { data, error } = await supabase
        .from("playlist_items")
        .insert({
          event_id: planId,
          added_by_participant_id: participantId,
          youtube_video_id: videoData.youtube_video_id,
          title: videoData.title,
          thumbnail_url: videoData.thumbnail_url,
          channel_title: videoData.channel_title,
        })
        .select(
          `
          id,
          youtube_video_id,
          title,
          thumbnail_url,
          channel_title,
          added_by_participant_id,
          event_id,
          added_at,
          participant:event_participants (
            name
          )
        `
        )
        .single();

      if (error) {
        console.error("Supabase error in addToPlaylist:", error);
        throw error;
      }

      console.log("Supabase insert successful:", data);

      const item = {
        ...data,
        participant_name: data.participant?.name || "Desconocido",
      };

      // Actualizar cache
      const cached = playlistCache.get(planId);
      if (cached) {
        playlistCache.set(planId, {
          data: [...cached.data, item],
          timestamp: Date.now(),
        });
      }

      console.log("Returning playlist item:", item);
      return item;
    } catch (error) {
      console.error("Error in addToPlaylist:", error);
      throw error;
    }
  }

  static async removeFromPlaylist(itemId: string): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .from("playlist_items")
      .select("event_id")
      .eq("id", itemId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase.from("playlist_items").delete().eq("id", itemId);

    if (error) throw error;

    // Actualizar cache
    if (item?.event_id) {
      const cached = playlistCache.get(item.event_id);
      if (cached) {
        playlistCache.set(item.event_id, {
          data: cached.data.filter((i) => i.id !== itemId),
          timestamp: Date.now(),
        });
      }
    }
  }

  static async getPlaylist(planId: string): Promise<PlaylistItem[]> {
    try {
      const { data, error } = await supabase
        .from("playlist_items")
        .select(
          `
          id,
          youtube_video_id,
          title,
          thumbnail_url,
          channel_title,
          added_by_participant_id,
          event_id,
          added_at,
          participant:event_participants (
            name
          )
        `
        )
        .eq("event_id", planId)
        .order("added_at", { ascending: true });
      if (error) throw error;
      return data.map((item) => ({
        ...item,
        participant_name: item.participant?.name || "Desconocido",
      }));
    } catch (error) {
      throw new Error("Error fetching playlist");
    }
  }

  static async addVideo(planId: string, videoId: string): Promise<PlaylistItem> {
    try {
      const { data, error } = await supabase
        .from("playlist_items")
        .insert({
          event_id: planId,
          youtube_video_id: videoId,
          title: "Video sin título",
          added_by_participant_id: "system",
        })
        .select(
          `
          id,
          youtube_video_id,
          title,
          thumbnail_url,
          channel_title,
          added_by_participant_id,
          event_id,
          added_at,
          participant:event_participants (
            name
          )
        `
        )
        .single();
      if (error) throw error;
      return {
        ...data,
        participant_name: data.participant?.name || "Desconocido",
      };
    } catch (error) {
      throw new Error("Error adding video to playlist");
    }
  }

  static async removeVideo(videoId: string): Promise<void> {
    try {
      const { error } = await supabase.from("playlist_items").delete().eq("id", videoId);
      if (error) throw error;
    } catch (error) {
      throw new Error("Error removing video from playlist");
    }
  }

  static async getVideoDetails(
    videoId: string
  ): Promise<{ title: string; thumbnail_url: string; channel_title: string }> {
    const { data, error } = await supabase
      .from("playlist_items")
      .select("title, thumbnail_url, channel_title")
      .eq("youtube_video_id", videoId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data;
  }

  static subscribeToPlaylist(
    planId: string,
    callback: (payload: PlaylistChangePayload) => void
  ): RealtimeChannel {
    return supabase
      .channel(`playlist:${planId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist_items",
          filter: `event_id=eq.${planId}`,
        },
        (payload) => {
          // Invalidar cache cuando hay cambios
          playlistCache.delete(planId);
          callback(payload as unknown as PlaylistChangePayload);
        }
      )
      .subscribe();
  }

  static unsubscribeFromPlaylist(subscription: RealtimeChannel): void {
    supabase.removeChannel(subscription);
  }
}
