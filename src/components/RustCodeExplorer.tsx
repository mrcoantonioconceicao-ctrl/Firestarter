import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Download, Terminal, ChevronRight, BookOpen, Layers, ShieldCheck, Zap } from 'lucide-react';

interface RustCodeExplorerProps {
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const RustCodeExplorer: React.FC<RustCodeExplorerProps> = ({ onDownloadZip, isDownloading }) => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('src/main.rs');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rust-project')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
      })
      .catch((err) => console.error('Erro ao buscar arquivos do projeto Rust:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const currentCode = files[activeFile] || '// Carregando código Rust...';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageTag = (fileName: string) => {
    if (fileName.endsWith('.rs')) return 'rust';
    if (fileName.endsWith('.toml')) return 'toml';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 font-mono">
            <ShieldCheck className="w-4 h-4" />
            CÓDIGO RUST 100% REAL E IDIOMÁTICO (EDITION 2021)
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Estrutura Completa do Projeto Rust
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Projeto completo com <code className="text-orange-300 font-mono">tokio</code>, <code className="text-orange-300 font-mono">chromiumoxide</code> (DevTools Protocol), <code className="text-orange-300 font-mono">scraper</code> e <code className="text-orange-300 font-mono">htmd</code> para extração e conversão em tempo real sem simulações.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-orange-400 hover:bg-orange-300 transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Baixando...' : 'Baixar Arquivos .zip'}
          </button>
        </div>
      </div>

      {/* Code Editor & File Tree View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
        {/* Sidebar file tree */}
        <div className="p-4 bg-slate-950/90 border-b lg:border-b-0 lg:border-r border-slate-800 lg:col-span-1 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Navegador de Arquivos</span>
            <span className="text-[10px] text-orange-400 font-normal">Cargo Project</span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {Object.keys(files).map((filename) => {
              const isActive = activeFile === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                    <span className="truncate">{filename}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick CLI snippet box */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>Como rodar via terminal:</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <p className="text-slate-500"># Compilar e executar</p>
              <p className="text-orange-300 font-bold select-all">
                cargo run -- --url "https://news.ycombinator.com" --selector "body"
              </p>
            </div>
          </div>
        </div>

        {/* Code display pane */}
        <div className="lg:col-span-3 bg-slate-950 flex flex-col min-h-[550px]">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-orange-400">
                {activeFile}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {getLanguageTag(activeFile)}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Arquivo</span>
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed bg-slate-950">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Carregando código do projeto...</div>
            ) : (
              <table className="w-full text-left border-collapse font-mono">
                <tbody>
                  {currentCode.split('\n').map((line, index) => (
                    <tr key={index} className="hover:bg-slate-900/50">
                      <td className="w-10 pr-4 text-right text-slate-600 select-none text-[11px] align-top py-0.5">
                        {index + 1}
                      </td>
                      <td className="pl-2 text-slate-200 whitespace-pre text-[12px] font-mono align-top py-0.5">
                        {line}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Rust Architectural Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold font-mono">
            <Zap className="w-4 h-4" />
            1. Control do Chromium via CDP
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Utiliza o crate <code className="text-orange-300 font-mono">chromiumoxide</code> para enviar comandos assíncronos ao Chrome via WebSocket usando DevTools Protocol.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
            <Layers className="w-4 h-4" />
            2. Limpeza com Scraper
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            O crate <code className="text-orange-300 font-mono">scraper</code> faz o parsing da árvore HTML, aplicando seletores CSS para extrair somente a tag ou artigo de interesse.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
            <BookOpen className="w-4 h-4" />
            3. Conversão para Markdown Limpo
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            O engine <code className="text-orange-300 font-mono">htmd</code> converte a árvore DOM em sintaxe Markdown preservando títulos (#, ##), listas, links e blocos de código.
          </p>
        </div>
      </div>
    </div>
  );
};
