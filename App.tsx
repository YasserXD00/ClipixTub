import * as React from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { VideoCard } from './components/VideoCard';
import { DownloadOptions } from './components/DownloadOptions';
import { PlaylistView } from './components/PlaylistView';
import { HistoryView } from './components/HistoryView';
import { getContentMetadata } from './services/geminiService';
import { ContentMetadata, AppState, DownloadOption, PlaylistItem, HistoryItem } from './types';
import { CloudDownload, Link, Loader2, CheckCircle, ArrowRight, ShieldCheck, Download, History } from 'lucide-react';

export default function App() {
  const [url, setUrl] = React.useState('');
  const [appState, setAppState] = React.useState<AppState>(AppState.IDLE);
  const [metadata, setMetadata] = React.useState<ContentMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [downloadMessage, setDownloadMessage] = React.useState('Starting download...');
  const [errorMsg, setErrorMsg] = React.useState('');
  
  // Navigation & History State
  const [activeTab, setActiveTab] = React.useState<'home' | 'history'>('home');
  const [history, setHistory] = React.useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('clipix_history');
    return saved ? JSON.parse(saved) : [];
  });

  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    localStorage.setItem('clipix_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg('');
    setActiveTab('home'); // Ensure we are on home tab when analyzing
    
    try {
      const data = await getContentMetadata(url);
      setMetadata(data);
      setAppState(AppState.READY);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to analyze URL. Please ensure it's a valid link.");
      setAppState(AppState.ERROR);
    }
  };

  const simulateDownload = (filename: string, historyData?: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setAppState(AppState.DOWNLOADING);
    setDownloadProgress(0);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setDownloadProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Perform completion actions in a timeout to escape the render/setState cycle clean
          setTimeout(() => {
             setAppState(AppState.COMPLETED);
             
             // Trigger file download
             try {
                const blob = new Blob(["Simulated content for " + filename], { type: 'text/plain' });
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(blobUrl);
             } catch (e) {
                console.error("Download failed", e);
             }
             
             // Add to history if data provided
             if (historyData) {
               addToHistory(historyData);
             }
          }, 0);

          return 100;
        }
        return next;
      });
    }, 150);
  };

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDownloadOption = (option: DownloadOption) => {
    setDownloadMessage(`Downloading ${option.type} (${option.format})...`);
    if (!metadata) return;

    simulateDownload(
      `ClipixTub_${metadata.title.substring(0,10).replace(/[^a-z0-9]/gi, '_')}_${option.id}.${option.format}`,
      {
        title: metadata.title,
        type: option.type,
        format: option.format,
        thumbnailUrl: metadata.thumbnailUrl
      }
    );
  };

  const handleDownloadItem = (item: PlaylistItem) => {
    setDownloadMessage(`Downloading: ${item.title}`);
    simulateDownload(
      `ClipixTub_${item.title.substring(0,10).replace(/[^a-z0-9]/gi, '_')}.mp4`,
      {
        title: item.title,
        type: 'video',
        format: 'mp4',
        thumbnailUrl: item.thumbnailUrl
      }
    );
  };

  const handleDownloadAll = (items: PlaylistItem[]) => {
    setDownloadMessage(`Batch downloading ${items.length} items...`);
    // In a real app, this would queue them. Here we just simulate one long process.
    simulateDownload(
      `ClipixTub_Playlist_Batch_${items.length}_files.zip`,
      {
        title: metadata ? `Batch: ${metadata.title}` : `Batch Download (${items.length} items)`,
        type: 'playlist',
        format: 'zip',
        thumbnailUrl: metadata?.thumbnailUrl
      }
    );
  };

  const reset = () => {
    setUrl('');
    setAppState(AppState.IDLE);
    setMetadata(null);
    setDownloadProgress(0);
    setActiveTab('home');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-white dark:bg-black transition-colors duration-300">
      
      {/* Background Decor - Red Theme */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-[20%] w-[60vw] h-[60vw] bg-brand-500/5 dark:bg-brand-900/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40vw] h-[40vw] bg-red-600/5 dark:bg-red-900/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center z-20 backdrop-blur-md sticky top-0 border-b border-slate-100 dark:border-slate-900/50">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={reset}
        >
          {/* Red Cloud Icon */}
          <div className="relative">
             <CloudDownload className="w-10 h-10 text-brand-600 dark:text-brand-500 fill-brand-100/20 dark:fill-brand-900/20 group-hover:scale-110 transition-transform" />
             <div className="absolute -bottom-1 -right-1 bg-black text-white text-[8px] font-bold px-1 py-0.5 rounded">HD</div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
              ClipixTub
            </h1>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
              La qualité HD en un clic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              Downloader
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              History {history.length > 0 && <span className="bg-brand-100 dark:bg-brand-900/50 text-brand-600 text-[10px] px-1.5 py-0.5 rounded-full">{history.length}</span>}
            </button>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-4 md:px-8 max-w-6xl mx-auto w-full z-10 pb-20">
        
        {/* Mobile Nav Switcher (Visible only on small screens) */}
        <div className="sm:hidden w-full mb-8">
           <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button 
                onClick={() => setActiveTab('home')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}
              >
                Downloader
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-sm' : 'text-slate-500'}`}
              >
                History ({history.length})
              </button>
           </div>
        </div>

        {activeTab === 'history' ? (
          <HistoryView history={history} onClear={clearHistory} />
        ) : (
          <>
            {/* Hero & Input Section */}
            <div className={`w-full max-w-3xl text-center transition-all duration-500 ${appState === AppState.IDLE ? 'scale-100 opacity-100' : 'scale-95 opacity-0 hidden'}`}>
              <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-none">
                Download <span className="text-brand-600 dark:text-brand-500">Everything.</span>
              </h2>
              <p className="text-2xl text-slate-500 dark:text-slate-400 mb-10 font-medium">
                Videos. Shorts. Playlists. Subtitles.
              </p>
            </div>

            {/* Input Field */}
            <div className={`w-full max-w-3xl transition-all duration-500 ${appState !== AppState.IDLE && appState !== AppState.ERROR ? 'mt-0' : 'mt-0'}`}>
              
              {(appState === AppState.IDLE || appState === AppState.ERROR) && (
                <form onSubmit={handleAnalyze} className="relative group z-20">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Link className="h-6 w-6 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Paste YouTube Video, Playlist or Channel URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-16 pr-36 py-6 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-100 dark:border-slate-800 focus:border-brand-500 dark:focus:border-brand-500 shadow-2xl shadow-brand-500/5 text-lg font-medium outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                  <div className="absolute inset-y-2 right-2">
                    <button
                      type="submit"
                      disabled={!url}
                      className="h-full px-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                      GO <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}

              {appState === AppState.ERROR && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center gap-3 animate-fade-in border border-red-100 dark:border-red-900/30">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Analyzing Loader */}
            {appState === AppState.ANALYZING && (
              <div className="flex flex-col items-center justify-center mt-20 animate-fade-in">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                  </div>
                </div>
                <p className="mt-8 text-slate-900 dark:text-white font-bold animate-pulse text-lg">
                  Analyzing Content...
                </p>
              </div>
            )}

            {/* Results View */}
            {(appState === AppState.READY || appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && metadata && (
              <div className="w-full max-w-5xl mt-10 animate-fade-in pb-20">
                
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={reset}
                    className="text-sm font-bold text-slate-400 hover:text-brand-500 flex items-center gap-2 transition-colors uppercase tracking-wider"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Start Over
                  </button>
                  {appState === AppState.READY && (
                      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Secure Download
                      </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Metadata Card */}
                  <div className="lg:col-span-12">
                    <VideoCard metadata={metadata} />
                  </div>

                  {/* Interaction Area */}
                  <div className="lg:col-span-12">
                    
                    {/* Show Video/Audio Options only for single videos */}
                    {appState === AppState.READY && metadata.type === 'video' && (
                      <DownloadOptions metadata={metadata} onDownload={handleDownloadOption} />
                    )}

                    {/* Show Playlist/Channel View */}
                    {appState === AppState.READY && (metadata.type === 'playlist' || metadata.type === 'channel') && (
                        <PlaylistView 
                          metadata={metadata} 
                          onDownloadItem={handleDownloadItem} 
                          onDownloadAll={handleDownloadAll} 
                        />
                    )}

                    {/* Download Status Overlay */}
                    {(appState === AppState.DOWNLOADING || appState === AppState.COMPLETED) && (
                      <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-slide-up relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                            <div 
                              className="h-full bg-brand-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(230,0,0,0.5)]"
                              style={{ width: `${downloadProgress}%` }}
                            />
                          </div>

                          {appState === AppState.DOWNLOADING ? (
                            <div className="py-8">
                              <div className="w-24 h-24 mx-auto bg-brand-50 dark:bg-brand-900/10 rounded-full flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin opacity-20"></div>
                                <Download className="w-10 h-10 text-brand-600 dark:text-brand-500 animate-bounce" />
                              </div>
                              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{Math.round(downloadProgress)}%</h3>
                              <p className="text-slate-500 dark:text-slate-400 font-medium">{downloadMessage}</p>
                            </div>
                          ) : (
                            <div className="py-8">
                              <div className="w-24 h-24 mx-auto bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                              </div>
                              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Success!</h3>
                              <p className="text-slate-500 dark:text-slate-400 mb-10">Your content is ready and saved.</p>
                              <div className="flex gap-4 justify-center">
                                <button 
                                  onClick={() => setAppState(AppState.READY)}
                                  className="px-10 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  Back
                                </button>
                                <button 
                                  onClick={() => {
                                      setAppState(AppState.READY);
                                      setActiveTab('history');
                                  }}
                                  className="px-10 py-4 bg-brand-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-xl"
                                >
                                  View History
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-widest">
        <p>© 2025 ClipixTub. Built for Speed.</p>
      </footer>

    </div>
  );
}