import * as React from 'react';
import { HistoryItem } from '../types';
import { Clock, FileVideo, Music, Trash2, FileText, Layers, Tv } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onClear: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onClear }) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Music className="w-5 h-5 text-purple-500" />;
      case 'subtitle': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'playlist': return <Layers className="w-5 h-5 text-blue-500" />;
      case 'channel': return <Tv className="w-5 h-5 text-green-500" />;
      default: return <FileVideo className="w-5 h-5 text-brand-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-slate-400" />
          Download History
        </h3>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
           <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
             <Clock className="w-10 h-10" />
           </div>
           <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No downloads yet.</p>
           <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Your download history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              {item.thumbnailUrl && (
                <img 
                  src={item.thumbnailUrl} 
                  alt="" 
                  className="w-20 h-12 object-cover rounded-md hidden sm:block bg-slate-200"
                />
              )}
              
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 sm:hidden">
                {getIcon(item.type)}
              </div>

              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                   <span className="uppercase font-semibold tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{item.format || item.type}</span>
                   <span>{formatDate(item.timestamp)}</span>
                </div>
              </div>
              
              <div className="shrink-0 text-green-500 font-medium text-sm flex items-center gap-1">
                 Completed
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};