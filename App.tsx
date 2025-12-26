import * as React from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { VideoCard } from './components/VideoCard';
import { DownloadOptions } from './components/DownloadOptions';
import { PlaylistView } from './components/PlaylistView';
import { HistoryView } from './components/HistoryView';
import { getContentMetadata } from './services/geminiService';
import { ContentMetadata, AppState, DownloadOption, PlaylistItem, HistoryItem, DownloadPhase, LogEntry } from './types';
import { CloudDownload, Link, Loader2, CheckCircle, ArrowRight, ShieldCheck, Download, History, Cpu, Terminal, Code2, Sparkles } from 'lucide-react';

export default function App() {
  const [url, setUrl] = React.useState('');
  const [appState, setAppState] = React.useState<AppState>(AppState.IDLE);
  const [metadata, setMetadata] = React.useState<ContentMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [errorMsg, setErrorMsg] = React.useState('');
  
  const [activeTab, setActiveTab] = React.useState<'home' | 'history'>('home');
  const [history, setHistory] = React.useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('clipix_history');
    return saved ? JSON.parse(saved) : [];
  });

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

  const simulateDownload = (filename: string, historyData?: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setAppState(AppState.DOWNLOADING);
    setDownloadProgress(0);
    setLogs([]);
    addLog('Initializing Python 3.11 Environment...', 'info');

    if (intervalRef.current) clearInterval(intervalRef.current);

    let step = 0;
    const totalSteps = 100;

    intervalRef.current = window.setInterval(() => {
      setDownloadProgress((prev) => {
        const next = prev + Math.random() * 2; // Slower, more realistic for "terminal"
        
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
          if (step === 75) addLog('Transcoding frame 10452/15000...', 'info');
          if (step === 85) addLog('Transcoding frame 14900/15000...', 'info');
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

  const handleDownloadOption = (option: DownloadOption) => {
    if (!metadata) return;
    simulateDownload(
      `ClipixTub_${metadata.title.substring(0,15).replace(/\W/g, '_')}.${option.format}`,
      {
        title: metadata.title,
        type: option.type,
        format: option.format,
        thumbnailUrl: metadata.thumbnailUrl
      }
    );
  };

  const reset = () => {
    setUrl('');
    setAppState(AppState.IDLE);
    setMetadata(null);
    setDownloadProgress(0);
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

      <header className="w-full p-6 flex justify-between items-center z-20 backdrop-blur-md sticky top-0 border-b border-slate-100 dark:border-slate-900/50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="relative">
             <CloudDownload className="w-10 h-10 text-brand-600 dark:text-brand-500 fill-brand-100/20 group-hover:scale-110 transition-transform" />
             <div className="absolute -bottom-1 -right-1 bg-black text-white text-[8px] font-bold px-1 py-0.5 rounded">PY</div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">ClipixTub</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest hidden sm:block">Python Native Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full">
            <button onClick={() => setActiveTab('home')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}>Downloader</button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}>History</button>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-4 md:px-8 max-w-6xl mx-auto w-full z-10 pb-20">
        {activeTab === 'history' ? (
          <HistoryView history={history} onClear={() => setHistory([])} />
        ) : (
          <>
            <div className={`w-full max-w-4xl text-center transition-all duration-500 ${appState === AppState.IDLE ? 'scale-100 opacity-100' : 'scale-95 opacity-0 hidden'}`}>
              <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-none">
                Clipix<span className="text-brand-600">Tub</span>
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
                   <Code2 className="w-5 h-5" /> PROCESS
                </button>
              </form>
            )}

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

                  {appState === AppState.READY && metadata.type === 'video' && (
                    <DownloadOptions metadata={metadata} onDownload={handleDownloadOption} />
                  )}

                  {appState === AppState.READY && (metadata.type === 'playlist' || metadata.type === 'channel') && (
                    <PlaylistView 
                      metadata={metadata} 
                      onDownloadItem={(item) => simulateDownload(`${item.title}.mp4`, { title: item.title, type: 'video', format: 'mp4', thumbnailUrl: item.thumbnailUrl })} 
                      onDownloadAll={(items) => simulateDownload(`ClipixTub_Playlist_Batch.zip`, { title: `Batch: ${metadata.title}`, type: 'playlist', format: 'zip', thumbnailUrl: metadata.thumbnailUrl })} 
                    />
                  )}

                  {(appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && (
                    <div className="mt-8 bg-slate-950 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-800 text-left animate-slide-up relative overflow-hidden font-mono">
                        {appState === AppState.DOWNLOADING ? (
                          <>
                            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                               <span className="text-slate-400 text-xs">root@clipixtub:~# python3 engine.py --url "{url.substring(0,25)}..."</span>
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
        <p>© 2025 ClipixTub. Powered by Python.</p>
      </footer>
    </div>
  );
}