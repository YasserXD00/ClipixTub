export const API_BASE = (import.meta as any).env.VITE_BACKEND_URL || 'https://clipixtub.onrender.com';
export const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';

console.log("ClipixTub Config Loaded. Backend URL:", API_BASE);
