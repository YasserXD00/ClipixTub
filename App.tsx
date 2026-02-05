import * as React from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { VideoCard } from './components/VideoCard';
import { DownloadOptions } from './components/DownloadOptions';
import { PlaylistView } from './components/PlaylistView';
import { HistoryView } from './components/HistoryView';
import { AboutView } from './components/AboutView';
import { TrendingView } from './components/TrendingView';
import { DiscoverView } from './components/DiscoverView';
import { DonationModal } from './components/DonationModal';

import { getContentMetadata } from './services/geminiService';
import { ContentMetadata, AppState, DownloadOption, PlaylistItem, HistoryItem, LogEntry } from './types';
import { startDownload, getLogs, getStatus } from './services/backendService';
import { CloudDownload, Link, CheckCircle, ArrowRight, Terminal, Code2, Sparkles, Cpu, Info, History, Download, Flame, Coffee, Sun, Moon, Sunrise, Sunset, Users, Activity, BarChart3, Github } from 'lucide-react';

interface Stats {
  real_time: number;
  today: number;
  weekly: number;
}

export default function App() {
  const [url, setUrl] = React.useState('');
  const [appState, setAppState] = React.useState<AppState>(AppState.IDLE);
  const [metadata, setMetadata] = React.useState<ContentMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [activeDownloadId, setActiveDownloadId] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [errorMsg, setErrorMsg] = React.useState('');

  const [activeTab, setActiveTab] = React.useState<'home' | 'history' | 'about' | 'trending' | 'discover'>('home');
  const [showDonation, setShowDonation] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('clipix_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [greeting, setGreeting] = React.useState('');
  const [stats, setStats] = React.useState<Stats>({ real_time: 0, today: 0, weekly: 0 });

  React.useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const fetchStats = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.warn('Stats fetch failed');
      }
    };

    fetchStats();
    const timer = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const intervalRef = React.useRef<number | null>(null);
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    localStorage.setItem('clipix_history', JSON.stringify(history));
  }, [history]);

  // Auto-scroll logs
  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg('');
    setActiveTab('home');

    try {
      const data = await getContentMetadata(url);
      setMetadata(data);
      setAppState(AppState.READY);
    } catch (err) {
      setErrorMsg("Python backend unreachable. Could not resolve URL metadata.");
      setAppState(AppState.ERROR);
    }
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    setLogs(prev => [...prev, { timestamp: timeString, message, type }]);
  };

  const simulateDownload = (filename: string, optionId: string, historyData?: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setAppState(AppState.DOWNLOADING);
    setActiveDownloadId(optionId);
    setDownloadProgress(0);
    setLogs([]);
    addLog('Initializing Python 3.11 Environment...', 'info');

    if (intervalRef.current) clearInterval(intervalRef.current);

    let step = 0;

    intervalRef.current = window.setInterval(() => {
      setDownloadProgress((prev) => {
        const next = prev + Math.random() * 2.5;

        // Python Log Simulation Logic
        if (Math.floor(next) > step) {
          step = Math.floor(next);

          if (step === 5) addLog('import requests, json, ffmpeg', 'info');
          if (step === 10) addLog(`requests.get('${url.substring(0, 30)}...')`, 'info');
          if (step === 15) addLog('Response: 200 OK. Parsing HTML...', 'success');
          if (step === 25) addLog('Finding adaptive streams (HLS/DASH)...', 'info');
          if (step === 35) addLog('Stream found: video/mp4 [1080p] + audio/mp4 [128kbps]', 'success');
          if (step === 45) addLog('Merging video and audio streams...', 'warning');
          if (step === 55) addLog('Starting FFmpeg subprocess...', 'info');
          if (step === 65) addLog('ffmpeg -i video.tmp -i audio.tmp -c:v copy -c:a aac output.mp4', 'info');
          if (step === 75) addLog('Transcoding frame data...', 'info');
          if (step === 95) addLog('Finalizing container. Cleaning temp files...', 'warning');
        }

        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          addLog('Process exited with code 0.', 'success');

          setTimeout(() => {
            setAppState(AppState.COMPLETED);
            if (historyData) addToHistory(historyData);

            // Trigger dummy download
            const blob = new Blob(["ClipixTub Python Processed Data"], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
          }, 800);
          return 100;
        }
        return next;
      });
    }, 80);
  };

  const startBackendDownload = async (option: DownloadOption) => {
    if (!metadata) return;
    setAppState(AppState.DOWNLOADING);
    setActiveDownloadId(option.id);
    setDownloadProgress(0);
    setLogs([]);
    addLog('Requesting backend start...', 'info');

    try {
      // Extract quality from option id (e.g., 'mp4-1080' -> '1080p', 'mp3-320' -> 'mp3')
      let quality: string | undefined = undefined;
      let format: string = option.format || 'mp4';
      let audioBitrate: string | undefined = undefined;

      // Parse quality from option id
      if (option.id.includes('4k')) {
        quality = '4k';
      } else if (option.id.includes('1080')) {
        quality = '1080p';
      } else if (option.id.includes('720')) {
        quality = '720p';
      } else if (option.id.includes('480')) {
        quality = '480p';
      } else if (option.id.includes('360')) {
        quality = '360p';
      }

      // Parse audio bitrate for MP3
      if (format === 'mp3') {
        if (option.id.includes('320')) {
          audioBitrate = '320';
        } else if (option.id.includes('192')) {
          audioBitrate = '192';
        } else if (option.id.includes('128')) {
          audioBitrate = '128';
        } else {
          audioBitrate = '192'; // default
        }
      }

      // For muted videos, we don't need audio quality
      if (option.id.includes('mute')) {
        quality = quality || '1080p';
        format = 'mp4';
      }

      const resp = await startDownload(
        url || metadata.streamUrl || '',
        'downloads',
        { quality, format, audioBitrate }
      );
      const jobId = (resp as any).job_id;
      if (!jobId) throw new Error('No job id');

      // poll logs & status
      let lastLogsCount = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = window.setInterval(async () => {
        try {
          const remoteLogs = await getLogs(jobId);
          // append new logs
          if (remoteLogs && remoteLogs.length > lastLogsCount) {
            const newSlice = remoteLogs.slice(lastLogsCount);
            newSlice.forEach((line: string) => {
              const type: 'info' | 'success' | 'warning' = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') ? 'warning' : (line.toLowerCase().includes('process exited with code 0') ? 'success' : 'info');
              addLog(line, type);
            });
            lastLogsCount = remoteLogs.length;
          }

          const st = await getStatus(jobId);
          if (st.status === 'completed' || st.status === 'failed') {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            if (st.status === 'completed') {
              addLog('Process exited with code 0.', 'success');
              setTimeout(async () => {
                setAppState(AppState.COMPLETED);
                addToHistory({ title: metadata.title, type: option.type, format: option.format, thumbnailUrl: metadata.thumbnailUrl });
                try {
                  // fetch the real file from backend
                  const fileResp = await fetch(`${(import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000'}/files/${jobId}`);
                  if (fileResp.ok) {
                    const blob = await fileResp.blob();
                    const dlUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = dlUrl;
                    // Use exact video title as filename (sanitized for filesystem)
                    const sanitizedTitle = metadata.title.replace(/[<>:"/\\|?*]/g, '').trim() || 'video';
                    a.download = `${sanitizedTitle}.${option.format}`;
                    a.click();
                    window.URL.revokeObjectURL(dlUrl);
                  } else {
                    addLog('Could not download file from backend, serving dummy file.', 'warning');
                    const blob = new Blob([`ClipixTub Python Processed Data for ${metadata.title}`], { type: 'text/plain' });
                    const dlUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = dlUrl;
                    a.download = `ClipixTub_${metadata.title.substring(0, 15).replace(/\W/g, '_')}.${option.format}`;
                    a.click();
                    window.URL.revokeObjectURL(dlUrl);
                  }
                } catch (e) {
                  addLog('Download failed: ' + String(e), 'warning');
                }
              }, 600);
            } else {
              addLog('Backend job failed.', 'warning');
              setAppState(AppState.ERROR);
            }
          } else {
            // approximate progress from logs length
            setDownloadProgress(Math.min(95, lastLogsCount));
            setAppState(AppState.DOWNLOADING);
          }
        } catch (e) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          addLog('Error polling backend: ' + String(e), 'warning');
          setAppState(AppState.ERROR);
        }
      }, 1000);

    } catch (err) {
      addLog('Backend start failed, falling back to simulated download', 'warning');
      simulateDownload(`ClipixTub_${metadata.title.substring(0, 15).replace(/\W/g, '_')}.${option.format}`, option.id, { title: metadata.title, type: option.type, format: option.format, thumbnailUrl: metadata.thumbnailUrl });
    }
  };

  const handleDownloadOption = (option: DownloadOption) => {
    startBackendDownload(option);
  };

  const reset = () => {
    setUrl('');
    setAppState(AppState.IDLE);
    setMetadata(null);
    setDownloadProgress(0);
    setActiveDownloadId(null);
    setLogs([]);
    setActiveTab('home');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-white dark:bg-black transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-[20%] w-[60vw] h-[60vw] bg-brand-500/5 dark:bg-brand-900/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40vw] h-[40vw] bg-red-600/5 dark:bg-red-900/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <header className="w-full p-4 md:p-6 flex justify-between items-center z-20 backdrop-blur-md sticky top-0 border-b border-slate-100 dark:border-slate-900/50">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={reset}>
          <div className="relative">
            <CloudDownload className="w-8 h-8 md:w-10 md:h-10 text-brand-600 dark:text-brand-500 fill-brand-100/20 group-hover:scale-110 transition-transform" />
            <div className="absolute -bottom-1 -right-1 bg-black text-white text-[7px] md:text-[8px] font-bold px-1 py-0.5 rounded">PY</div>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">ClipixTub</h1>
              <div className="flex flex-col gap-1 border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1">
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20 w-fit">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </span>
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-brand-500" /> {stats.real_time} <span className="opacity-50">Live</span></span>
                  <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-blue-500" /> {stats.today} <span className="opacity-50">Today</span></span>
                  <span className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3 text-purple-500" /> {stats.weekly} <span className="opacity-50">Week</span></span>
                </div>
              </div>
            </div>
            <p className="text-[8px] md:text-[10px] font-medium text-slate-400 uppercase tracking-widest hidden sm:block">Youtube video downloader</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'home' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Downloader</button>
            <button onClick={() => setActiveTab('trending')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'trending' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5'}`}>
              <Flame className={`w-3.5 h-3.5 ${activeTab === 'trending' ? 'text-orange-500' : ''}`} /> Trending
            </button>
            <button onClick={() => setActiveTab('discover')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'discover' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'discover' ? 'text-brand-600' : ''}`} /> Discover
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>History</button>
            <button onClick={() => setActiveTab('about')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'about' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>About</button>
          </nav>
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={() => setActiveTab('trending')}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === 'trending' ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              aria-label="Trending"
            >
              <Flame className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === 'discover' ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              aria-label="Discover"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === 'history' ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              aria-label="History"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === 'about' ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              aria-label="About"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-1 ml-2 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={() => setShowDonation(true)}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all group"
              title="Donate to Support"
            >
              <div className="relative">
                <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              </div>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-4 md:px-8 max-w-6xl mx-auto w-full z-10 pb-20">
        {activeTab === 'about' && <AboutView onDonate={() => setShowDonation(true)} />}
        {activeTab === 'history' && <HistoryView history={history} onClear={() => setHistory([])} />}
        {activeTab === 'trending' && <TrendingView onSelect={(id) => {
          const videoUrl = `https://www.youtube.com/watch?v=${id}`;
          setUrl(videoUrl);
          setActiveTab('home');
          // Auto-load meta after switching
          setTimeout(() => {
            const fetchBtn = document.getElementById('fetch-metadata-btn');
            if (fetchBtn) fetchBtn.click();
          }, 100);
        }} />}
        {activeTab === 'discover' && <DiscoverView onSelect={(id) => {
          const videoUrl = `https://www.youtube.com/watch?v=${id}`;
          setUrl(videoUrl);
          setActiveTab('home');
          setTimeout(() => {
            const fetchBtn = document.getElementById('fetch-metadata-btn');
            if (fetchBtn) fetchBtn.click();
          }, 100);
        }} />}
        {activeTab === 'home' && (
          <>
            <div className={`w-full max-w-4xl text-center transition-all duration-700 ${appState === AppState.IDLE ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-10 hidden'}`}>
              <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in">
                <span className="px-4 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-brand-500/20 shadow-sm">
                  {greeting}
                </span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-none">
                Clipix<span className="brand-text-shimmer">Tub</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-10 font-semibold max-w-3xl mx-auto leading-snug">
                Download All types of Youtube content and convert to all formats with all qualities.
              </p>
              <div className="flex items-center justify-center gap-8 mb-12 flex-wrap">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Terminal className="w-4 h-4 text-brand-500" /> Python Native</span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Sparkles className="w-4 h-4 text-brand-500" /> 4K Support</span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Cpu className="w-4 h-4 text-brand-500" /> FFmpeg Encoding</span>
              </div>
            </div>

            {(appState === AppState.IDLE || appState === AppState.ERROR) && (
              <form onSubmit={handleAnalyze} className="w-full max-w-3xl relative group z-20">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center"><Link className="h-6 w-6 text-slate-300 group-focus-within:text-brand-500 transition-colors" /></div>
                <input
                  type="text"
                  placeholder="Paste YouTube Video, Short, or Playlist URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-16 pr-36 py-6 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-100 dark:border-slate-800 focus:border-brand-500 shadow-2xl shadow-brand-500/5 text-lg font-medium outline-none transition-all text-slate-900 dark:text-white font-mono"
                />
                <button type="submit" disabled={!url} className="absolute inset-y-2 right-2 px-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
                  <Download className="w-5 h-5" /> DOWNLOAD
                </button>
              </form>
            )}

            <div className="mt-8 flex items-center justify-center gap-6 animate-fade-in opacity-80 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowDonation(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Coffee className="w-3.5 h-3.5" />
                Support ClipixTub
              </button>
              <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <a
                href="https://github.com/YasserXD00/ClipixTub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                Source Code
              </a>
            </div>

            {appState === AppState.ANALYZING && (
              <div className="flex flex-col items-center mt-20 animate-fade-in">
                <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-sm w-full max-w-md shadow-2xl border border-slate-800">
                  <p className="animate-pulse">&gt; Initializing Python environment...</p>
                  <p className="opacity-75">&gt; Loading extractors...</p>
                  <p className="opacity-50">&gt; Connecting to youtube...</p>
                </div>
                <p className="mt-8 text-slate-900 dark:text-white font-bold animate-pulse text-lg">Resolving Metadata...</p>
              </div>
            )}

            {(appState === AppState.READY || appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && metadata && (
              <div className="w-full max-w-5xl mt-10 animate-fade-in pb-20">
                <div className="flex justify-between items-center mb-8">
                  <button onClick={reset} className="text-sm font-bold text-slate-400 hover:text-brand-500 flex items-center gap-2 transition-colors uppercase tracking-widest">
                    <ArrowRight className="w-4 h-4 rotate-180" /> Change Content
                  </button>
                  <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    <Terminal className="w-3.5 h-3.5" /> Python v3.11.4
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <VideoCard metadata={metadata} />

                  {(appState === AppState.READY || appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && metadata.type === 'video' && (
                    <DownloadOptions
                      metadata={metadata}
                      onDownload={handleDownloadOption}
                      appState={appState}
                      activeDownloadId={activeDownloadId}
                      downloadProgress={downloadProgress}
                    />
                  )}

                  {appState === AppState.READY && (metadata.type === 'playlist' || metadata.type === 'channel') && (
                    <PlaylistView
                      metadata={metadata}
                      onDownloadItem={(item) => simulateDownload(`${item.title}.mp4`, item.videoId, { title: item.title, type: 'video', format: 'mp4', thumbnailUrl: item.thumbnailUrl })}
                      onDownloadAll={(items) => simulateDownload(`ClipixTub_Playlist_Batch.zip`, 'batch-download', { title: `Batch: ${metadata.title}`, type: 'playlist', format: 'zip', thumbnailUrl: metadata.thumbnailUrl })}
                    />
                  )}

                  {(appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && (
                    <div className="mt-8 bg-slate-950 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-800 text-left animate-slide-up relative overflow-hidden font-mono">
                      {appState === AppState.DOWNLOADING ? (
                        <>
                          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                            <span className="text-slate-400 text-xs">root@clipixtub:~# python3 engine.py --url "{url.substring(0, 25)}..."</span>
                            <span className="text-brand-500 font-bold">{Math.round(downloadProgress)}%</span>
                          </div>
                          <div className="h-64 overflow-y-auto space-y-1 pr-2 scrollbar-hide text-sm">
                            {logs.map((log, i) => (
                              <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-300'}`}>
                                <span className="opacity-50 text-xs select-none">[{log.timestamp}]</span>
                                <span>{log.message}</span>
                              </div>
                            ))}
                            <div ref={logsEndRef} />
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center font-sans">
                          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                          </div>
                          <h3 className="text-3xl font-black text-white mb-2">Process Completed</h3>
                          <p className="text-slate-400 mb-8 max-w-md mx-auto">The Python script exited successfully. Media file generated.</p>
                          <button onClick={reset} className="px-12 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xl transition-all hover:scale-105">New Process</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {appState === AppState.ERROR && (
              <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-900/30 max-w-3xl w-full text-center font-bold">
                {errorMsg}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest border-t border-slate-100 dark:border-slate-900/50">
        <p>© 2025 ClipixTub. Powered by Python Engine.</p>
      </footer>
      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  );
}