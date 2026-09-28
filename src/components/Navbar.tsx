import React from 'react';
import { Download, Terminal, Cpu, FileCode2, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'sandbox' | 'rust-code' | 'architecture';
  setActiveTab: (tab: 'sandbox' | 'rust-code' | 'architecture') => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  isDownloading,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single Text Element) */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20">
            🦀
          </div>
          <div>
            <a href="#" className="text-lg font-bold tracking-tight text-white font-display hover:text-orange-400 transition-colors">
              RustScraper CDP
            </a>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Tokio 1.38</span>
              <span className="text-slate-600">·</span>
              <span>Chromiumoxide</span>
              <span className="text-slate-600">·</span>
              <span>Edition 2021</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean Text Items) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sandbox'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Sandbox ao Vivo
          </button>
          <button
            onClick={() => setActiveTab('rust-code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'rust-code'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Código Rust (Cargo)
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'architecture'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Arquitetura & Benches
          </button>
        </nav>

        {/* Zone 3: Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-lg hover:from-orange-300 hover:to-amber-300 transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-60 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Gerando .zip...' : 'Baixar Projeto Rust (.zip)'}
          </button>
        </div>
      </div>
    </header>
  );
};
