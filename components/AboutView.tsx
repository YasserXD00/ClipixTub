import * as React from 'react';
import { Terminal, Cpu, Sparkles, Github, BookOpen, Layers, ShieldCheck, Zap, Code, ChevronRight, Copy, Check, Coffee, Heart, Globe, Box } from 'lucide-react';
import { motion } from 'framer-motion';

export const AboutView: React.FC = () => {
  const handleDonate = () => {
    window.open('https://buymeacoffee.com/yvsr', '_blank');
  };
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-5xl mx-auto mt-8 pb-32 space-y-24"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-[0.4em] border border-brand-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Core Architecture
        </div>
        <h2 className="text-6xl md:text-8xl font-black text-slate-950 dark:text-white tracking-tighter leading-none">
          Next-Gen <br /><span className="text-brand-600 brand-text-shimmer">Extraction</span>
        </h2>
        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed tracking-tight font-medium">
          ClipixTub is a sophisticated media distribution engine leveraging virtualized <strong className="text-slate-900 dark:text-white">Python 3.11</strong> environments and hardware-accelerated <strong className="text-slate-900 dark:text-white">FFmpeg</strong> transcoding.
        </p>
      </motion.section>

      {/* Code Innovation Section */}
      <motion.section variants={itemVariants} className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Terminal className="w-8 h-8 text-brand-500" />
              Open Logic
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Our core downloader logic, available for the community.</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard' : 'Copy Python Source'}
          </button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-500 to-rose-500 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-[#09090b] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/30"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/30"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
              </div>
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">media_engine_v2.py</span>
            </div>
            <div className="p-8 overflow-x-auto">
              <code className="text-sm font-mono text-slate-300 leading-relaxed whitespace-pre font-medium block">
                {pythonCode}
              </code>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Cpu className="w-6 h-6" />, title: 'FFmpeg Core', desc: 'Enterprise-grade transcoding with adaptive stream merging for zero-loss fidelity.' },
          { icon: <Globe className="w-6 h-6" />, title: 'Global CDN', desc: 'Direct manifest pre-fetching ensures instant initialization and maximum bandwidth.' },
          { icon: <ShieldCheck className="w-6 h-6" />, title: 'Secure Tunnels', desc: 'All extraction processes run in ephemeral sandboxed environments for total privacy.' },
        ].map((feat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="glass-card p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 transition-all"
          >
            <div className="w-14 h-14 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mb-8">
              {feat.icon}
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{feat.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* GitHub & Community */}
      <motion.section
        variants={itemVariants}
        className="glass-card bg-slate-950 rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-12 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-600/10 rounded-full blur-[120px] -mr-[20rem] -mt-[20rem]"></div>
        <div className="space-y-6 relative z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            <Github className="w-10 h-10" />
            <div className="h-10 w-px bg-white/20"></div>
            <h3 className="text-4xl font-black tracking-tighter">Open Source</h3>
          </div>
          <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
            ClipixTub is fully transparent. Explore the architecture, contribute to the engine, or deploy your own node.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <a href="https://github.com/YasserXD00/ClipixTub" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-slate-200 transition-all">
              Access Repository
            </a>
            <a href="https://discord.gg/d6SsCCkAqe" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all backdrop-blur-xl">
              Join Discord
            </a>
          </div>
        </div>

        <div className="relative shrink-0 hidden lg:block">
          <div className="w-80 h-80 bg-gradient-to-br from-brand-500 to-rose-600 rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10">
            <Box className="w-32 h-32 text-white/90" />
          </div>
          <div className="absolute -inset-4 bg-brand-500/20 rounded-[4rem] blur-2xl -z-10"></div>
        </div>
      </motion.section>

      {/* Support Section */}
      <motion.section
        variants={itemVariants}
        className="relative group cursor-pointer"
        onClick={handleDonate}
      >
        <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-brand-500 to-rose-500 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
        <div className="relative glass-card bg-white/80 dark:bg-slate-900/80 p-12 md:p-16 rounded-[3.5rem] border border-slate-200/50 dark:border-slate-800 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
          <div className="shrink-0 w-24 h-24 bg-brand-500/10 rounded-3xl flex items-center justify-center border border-brand-500/20">
            <Coffee className="w-12 h-12 text-brand-500" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fuel the Innovation</h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
              ClipixTub is maintained by a small team of independent developers. Your support keeps our high-fidelity extraction nodes online.
            </p>
          </div>
          <button className="px-10 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-[2rem] font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-brand-600/20 active:scale-95 flex items-center gap-4">
            Support Now <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.section>

      {/* Footnote */}
      <motion.div variants={itemVariants} className="text-center space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800 w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-3 h-3 text-red-500 fill-current" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Handcrafted for the Web</p>
        </div>
        <div className="flex justify-center gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
          <span>Engine v2.5.0-BETA</span>
          <span>Node.js v18</span>
          <span>Python 3.11</span>
        </div>
      </motion.div>
    </motion.div>
  );
};