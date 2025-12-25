import * as React from 'react';
import { ContentMetadata, PlaylistItem } from '../types';
import { Download, CheckSquare, Square, PlayCircle, Clock } from 'lucide-react';

interface PlaylistViewProps {
  metadata: ContentMetadata;
  onDownloadItem: (item: PlaylistItem) => void;
  onDownloadAll: (items: PlaylistItem[]) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ metadata, onDownloadItem, onDownloadAll }) => {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (metadata.items && selected.size === metadata.items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(metadata.items?.map(i => i.videoId)));
    }
  };

  const handleBulkDownload = () => {
    if (!metadata.items) return;
    const itemsToDownload = metadata.items.filter(i => selected.has(i.videoId));
    onDownloadAll(itemsToDownload.length > 0 ? itemsToDownload : metadata.items);
  };

  if (!metadata.items || metadata.items.length === 0) return null;

  return (
    <div className="mt-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full">{metadata.items.length}</span>
            Videos in {metadata.type === 'channel' ? 'Channel' : 'Playlist'}
          </h3>
          
          <div className="flex gap-3 w-full md:w-auto">
             <button 
               onClick={toggleSelectAll}
               className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
             >
               {selected.size === metadata.items.length ? 'Deselect All' : 'Select All'}
             </button>
             <button 
               onClick={handleBulkDownload}
               className="flex-1 md:flex-none px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg shadow-lg hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2"
             >
               <Download className="w-4 h-4" />
               Download {selected.size > 0 ? `(${selected.size})` : 'All'}
             </button>
          </div>
       </div>

       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {metadata.items.map((item) => (
            <div 
              key={item.videoId}
              className={`p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selected.has(item.videoId) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
            >
               <button onClick={() => toggleSelect(item.videoId)} className="text-slate-400 hover:text-brand-500">
                  {selected.has(item.videoId) ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
               </button>

               <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                     <PlayCircle className="w-6 h-6 text-white opacity-80" />
                  </div>
               </div>

               <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration}</span>
                     {item.views && <span>• {item.views}</span>}
                  </div>
               </div>

               <button 
                 onClick={() => onDownloadItem(item)}
                 className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-500 transition-colors"
                 title="Download this video"
               >
                 <Download className="w-5 h-5" />
               </button>
            </div>
          ))}
       </div>
    </div>
  );
};