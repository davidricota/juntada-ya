/// <reference types="https://deno.land/x/deno@v1.37.1/mod.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface SearchRequest {
  searchTerm: string;
}

interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { default: { url: string } };
    channelTitle: string;
  };
}

interface YouTubeResponse {
  items: YouTubeItem[];
}

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: { method: string; json: () => Promise<SearchRequest> }) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();

    if (!searchTerm) {
      return new Response(JSON.stringify({ error: "Search term is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: "YouTube API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      part: "snippet",
      q: searchTerm,
      type: "video",
      maxResults: "10", // Puedes ajustar la cantidad de resultados
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from YouTube API", details: errorData }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = (await response.json()) as YouTubeResponse;

    // Simplificamos los datos antes de enviarlos al cliente
    const simplifiedResults = data.items.map((item: YouTubeItem) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle,
    }));

    return new Response(JSON.stringify({ results: simplifiedResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
