import * as React from 'react';
import { HistoryItem } from '../types';
import { Clock, FileVideo, Music, Trash2, FileText, Layers, Tv, Calendar, ExternalLink, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

interface HistoryViewProps {
  history: HistoryItem[];
  onClear: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onClear }) => {
  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return 'Recently';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp));
    } catch (e) {
      return 'Recently';
    }
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
    <div className="w-full max-w-5xl mx-auto mt-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-brand-500 font-black uppercase tracking-[0.3em] text-[10px]"
          >
            <Clock className="w-3.5 h-3.5" />
            Archive
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter"
          >
            Download <span className="text-slate-400 dark:text-slate-600">History</span>
          </motion.h3>
        </div>

        {history.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 border border-red-500/20 rounded-2xl transition-all"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </motion.button>
        )}
      </div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-32 glass-card rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
            <Clock className="w-10 h-10" />
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your vault is empty</h4>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">Start downloading your favorite content to see it listed here.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
        >
          {history.map((item) => (
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
              key={item.id}
              className="glass-card p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 flex items-center gap-6 group transition-all"
            >
              <div className="relative shrink-0 hidden sm:block">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="w-32 h-20 object-cover rounded-2xl bg-slate-200 dark:bg-slate-800 shadow-sm transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-32 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl" />
              </div>

              <div className="flex-grow min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white sm:hidden">
                    {getIcon(item.type)}
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-white truncate text-lg tracking-tight group-hover:text-brand-500 transition-colors">
                    {item.title}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full border border-brand-500/20">
                    {item.format || item.type}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-500/20 hidden md:block">
                  Verified
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};