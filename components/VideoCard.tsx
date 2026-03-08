import * as React from 'react';
import { ContentMetadata } from '../types';
import { Play, Clock, Eye, User, Layers, Tv } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  metadata: ContentMetadata;
}

export const VideoCard: React.FC<VideoCardProps> = ({ metadata }) => {
  const isCollection = metadata.type === 'playlist' || metadata.type === 'channel';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 dark:ring-white/10 group cursor-pointer transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(230,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(230,0,0,0.15)]"
    >
      <div className="md:flex h-full">
        {/* Thumbnail Section */}
        <div className="md:w-1/2 relative overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={metadata.thumbnailUrl}
            alt={metadata.title}
            className="w-full h-64 md:h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/20"
            >
              {metadata.type === 'playlist' ? <Layers className="w-6 h-6 ml-1" /> :
                metadata.type === 'channel' ? <Tv className="w-6 h-6" /> :
                  <Play className="w-6 h-6 ml-1" />}
            </motion.div>
          </div>
          {metadata.duration && !isCollection && (
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" /> {metadata.duration}
            </div>
          )}
          {isCollection && metadata.itemCount && (
            <div className="absolute bottom-4 right-4 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1">
              <Layers className="w-3 h-3" /> {metadata.itemCount} Videos
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-slate-800 flex items-center justify-center text-brand-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">{metadata.type}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{metadata.channel}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-3 line-clamp-2">
            {metadata.title}
          </h2>

          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" /> {metadata.views ? new Intl.NumberFormat('en-US').format(Number(metadata.views)) : 'N/A'}
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm line-clamp-3">
            {metadata.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};