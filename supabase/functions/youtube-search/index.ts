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

// Comprehensive CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

// Helper function to create responses with CORS headers
function createResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: { method: string; json: () => Promise<SearchRequest> }) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return createResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { searchTerm } = await req.json();

    if (!searchTerm) {
      return createResponse({ error: "Search term is required" }, 400);
    }

    if (!YOUTUBE_API_KEY) {
      return createResponse({ error: "YouTube API key not configured" }, 500);
    }

    const params = new URLSearchParams({
      part: "snippet",
      q: searchTerm,
      type: "video",
      maxResults: "10",
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API error:", errorData);
      return createResponse(
        {
          error: "Failed to fetch data from YouTube API",
          details: errorData,
        },
        response.status
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

    return createResponse({ results: simplifiedResults });
  } catch (error) {
    console.error("Function error:", error);
    return createResponse(
      {
        error: error.message || "Internal server error",
      },
      500
    );
  }
});
