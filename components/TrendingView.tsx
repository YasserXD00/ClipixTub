import * as React from 'react';
import { TrendingVideo } from '../types';
import { getTrendingVideos } from '../services/geminiService';
import { Flame, Play, Eye, Clock, Loader2, Download, Sparkles } from 'lucide-react';

interface TrendingViewProps {
    onSelect: (id: string) => void;
}

export const TrendingView: React.FC<TrendingViewProps> = ({ onSelect }) => {
    const [videos, setVideos] = React.useState<TrendingVideo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchTrending = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getTrendingVideos();
            setVideos(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch global trends. Check API connection.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTrending();
    }, []);

    const formatViews = (views: string) => {
        const v = parseInt(views);
        if (isNaN(v)) return views;
        if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
        if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
        return v.toString();
    };

    const formatDuration = (seconds: string) => {
        const s = parseInt(seconds);
        if (isNaN(s)) return seconds;
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="w-full py-20 flex flex-col items-center justify-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Fetching global trends...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full py-20 text-center animate-fade-in">
                <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/20 max-w-lg mx-auto">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-2">Oops!</p>
                    <p className="text-red-500 dark:text-red-400/70 text-sm">{error}</p>
                    {error.toLowerCase().includes('key') && <p className="text-xs text-red-500 font-bold mt-2 animate-pulse">Please check your VITE_GEMINI_API_KEY in .env file!</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto mt-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            Trending Now <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                        </h3>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Curation Engine</p>
                            <span className="px-1.5 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[8px] font-black uppercase rounded border border-brand-500/20">Gemini 1.5 Flash Ultra</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchTrending}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                    <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Trends
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                <button
                                    onClick={() => onSelect(video.id)}
                                    className="w-14 h-14 bg-brand-600 text-white rounded-full opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-xl flex items-center justify-center hover:bg-brand-500"
                                >
                                    <Download className="w-6 h-6 fill-current" />
                                </button>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {formatDuration(video.duration)}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-5">
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-3 min-h-[2.8rem] group-hover:text-brand-600 transition-colors">
                                {video.title}
                            </h4>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 truncate max-w-[120px]">{video.channel}</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                            <Eye className="w-3 h-3" />
                                            {formatViews(video.viewCount)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onSelect(video.id)}
                                    className="text-[10px] font-black uppercase tracking-tighter text-brand-600 dark:text-brand-500 hover:scale-110 transition-transform"
                                >
                                    Get Meta
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
