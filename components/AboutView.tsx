import * as React from 'react';
import { Terminal, Cpu, Sparkles, Github, BookOpen, Layers, ShieldCheck, Zap, Code, ChevronRight, Copy, Check, Coffee } from 'lucide-react';

interface AboutViewProps {
  onDonate?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onDonate }) => {
  const [copied, setCopied] = React.useState(false);

  const pythonCode = `import os
from pytube import YouTube

def on_progress(stream, chunk, bytes_remaining):
    total_size = stream.filesize
    bytes_downloaded = total_size - bytes_remaining
    percentage = (bytes_downloaded / total_size) * 100
    print(f"Downloading... {percentage:.2f}% complete", end='\\r')

def download_video(url, output_path='downloads'):
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    try:
        yt = YouTube(url, on_progress_callback=on_progress)
        print(f"Title: {yt.title}")
        
        # Select highest quality progressive stream (MP4)
        stream = yt.streams.get_highest_resolution()
        print(f"Starting download: {yt.title}")
        
        stream.download(output_path)
        print(f"\\nDownload finished! Saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    video_url = input("Enter YouTube URL: ")
    download_video(video_url)`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in pb-20 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest border border-brand-100 dark:border-brand-900/30">
          <Zap className="w-3.5 h-3.5 fill-current" /> Next-Gen Media Engine
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Clipix<span className="text-brand-600">Tub</span> Media Engine
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The world's first browser-based downloader powered by a virtualized Python environment and native FFmpeg transcoding.
        </p>
      </section>

      {/* Python Script Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-brand-500" />
              Native Python Implementation
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Use our core logic directly in your terminal with pytube.</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-orange-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">clipix_downloader.py</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed scrollbar-hide">
              <code>{pythonCode}</code>
            </pre>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <ChevronRight className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Requirements</p>
              <p className="text-xs text-slate-500 font-mono">pip install pytube</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <ChevronRight className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Features</p>
              <p className="text-xs text-slate-500">Real-time progress callbacks, automatic folder management, and dynamic stream resolution selection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <Terminal className="w-6 h-6" />, title: 'Python Native', desc: 'Runs an emulated Python 3.11 environment for precise content extraction and metadata resolution.' },
          { icon: <Cpu className="w-6 h-6" />, title: 'FFmpeg Core', desc: 'Hardware-accelerated transcoding ensures the highest possible fidelity for audio and video streams.' },
          { icon: <Sparkles className="w-6 h-6" />, title: '4K Ultra HD', desc: 'Support for adaptive bitrate streaming allows you to download content in full 2160p resolution.' },
          { icon: <ShieldCheck className="w-6 h-6" />, title: 'Privacy First', desc: 'All processing logs are handled in-memory. No user data is ever stored on the cloud extraction layers.' },
          { icon: <Layers className="w-6 h-6" />, title: 'Batch Engine', desc: 'Download entire playlists or channel catalogs with a single click using our multi-threaded process.' },
          { icon: <Zap className="w-6 h-6" />, title: 'Zero Buffer', desc: 'Pre-fetching streams directly from Google Video manifests for instant download initialization.' },
        ].map((feat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-brand-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-500">
              {feat.icon}
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feat.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Links / Documentation */}
      <section className="bg-slate-900 dark:bg-slate-900/50 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="space-y-4 relative z-10 text-center md:text-left">
          <h3 className="text-2xl font-black">Open Source & Community</h3>
          <p className="text-slate-400 max-w-md">
            Interested in the technical implementation? Our engine is open for inspection and contribution.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
          <a href="https://github.com/YasserXD00/ClipixTub" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-100 transition-all shadow-xl">
            <Github className="w-5 h-5" /> GitHub Repository
          </a>
          <a href="https://discord.gg/d6SsCCkAqe" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-4 bg-[#5865F2] text-white rounded-xl font-bold hover:bg-[#4752C4] transition-all border border-white/10 shadow-xl">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg> Join our Discord
          </a>

        </div>
      </section>

      {/* Support Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-indigo-700 rounded-[2.5rem] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="shrink-0 w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 rotate-3">
            <Coffee className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <h3 className="text-3xl font-black tracking-tight">Support the Project</h3>
            <p className="text-brand-100 font-medium text-lg leading-relaxed">
              ClipixTub is a labor of love. Your donations help us keep the servers running and the extraction engine optimized. Every coffee counts!
            </p>
          </div>
          <button
            onClick={onDonate}
            className="shrink-0 px-8 py-5 bg-white text-brand-600 rounded-2xl font-black text-lg hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-3 group border border-white/20"
          >
            Buy me a coffee
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Technical Footnote */}
      <div className="text-center space-y-4 opacity-50 pt-10 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ClipixTub Media Distribution Stack v2.5.0-BETA</p>
        <div className="flex justify-center gap-6">
          <span className="text-xs font-bold text-slate-400">Node.js LTS</span>
          <span className="text-xs font-bold text-slate-400">Python 3.11</span>
          <span className="text-xs font-bold text-slate-400">FFmpeg 4.4</span>
        </div>
      </div>
    </div>
  );
};