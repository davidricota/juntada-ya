import { supabase } from "@/integrations/supabase/client";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
};

export class YouTubeService {
  static async searchVideos(searchTerm: string): Promise<YouTubeVideo[]> {
    const { data, error } = await supabase.functions.invoke("youtube-search", {
      body: { searchTerm },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data?.results || [];
  }
}
