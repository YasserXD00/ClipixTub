import * as React from 'react';
import { DownloadOption, ContentMetadata, AppState } from '../types';
import { Download, FileVideo, Music, Code, Loader2, VolumeX, Volume2 } from 'lucide-react';

interface DownloadOptionsProps {
  metadata: ContentMetadata;
  onDownload: (option: DownloadOption) => void;
  appState: AppState;
  activeDownloadId: string | null;
  downloadProgress: number;
}

const getVideoOptions = (availableQualities?: string[]): DownloadOption[] => {
  const qualities = availableQualities || ['1080p', '720p', '480p'];
  const qualityMap: Record<string, { label: string; size: string; badge?: string }> = {
    '1080p': { label: 'MP4 Video (1080p)', size: '145 MB', badge: 'HD' },
    '720p': { label: 'MP4 Video (720p)', size: '85 MB' },
    '480p': { label: 'MP4 Video (480p)', size: '45 MB' },
    '360p': { label: 'MP4 Video (360p)', size: '25 MB' },
  };
  
  return qualities.map(q => ({
    id: `mp4-${q}`,
    label: qualityMap[q]?.label || `MP4 Video (${q})`,
    subLabel: 'Standard Audio',
    size: qualityMap[q]?.size || '50 MB',
    type: 'video' as const,
    format: 'mp4',
    badge: qualityMap[q]?.badge,
  }));
};

const getVideoMutedOptions = (availableQualities?: string[]): DownloadOption[] => {
  const qualities = availableQualities || ['1080p', '720p'];
  const qualityMap: Record<string, { size: string }> = {
    '1080p': { size: '110 MB' },
    '720p': { size: '60 MB' },
    '480p': { size: '30 MB' },
    '360p': { size: '15 MB' },
  };
  
  return qualities.map(q => ({
    id: `mp4-${q}-mute`,
    label: `MP4 (${q} Muted)`,
    subLabel: 'No Audio • Visual Only',
    size: qualityMap[q]?.size || '50 MB',
    type: 'video' as const,
    format: 'mp4',
  }));
};

const audioOnly: DownloadOption[] = [
  { id: 'mp3-320', label: 'MP3 (320kbps)', subLabel: 'Extreme Quality • HQ', size: '12 MB', type: 'audio', format: 'mp3', badge: 'GOLD' },
  { id: 'mp3-192', label: 'MP3 (192kbps)', subLabel: 'High Quality', size: '7.5 MB', type: 'audio', format: 'mp3' },
  { id: 'mp3-128', label: 'MP3 (128kbps)', subLabel: 'Standard Quality', size: '4.8 MB', type: 'audio', format: 'mp3' },
];

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({ 
  metadata, 
  onDownload, 
  appState, 
  activeDownloadId, 
  downloadProgress 
}) => {
  const isDownloading = appState === AppState.DOWNLOADING;

  const renderOption = (option: DownloadOption) => {
    const isActive = activeDownloadId === option.id && isDownloading;
    const isMuted = option.id.includes('mute');
    
    return (
      <button
        key={option.id}
        onClick={() => !isDownloading && onDownload(option)}
        disabled={isDownloading && !isActive}
        className={`group relative flex flex-col p-5 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
          isActive 
            ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg scale-[1.02]' 
            : isDownloading 
              ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800' 
              : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1'
        }`}
      >
        {/* Progress Bar Background for active item */}
        {isActive && (
          <div 
            className="absolute bottom-0 left-0 h-1.5 bg-brand-500 transition-all duration-300 ease-out z-0" 
            style={{ width: `${downloadProgress}%` }}
          />
        )}

        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
              isActive 
                ? 'bg-brand-500 text-white animate-pulse' 
                : 'bg-slate-50 dark:bg-slate-800 text-brand-500 group-hover:bg-brand-500 group-hover:text-white group-hover:rotate-12'
            }`}>
              {isActive ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                isMuted ? <VolumeX className="w-6 h-6" /> :
                option.type === 'video' ? <FileVideo className="w-6 h-6" /> : <Music className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black tracking-tight ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-brand-600 transition-colors'}`}>
                  {option.label}
                </span>
                {option.badge && <span className="px-2 py-0.5 text-[9px] font-black bg-brand-600 text-white rounded shadow-sm">{option.badge}</span>}
              </div>
              <div className={`text-xs font-medium ${isActive ? 'text-brand-500/80' : 'text-slate-500'}`}>
                {isActive ? `Processing Stream... ${Math.round(downloadProgress)}%` : `${option.subLabel} • ${option.size}`}
              </div>
            </div>
          </div>
          {!isActive && <Download className="w-5 h-5 text-slate-300 group-hover:text-brand-500 group-hover:scale-110 transition-all" />}
        </div>
        
        {!isDownloading && (
          <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-brand-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        )}
      </button>
    );
  };

  const videoOptions = getVideoOptions(metadata.availableQualities);
  const mutedOptions = getVideoMutedOptions(metadata.availableQualities?.slice(0, 2)); // Top 2 qualities for muted

  return (
    <div className="w-full mt-8 animate-fade-in space-y-12">
      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-brand-500" />
          Video + Audio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoOptions.map(renderOption)}
        </div>
      </section>

      {mutedOptions.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <VolumeX className="w-5 h-5 text-brand-500" />
            Muted / Video Only
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mutedOptions.map(renderOption)}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-brand-500" />
          High Fidelity Audio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audioOnly.map(renderOption)}
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-2 pt-8 opacity-40">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Python Engine v3.11 Active</span>
        </div>
        <div className="text-[9px] font-medium italic">Advanced adaptive stream merging enabled</div>
      </div>
    </div>
  );
};