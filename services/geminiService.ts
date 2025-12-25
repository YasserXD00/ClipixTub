import { GoogleGenAI, Type } from "@google/genai";
import { ContentMetadata } from "../types";

const extractYouTubeId = (url: string): string | null => {
  // Updated regex to handle shorts and other formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to remove markdown code blocks from JSON response
const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getContentMetadata = async (url: string): Promise<ContentMetadata> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Schema definition for content analysis
  const schema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["video", "playlist", "channel"], description: "The type of content." },
      title: { type: Type.STRING, description: "Title of video, playlist, or channel." },
      channel: { type: Type.STRING, description: "Name of the channel/author." },
      views: { type: Type.STRING, description: "View count or follower count." },
      duration: { type: Type.STRING, description: "Duration (for video) or total time." },
      description: { type: Type.STRING, description: "Description of the content." },
      itemCount: { type: Type.INTEGER, description: "Number of videos if playlist/channel." },
      subtitles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            lang: { type: Type.STRING },
            label: { type: Type.STRING },
            format: { type: Type.STRING },
          }
        },
        description: "Available subtitle tracks for video."
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
        },
        description: "List of videos if it is a playlist or channel."
      }
    },
    required: ["type", "title", "channel", "description"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this YouTube URL: ${url}. 
      Determine if it is a single video, a playlist, or a channel page.
      
      If it's a VIDEO:
      - Provide title, channel, views, duration.
      - Generate a list of likely subtitle tracks (e.g. English, Spanish, Auto-generated) in 'subtitles'.
      
      If it's a PLAYLIST or CHANNEL:
      - Set type to 'playlist' or 'channel'.
      - Provide title and item count.
      - Generate a list of ${10} realistic video items belonging to this playlist/channel in 'items'.
      
      Important: Be as accurate as possible with the metadata. Return ONLY raw JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    let data: ContentMetadata;
    try {
        data = JSON.parse(cleanJsonString(jsonText));
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON:", jsonText);
        throw new Error("Invalid JSON response");
    }
    
    // Fix: Use actual YouTube Thumbnail if available to avoid "different video" look
    const realVideoId = extractYouTubeId(url);
    const seed = data.title ? data.title.length : 123;

    if (realVideoId && data.type === 'video') {
      data.thumbnailUrl = `https://img.youtube.com/vi/${realVideoId}/maxresdefault.jpg`;
    } else {
       // Fallback for playlists/channels or failures
       data.thumbnailUrl = `https://picsum.photos/seed/${seed}/800/450`;
    }

    if (data.items) {
      data.items = data.items.map((item, idx) => {
         // Try to improve playlist item thumbnails if they look like IDs
         const itemId = item.videoId || `id_${idx}`;
         // If gemini hallucinated a video ID that looks real, use it
         const thumb = (item.videoId && item.videoId.length > 10) 
           ? `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
           : `https://picsum.photos/seed/${seed + idx + 1}/320/180`;
           
         return {
           ...item,
           thumbnailUrl: thumb
         };
      });
    }

    // Default subtitles if missing for video
    if (data.type === 'video' && (!data.subtitles || data.subtitles.length === 0)) {
       data.subtitles = [
         { lang: 'en', label: 'English (Auto-generated)', format: 'srt' },
         { lang: 'es', label: 'Spanish', format: 'vtt' },
       ];
    }

    return data;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    // Fallback
    return {
      type: 'video',
      title: "Error Retrieving Content",
      channel: "Unknown",
      description: "We couldn't parse this link. Please try again.",
      views: "0",
      thumbnailUrl: "https://picsum.photos/800/450?grayscale"
    };
  }
};

export { getContentMetadata };