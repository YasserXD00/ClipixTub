export interface SubtitleTrack {
  lang: string;
  label: string;
  format: string;
}

export interface PlaylistItem {
  title: string;
  duration: string;
  thumbnailUrl: string;
  videoId: string;
  views?: string;
}

export interface ContentMetadata {
  type: 'video' | 'playlist' | 'channel';
  title: string;
  channel: string;
  views?: string;
  duration?: string;
  description: string;
  thumbnailUrl?: string;
  subtitles?: SubtitleTrack[];
  itemCount?: number;
  items?: PlaylistItem[];
  streamUrl?: string; // Mocked stream source
  availableQualities?: string[]; // e.g., ['1080p', '720p', '480p']
  maxQuality?: string; // e.g., '1080p'
}

export interface DownloadOption {
  id: string;
  label: string;
  subLabel: string;
  size: string;
  type: 'video' | 'audio' | 'subtitle';
  format: string;
  badge?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  type: string;
  format?: string;
  timestamp: number;
  thumbnailUrl?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  DOWNLOADING = 'DOWNLOADING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type DownloadPhase = 'PYTHON_INIT' | 'REQUESTS_GET' | 'STREAM_PARSE' | 'FFMPEG_ENCODE';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface TrendingVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channel: string;
  viewCount: string;
  duration: string;
}
