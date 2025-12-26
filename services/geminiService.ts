import { GoogleGenAI, Type } from "@google/genai";
import { ContentMetadata } from "../types";

const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getContentMetadata = async (url: string): Promise<ContentMetadata> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    return {
      type: 'video',
      title: "Error Scraping Content",
      channel: "Unknown",
      description: "Scraper failed to bypass restrictions. Please check the URL.",
      views: "0",
      thumbnailUrl: "https://picsum.photos/800/450?grayscale"
    };
  }
};

export { getContentMetadata };