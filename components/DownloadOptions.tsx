import * as React from 'react';
import { DownloadOption, ContentMetadata } from '../types';
import { Download, FileVideo, Music, Captions, Zap } from 'lucide-react';

interface DownloadOptionsProps {
  metadata: ContentMetadata;
  onDownload: (option: DownloadOption) => void;
}

const scraperOptions: DownloadOption[] = [
  { id: 'mp4-4k', label: 'MP4 Video (4K)', subLabel: 'Ultra HD • 60fps', size: '420 MB', type: 'video', format: 'mp4', badge: 'UHD' },
  { id: 'mp4-1080', label: 'MP4 Video (1080p)', subLabel: 'High Definition', size: '145 MB', type: 'video', format: 'mp4', badge: 'HD' },
  { id: 'mp3-hq', label: 'MP3 Audio (320kbps)', subLabel: 'Studio Quality', size: '12 MB', type: 'audio', format: 'mp3', badge: 'PRO' },
  { id: 'mp3-std', label: 'MP3 Audio (128kbps)', subLabel: 'Standard Quality', size: '4 MB', type: 'audio', format: 'mp3' },
];

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({ metadata, onDownload }) => {
  return (
    <div className="w-full mt-8 animate-fade-in space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-500" />
          Extracted Streams
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scraperOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onDownload(option)}
              className="group relative flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors`}>
                  {option.type === 'video' ? <FileVideo className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 dark:text-slate-100">{option.label}</span>
                    {option.badge && <span className="px-2 py-0.5 text-[9px] font-black bg-brand-600 text-white rounded">{option.badge}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{option.subLabel} • {option.size}</div>
                </div>
              </div>
              <Download className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};