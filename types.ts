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
