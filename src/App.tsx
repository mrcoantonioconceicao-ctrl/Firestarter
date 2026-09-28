import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LiveSandbox } from './components/LiveSandbox';
import { RustCodeExplorer } from './components/RustCodeExplorer';
import { ArchitectureView } from './components/ArchitectureView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'rust-code' | 'architecture'>('sandbox');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-rust-zip');
      if (!response.ok) throw new Error('Falha ao baixar ZIP do projeto Rust');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rust_web_scraper.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Erro no download: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAiAnalyze = async (markdownText: string, promptType: 'summary' | 'entities') => {
    setIsAiAnalyzing(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: markdownText, promptType }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResult(data.result);
    } catch (err: any) {
      setAiResult(`❌ **Erro na análise AI:** ${err.message}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {activeTab === 'sandbox' && (
          <LiveSandbox
            onAiAnalyze={(promptType) => {
              const el = document.querySelector('pre') || document.querySelector('.prose');
              const mdText = el ? el.textContent || '' : '';
              if (mdText) {
                handleAiAnalyze(mdText, promptType);
              }
            }}
            isAiAnalyzing={isAiAnalyzing}
            aiResult={aiResult}
          />
        )}

        {activeTab === 'rust-code' && (
          <RustCodeExplorer
            onDownloadZip={handleDownloadZip}
            isDownloading={isDownloading}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-bold">🦀 Rust Web Automation Engine</span>
            <span>· Edition 2021+</span>
            <span>· Tokio 1.38</span>
          </div>

          <div>
            Navegador Headless CDP · Scraper CSS · htmd Markdown Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
