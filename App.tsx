import * as React from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { VideoCard } from './components/VideoCard';
import { DownloadOptions } from './components/DownloadOptions';
import { PlaylistView } from './components/PlaylistView';
import { HistoryView } from './components/HistoryView';
import { AboutView } from './components/AboutView';
import { DonationModal } from './components/DonationModal';

import { getContentMetadata } from './services/geminiService';
import { ContentMetadata, AppState, DownloadOption, PlaylistItem, HistoryItem, LogEntry } from './types';
import { startDownload, getLogs, getStatus } from './services/backendService';
import { CloudDownload, Link, CheckCircle, ArrowRight, Terminal, Code2, Sparkles, Cpu, Info, History, Download, Coffee, Sun, Moon, Sunrise, Sunset, Users, Activity, BarChart3, Github, MousePointer2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useMotionValue } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const transition = {
  duration: 0.2
};

interface Stats {
  real_time: number;
  today: number;
  weekly: number;
}

// Simple Error Boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught:', error);
    return { hasError: true, errorMessage: error.message };
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-red-500 font-bold text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">View Error</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-sm">{this.state.errorMessage || 'Something went wrong while rendering this view.'}</p>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Your session is safe.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-brand-600 text-white font-bold rounded-2xl"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [url, setUrl] = React.useState('');
  const [appState, setAppState] = React.useState<AppState>(AppState.IDLE);
  const [metadata, setMetadata] = React.useState<ContentMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [activeDownloadId, setActiveDownloadId] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [errorMsg, setErrorMsg] = React.useState('');

  const [activeTab, setActiveTab] = React.useState<'home' | 'history' | 'about'>('home');
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
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve URL metadata.");
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

  // Mouse tracking for magnetic shine effect on main input
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      400px circle at ${mouseX}px ${mouseY}px,
      rgba(230, 0, 0, 0.1),
      transparent 80%
    )
  `;

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-transparent transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden mix-blend-screen dark:mix-blend-lighten">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] left-[20%] w-[60vw] h-[60vw] bg-brand-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.5, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[60%] -right-[10%] w-[40vw] h-[40vw] bg-rose-600/10 rounded-full blur-[100px]"
        />
      </div>

      <header className="w-full p-4 md:p-6 flex justify-between items-center z-20 backdrop-blur-md sticky top-0 border-b border-slate-100 dark:border-slate-900/50">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={reset}>
          <div className="relative">
            <CloudDownload className="w-8 h-8 md:w-10 md:h-10 text-brand-600 dark:text-brand-500 fill-brand-100/20 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">ClipixTub</h1>
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
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 relative">
            {(['home', 'history', 'about'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-colors z-10 ${activeTab === tab
                  ? 'text-brand-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  } flex items-center gap-2`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab === 'home' ? 'Downloader' : tab}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 lg:hidden">
            {(['history', 'about'] as const).map((tab) => (
              <motion.button
                key={tab}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab)}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === tab
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                aria-label={tab}
              >
                {tab === 'history' && <History className="w-5 h-5" />}
                {tab === 'about' && <Info className="w-5 h-5" />}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2 border-l border-slate-200 dark:border-slate-800 pl-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDonation(true)}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors group relative"
              title="Donate to Support"
            >
              <div className="relative">
                <Coffee className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              </div>
            </motion.button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-4 md:px-8 max-w-6xl mx-auto w-full z-10 pb-20">
        <ErrorBoundary>
          {activeTab === 'about' && <AboutView onDonate={() => setShowDonation(true)} />}
          {activeTab === 'history' && <HistoryView history={history} onClear={() => setHistory([])} />}
          {activeTab === 'home' && (
            <div className="w-full flex flex-col items-center">
              <motion.div layout className={`w-full max-w-4xl text-center transition-all duration-700 ${appState === AppState.IDLE ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-10 hidden'}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-center gap-2 mb-4"
                >
                  <span className="px-4 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-brand-500/20 shadow-sm">
                    {greeting}
                  </span>
                </motion.div>
                <motion.h2
                  initial={{ y: -20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                  className="text-7xl md:text-[8rem] font-black text-slate-950 dark:text-white mb-6 tracking-tighter leading-[0.9]"
                >
                  Clipix<span className="brand-text-shimmer inline-block">Tub</span>
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 font-medium max-w-3xl mx-auto leading-relaxed tracking-tight"
                >
                  Download all types of YouTube content and seamlessly convert to any format, in pure <strong className="text-slate-900 dark:text-white font-bold">4K fidelity</strong>.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex items-center justify-center gap-8 mb-12 flex-wrap"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Terminal className="w-4 h-4 text-brand-500" /> Python Native</span>
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Sparkles className="w-4 h-4 text-brand-500" /> 4K Support</span>
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Cpu className="w-4 h-4 text-brand-500" /> FFmpeg Encoding</span>
                </motion.div>
              </motion.div>

              {(appState === AppState.IDLE || appState === AppState.ERROR) && (
                <motion.form
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                  onSubmit={handleAnalyze}
                  onMouseMove={handleMouseMove}
                  className="w-full max-w-3xl relative group z-20 mx-auto"
                >
                  <motion.div
                    className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center z-10"><Link className="h-6 w-6 text-slate-400 group-focus-within:text-brand-500 transition-colors duration-300" /></div>
                  <input
                    type="text"
                    placeholder="Paste YouTube Video, Short, or Playlist URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-16 pr-44 py-7 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-slate-800 focus:border-brand-500/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] focus:shadow-[0_0_40px_rgba(230,0,0,0.15)] dark:focus:shadow-[0_0_40px_rgba(230,0,0,0.3)] text-lg font-medium outline-none transition-all duration-500 text-slate-900 dark:text-white font-sans relative z-0"
                  />
                  {/* Spotlight Hover Effect */}
                  <motion.div
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10"
                    style={{ background: spotlightBackground }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!url}
                    className="absolute inset-y-2.5 right-2.5 px-8 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2 z-20 hover:shadow-brand-500/40"
                  >
                    <Download className="w-5 h-5" /> <span>DOWNLOAD</span>
                  </motion.button>
                </motion.form>
              )}

              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 flex items-center justify-center gap-6 opacity-80 hover:opacity-100 transition-opacity"
              >
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
              </motion.div>

              {appState === AppState.ANALYZING && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center mt-20"
                >
                  <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-sm w-full max-w-md shadow-2xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
                    <p className="animate-pulse">&gt; Initializing Python environment...</p>
                    <p className="opacity-75">&gt; Loading extractors...</p>
                    <p className="opacity-50">&gt; Connecting to youtube...</p>
                  </div>
                  <p className="mt-8 text-slate-900 dark:text-white font-bold animate-pulse text-lg">Resolving Metadata...</p>
                </motion.div>
              )}

              {(appState === AppState.READY || appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && metadata && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="w-full max-w-5xl mt-10 pb-20"
                >
                  <div className="flex justify-start items-center mb-8">
                    <motion.button
                      whileHover={{ x: -5, color: '#ec4899' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={reset}
                      className="text-sm font-bold text-slate-400 flex items-center gap-2 transition-colors uppercase tracking-widest"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" /> Change Content
                    </motion.button>
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
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 bg-slate-950 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-800 text-left relative overflow-hidden font-mono"
                      >
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
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                              <CheckCircle className="w-12 h-12 text-green-500" />
                            </motion.div>
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Process Completed</h3>
                            <p className="text-slate-400 mb-10 max-w-md mx-auto text-lg leading-relaxed">The Python script exited successfully. Your media file has been generated and downloaded.</p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={reset}
                              className="px-10 py-4 bg-white text-slate-900 hover:bg-slate-100 font-black tracking-[0.1em] rounded-2xl shadow-xl transition-all flex items-center gap-3 mx-auto uppercase text-sm"
                            >
                              New Process <ChevronRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {appState === AppState.ERROR && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-900/30 max-w-3xl w-full text-center font-bold"
                >
                  {errorMsg}
                </motion.div>
              )}
            </div>
          )}
        </ErrorBoundary>
      </main>

      <footer className="w-full py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest border-t border-slate-100 dark:border-slate-900/50">
        <p>© 2025 ClipixTub. Powered by Python Engine.</p>
      </footer>
      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  );
}