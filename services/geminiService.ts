import { GoogleGenAI, Type } from "@google/genai";
import { ContentMetadata, TrendingVideo } from "../types";

const API_BASE = (import.meta as any).env.VITE_BACKEND_URL || '';

const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getContentMetadata = async (url: string): Promise<ContentMetadata> => {
  // First, try server-side metadata (more accurate and keeps keys server-side)
  if (API_BASE) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      const res = await fetch(`${API_BASE}/metadata?url=${encodeURIComponent(url)}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return data as ContentMetadata;
      }
    } catch (e) {
      // continue to AI-based method if server-side metadata fails
      console.warn('Server metadata fetch failed, falling back to Gemini', e);
    }
  }

  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const schema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["video", "playlist", "channel"] },
      title: { type: Type.STRING },
      channel: { type: Type.STRING },
      views: { type: Type.STRING },
      duration: { type: Type.STRING },
      description: { type: Type.STRING },
      itemCount: { type: Type.INTEGER },
      streamUrl: { type: Type.STRING, description: "A simulated direct streaming manifest URL." },
      subtitles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            lang: { type: Type.STRING },
            label: { type: Type.STRING },
            format: { type: Type.STRING },
          }
        }
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            videoId: { type: Type.STRING },
            views: { type: Type.STRING },
          }
        }
      }
    },
    required: ["type", "title", "channel", "description"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `SCRAPE DATA for this URL: ${url}. 
      Act as a YouTube data extractor. Return accurate metadata.
      
      For streamUrl, generate a simulated direct data-link like 'https://googlevideo.com/videoplayback?id=...'.
      
      If it's a VIDEO or SHORT:
      - Title, channel, views, duration.
      - Generate likely subtitle tracks.
      
      Return ONLY raw JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from scraper");

    let data: ContentMetadata = JSON.parse(cleanJsonString(jsonText));

    const realVideoId = extractYouTubeId(url);
    const seed = data.title ? data.title.length : 123;

    if (realVideoId && (data.type === 'video' || url.includes('shorts'))) {
      data.thumbnailUrl = `https://img.youtube.com/vi/${realVideoId}/maxresdefault.jpg`;
    } else {
      data.thumbnailUrl = `https://picsum.photos/seed/${seed}/800/450`;
    }

    if (data.items) {
      data.items = data.items.map((item, idx) => ({
        ...item,
        thumbnailUrl: (item.videoId && item.videoId.length > 10)
          ? `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
          : `https://picsum.photos/seed/${seed + idx + 1}/320/180`
      }));
    }

    return data;
  } catch (error) {
    console.error("Scraping error:", error);

    // Try to extract video ID for thumbnail even on error
    const videoId = extractYouTubeId(url);
    const thumbnailUrl = videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : "https://picsum.photos/800/450?grayscale";

    return {
      type: 'video',
      title: "Error Scraping Content",
      channel: "Unknown",
      description: error instanceof Error && error.message.includes('timeout')
        ? "Request timed out. The video may be unavailable or the connection is slow. Please try again."
        : "Scraper failed to bypass restrictions. Please check the URL or try again later.",
      views: "0",
      duration: "0",
      thumbnailUrl: thumbnailUrl
    };
  }
};

const FALLBACK_TRENDING: TrendingVideo[] = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', channel: 'Rick Astley', viewCount: '1.4B', duration: '212', thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
  { id: 'jNQXAC9IVRw', title: 'Me at the zoo', channel: 'jawed', viewCount: '300M', duration: '19', thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg' },
  { id: 'M7lc1UVf-VE', title: 'YouTube Creators: The Next 10 Years', channel: 'YouTube', viewCount: '45M', duration: '185', thumbnailUrl: 'https://img.youtube.com/vi/M7lc1UVf-VE/mqdefault.jpg' },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', channel: 'Luis Fonsi', viewCount: '8.4B', duration: '228', thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE', channel: 'officialpsy', viewCount: '5.1B', duration: '252', thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg' },
  { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You', channel: 'Ed Sheeran', viewCount: '6.2B', duration: '263', thumbnailUrl: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg' },
  { id: 'y6120QOlsfU', title: 'Darude - Sandstorm', channel: 'Darude', viewCount: '240M', duration: '232', thumbnailUrl: 'https://img.youtube.com/vi/y6120QOlsfU/mqdefault.jpg' },
  { id: 'fRh_vgS2dFE', title: 'Justin Bieber - Baby', channel: 'Justin Bieber', viewCount: '3B', duration: '219', thumbnailUrl: 'https://img.youtube.com/vi/fRh_vgS2dFE/mqdefault.jpg' }
];

const VIDEO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    videos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          channel: { type: Type.STRING },
          viewCount: { type: Type.STRING },
          duration: { type: Type.STRING },
        }
      }
    }
  },
  required: ["videos"],
};

const getTrendingVideos = async (): Promise<TrendingVideo[]> => {
  try {
    const meta = (import.meta as any);
    const API_BASE = meta.env.VITE_BACKEND_URL || '';

    // If a backend is configured, prefer fetching trending from it (it uses
    // YouTube Data API or yt-dlp fallback) so results are real and fresh.
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_BASE}/trending?force=true`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const body = await res.json();
          const list = body.trending || [];
          if (Array.isArray(list) && list.length > 0) {
            return list.map((v: any) => ({
              id: v.id,
              title: v.title || '',
              channel: v.channel || '',
              viewCount: String(v.viewCount || v.views || '0'),
              duration: String(v.duration || '0'),
              thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
            }));
          } else {
            console.warn('Backend returned empty trending list; falling back to Gemini/local list');
          }
        }
      } catch (e) {
        console.warn('Backend trending fetch failed, falling back to Gemini/local list', e);
      }
    }

    const apiKey = meta.env.VITE_GEMINI_API_KEY || '';

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') return FALLBACK_TRENDING;

    const ai = new GoogleGenAI({ apiKey });

    // Add randomness to prompt to prevent caching
    const randomSeed = Math.floor(Math.random() * 1000);

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Generate a list of 32 CURRENTLY TRENDING YouTube videos globally. 
      Seed: ${randomSeed}
      
      CRITICAL: You MUST generate random and diverse videos every time. Do not repeat the same list.
      
      Mix of categories: 
      - Music (Pop, K-Pop, Latin)
      - Gaming (Minecraft, Roblox, GTA, Horror)
      - Tech Reviews (Smartphones, PC builds)
      - Vlogs / Lifestyle
      - Viral Shorts
      
      For each video, provide:
      - A REAL YouTube ID (validate these if you can, 11 chars)
      - The exact Title
      - The Channel name
      - Modern view counts (e.g. "2.1B views", "850M views")
      - Duration in seconds.
      
      Return ONLY raw JSON with the 'videos' key.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: VIDEO_SCHEMA,
      },
    });

    const data = JSON.parse(cleanJsonString(response.text));
    return (data.videos || []).map((v: any) => ({
      ...v,
      thumbnailUrl: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`
    }));
  } catch (error) {
    console.error("Gemini trending error:", error);
    // Return empty array so UI can decide to show error or fallback
    // But for now, let's throw so we can show the error message in the UI if we want to debug
    // actually, let's keep fallback but log loudly
    return FALLBACK_TRENDING;
  }
};

const searchVideos = async (query: string): Promise<TrendingVideo[]> => {
  try {
    const meta = (import.meta as any);
    const apiKey = meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) return FALLBACK_TRENDING;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are a YouTube Search Engine.
      User Query: "${query}"
      
      1. Analyze the intent of the query (e.g., "drone" -> Drone reviews, Drone racing, Drone cinematic footage).
      2. Find 16 REAL, POPULAR YouTube videos that match this intent using your internal knowledge base.
      3. CRITICAL: Do NOT simply make up random IDs. Try to recall famous videos or return valid-format IDs.
      
      Return ONLY raw JSON with the 'videos' key.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: VIDEO_SCHEMA,
      },
    });

    const data = JSON.parse(cleanJsonString(response.text));
    if (!data.videos || data.videos.length === 0) throw new Error("No results found");

    return data.videos.map((v: any) => ({
      ...v,
      thumbnailUrl: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`
    }));
  } catch (error) {
    console.error("Gemini search error:", error);
    throw error; // Propagate error to UI
  }
};

export { getContentMetadata, getTrendingVideos, searchVideos };