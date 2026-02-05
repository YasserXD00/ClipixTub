import * as React from 'react';
import { Sparkles, Search, Loader2, ArrowRight, Play, Globe } from 'lucide-react';
import { getTrendingVideos, searchVideos } from '../services/geminiService';
import { TrendingVideo } from '../types';

interface DiscoverViewProps {
    onSelect: (id: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onSelect }) => {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<TrendingVideo[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleAIGenerate = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        try {
            const data = await searchVideos(query);
            setResults(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to connect to Gemini AI. Check your API Key.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 animate-fade-in p-6">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/20 mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">AI Discovery</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                    Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Favorite</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto uppercase text-xs tracking-[0.2em] leading-relaxed">
                    Let Gemini AI scour the depths of the internet to find exactly what you're looking for.
                </p>
            </div>

            <div className="relative group mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative flex bg-white dark:bg-slate-900 rounded-2xl p-2 gap-2 border border-slate-100 dark:border-slate-800 shadow-2xl">
                    <input
                        type="text"
                        placeholder="What are you in the mood for? (e.g. 'Epic coding music', '4K Drone footage')"
                        className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-slate-900 dark:text-white font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        onClick={handleAIGenerate}
                        disabled={loading}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        AI Search
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-red-500 font-bold text-sm tracking-wide uppercase">{error}</p>
                        {error.includes('API Key') && <p className="text-xs text-red-400 mt-1">Make sure VITE_GEMINI_API_KEY is allowed in your .env file.</p>}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((video) => (
                    <div
                        key={video.id}
                        className="group flex gap-4 p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer"
                        onClick={() => onSelect(video.id)}
                    >
                        <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0">
                            <img src={video.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-purple-500 transition-colors">{video.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{video.channel}</p>
                        </div>
                    </div>
                ))}
            </div>

            {results.length === 0 && !loading && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Globe className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Type something above to start exploring</p>
                </div>
            )}
        </div>
    );
};
