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

  static async getPlaylist(eventId: string): Promise<PlaylistItem[]> {
    try {
      const { data, error } = await supabase.from("playlist").select("*").eq("event_id", eventId).order("added_at", { ascending: true });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error("Error fetching playlist");
    }
  }

  static async addVideo(eventId: string, videoId: string): Promise<PlaylistItem> {
    try {
      const { data, error } = await supabase
        .from("playlist")
        .insert([{ event_id: eventId, youtube_video_id: videoId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error("Error adding video to playlist");
    }
  }

  static async removeVideo(videoId: string): Promise<void> {
    try {
      const { error } = await supabase.from("playlist").delete().eq("id", videoId);
      if (error) throw error;
    } catch (error) {
      throw new Error("Error removing video from playlist");
    }
  }

  static async getVideoDetails(videoId: string): Promise<VideoDetails> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error("Video not found");
      }
      const video = data.items[0];
      return {
        title: video.snippet.title,
        thumbnail_url: video.snippet.thumbnails.medium.url,
        channel_title: video.snippet.channelTitle,
      };
    } catch (error) {
      throw new Error("Error fetching video details");
    }
  }

  static subscribeToPlaylist(eventId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`playlist-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist",
          filter: `event_id=eq.${eventId}`,
        },
        callback
      )
      .subscribe();
  }

  static unsubscribeFromPlaylist(subscription: RealtimeChannel) {
    supabase.removeChannel(subscription);
  }
}
