import * as React from 'react';
import { DownloadOption, ContentMetadata, SubtitleTrack } from '../types';
import { Download, FileVideo, Music, Captions } from 'lucide-react';

interface DownloadOptionsProps {
  metadata: ContentMetadata;
  onDownload: (option: DownloadOption) => void;
}

const mockOptions: DownloadOption[] = [
  { id: '1', label: '1080p Premium', subLabel: 'MP4 • 60fps', size: '145 MB', type: 'video', format: 'mp4', badge: 'HD' },
  { id: '2', label: '720p', subLabel: 'MP4 • Standard', size: '82 MB', type: 'video', format: 'mp4' },
  { id: '4', label: 'High Quality Audio', subLabel: 'MP3 • 320kbps', size: '8 MB', type: 'audio', format: 'mp3', badge: 'HQ' },
];

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({ metadata, onDownload }) => {
  return (
    <div className="w-full mt-8 animate-fade-in delay-100 space-y-8">
      
      {/* Media Formats */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-brand-500" />
          Media Formats
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockOptions.map((option, index) => (
            <button
              key={option.id}
              onClick={() => onDownload(option)}
              className="group relative flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-sm hover:shadow-lg transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand-50 dark:bg-brand-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-brand-500`}>
                  {option.type === 'video' ? <FileVideo className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{option.label}</span>
                    {option.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white rounded-md">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    {option.subLabel} <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" /> {option.size}
                  </div>
                </div>
              </div>

              <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <div className="bg-brand-500 text-white p-2 rounded-lg shadow-lg">
                   <Download className="w-4 h-4" />
                 </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subtitles Section */}
      {metadata.subtitles && metadata.subtitles.length > 0 && (
        <div>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Captions className="w-5 h-5 text-brand-500" />
            Subtitles / Closed Captions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
             {metadata.subtitles.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => onDownload({
                    id: `sub-${idx}`,
                    label: sub.label,
                    subLabel: sub.lang,
                    size: '20 KB',
                    type: 'subtitle',
                    format: sub.format
                  })}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-all text-sm group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sub.label}</span>
                    <span className="text-xs uppercase bg-slate-200 dark:bg-slate-600 px-1.5 rounded text-slate-600 dark:text-slate-300">{sub.format}</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
                </button>
             ))}
          </div>
        </div>
      )}

    </div>
  );
};