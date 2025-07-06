import { supabase } from "@/shared/integrations/supabase/client";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
};

export class YouTubeService {
  static async searchVideos(searchTerm: string): Promise<YouTubeVideo[]> {
    try {
      // Use direct fetch as primary method since it works better with CORS
      const response = await fetch(
        "https://tzkqsdyijmsajjlaoqwg.supabase.co/functions/v1/youtube-search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabase.supabaseKey}`,
          },
          body: JSON.stringify({ searchTerm }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { error?: string; results?: YouTubeVideo[] };

      if (
        data !== null &&
        data !== undefined &&
        typeof data.error === "string" &&
        data.error.length > 0
      ) {
        throw new Error(data.error);
      }

      return Array.isArray(data?.results) ? data.results : [];
    } catch (error) {
      console.error("YouTube search error:", error);

      // Handle specific CORS errors
      if (error instanceof Error) {
        if (error.message.includes("CORS") || error.message.includes("cors")) {
          throw new Error(
            "Error de CORS: No se pudo conectar con el servidor de búsqueda. Inténtalo de nuevo."
          );
        }

        if (error.message.includes("fetch")) {
          throw new Error(
            "Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet."
          );
        }
      }

      throw error;
    }
  }

  // Fallback method using Supabase client (for reference)
  static async searchVideosWithSupabaseClient(searchTerm: string): Promise<YouTubeVideo[]> {
    try {
      const result = await supabase.functions.invoke("youtube-search", {
        body: { searchTerm },
      });

      const data = result.data as { error?: string; results?: YouTubeVideo[] } | null;
      const error = result.error as { message?: string } | null;

      if (error && typeof error.message === "string" && error.message.length > 0) {
        console.error("Supabase function error:", error);
        throw new Error(`Error calling YouTube search function: ${error.message}`);
      }

      if (
        data !== null &&
        data !== undefined &&
        typeof data.error === "string" &&
        data.error.length > 0
      ) {
        console.error("Function returned error:", data.error);
        throw new Error(data.error);
      }

      return Array.isArray(data?.results) ? data.results : [];
    } catch (error) {
      console.error("Supabase client error:", error);
      throw error;
    }
  }
}
