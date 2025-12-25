export interface SubtitleTrack {
  lang: string;
  label: string;
  format: string; // 'srt' | 'vtt'
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
  // For videos
  subtitles?: SubtitleTrack[];
  // For playlists/channels
  itemCount?: number;
  items?: PlaylistItem[];
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
  // Removed optional fields to match usage
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  DOWNLOADING = 'DOWNLOADING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
