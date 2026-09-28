import React, { useState } from 'react';
import {
  Play,
  Globe,
  Filter,
  Settings2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Target,
  X,
  HelpCircle,
  Code2,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { TerminalLogs } from './TerminalLogs';

interface LiveSandboxProps {
  onAiAnalyze?: (promptType: 'summary' | 'entities') => void;
  isAiAnalyzing?: boolean;
  aiResult?: string | null;
}

const PRESET_URLS = [
  { name: 'Hacker News', url: 'https://news.ycombinator.com', selector: 'table.itemlist, body' },
  { name: 'Rust Lang Blog', url: 'https://blog.rust-lang.org', selector: 'main, article' },
  { name: 'Wikipedia Rust', url: 'https://en.wikipedia.org/wiki/Rust_(programming_language)', selector: 'main' },
  { name: 'Dev.to Articles', url: 'https://dev.to', selector: 'main, article' },
];

const SELECTOR_PRESETS = [
  { label: 'Artigo (.article-content)', selector: '.article-content', desc: 'Ideal para blogs e portais de notícias' },
  { label: 'Tag Article (<article>)', selector: 'article', desc: 'Tag semântica HTML5 de artigos' },
  { label: 'Conteúdo Main (<main>)', selector: 'main', desc: 'Container principal da página' },
  { label: 'ID Content (#content)', selector: '#content', desc: 'Padrão comum em CMS e WordPress' },
  { label: 'Corpo do Post (.post-body)', selector: '.post-body', desc: 'Artigos técnicos e Medium' },
  { label: 'Tabelas (table.itemlist)', selector: 'table.itemlist', desc: 'Listas estruturadas e fóruns' },
  { label: 'Markdown Body (.markdown-body)', selector: '.markdown-body', desc: 'Documentação GitHub/Readmes' },
  { label: 'Página Completa (body)', selector: 'body', desc: 'Captura o DOM inteiro' },
];

export const LiveSandbox: React.FC<LiveSandboxProps> = ({
  onAiAnalyze,
  isAiAnalyzing,
  aiResult
}) => {
  const [url, setUrl] = useState('https://news.ycombinator.com');
  const [selector, setSelector] = useState('body');
  const [showSelectorGuide, setShowSelectorGuide] = useState(false);
  const [removeScripts, setRemoveScripts] = useState(true);
  const [removeStyles, setRemoveStyles] = useState(true);
  const [removeNavFooter, setRemoveNavFooter] = useState(true);
  const [removeAds, setRemoveAds] = useState(true);
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 RustScraper/1.0');

  const [isScraping, setIsScraping] = useState(false);
  const [activeTab, setActiveTab] = useState<'markdown' | 'dom' | 'logs'>('markdown');
  const [error, setError] = useState<string | null>(null);

  const [resultData, setResultData] = useState<{
    url: string;
    title: string;
    rawSize: number;
    cleanedSize: number;
    markdownSize: number;
    compressionRatio: string;
    durationMs: number;
    selector?: string;
    matchedSelector?: string;
    elementsMatched?: number;
    markdown: string;
    cleanedHtml: string;
    headings: Array<{ level: number; text: string }>;
    logs: string[];
  } | null>(null);

  const handleScrape = async (overrideUrl?: string, overrideSelector?: string) => {
    const targetUrl = overrideUrl || url;
    const targetSelector = overrideSelector !== undefined ? overrideSelector : selector;
    setIsScraping(true);
    setError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          selector: targetSelector,
          removeScripts,
          removeStyles,
          removeNavFooter,
          removeAds,
          userAgent,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Falha ao raspar a URL informada.');
      }

      setResultData(data);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado durante a execução do scraping.');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Configuration Panel */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 font-mono">
            <Globe className="w-4 h-4" />
            EXTRATOR EM TEMPO REAL COM SUPORTE A SELETORES CUSTOMIZADOS
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Chromium CDP · Extraction Engine
          </span>
        </div>

        {/* URL Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Digite uma URL real (ex: https://news.ycombinator.com)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/50 font-mono transition-all"
            />
          </div>

          <button
            onClick={() => handleScrape()}
            disabled={isScraping || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Executar Scraping</span>
              </>
            )}
          </button>
        </div>

        {/* Quick URL Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs font-medium text-slate-500 mr-1">URLs rápidas:</span>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setUrl(preset.url);
                setSelector(preset.selector);
                handleScrape(preset.url, preset.selector);
              }}
              disabled={isScraping}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors border border-slate-700/60 flex items-center gap-1"
            >
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Custom CSS Selector Focus Feature Section */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 font-mono">
              <Target className="w-4 h-4" />
              <span>Seletor CSS Customizado para Foco de Extração</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSelectorGuide(!showSelectorGuide)}
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showSelectorGuide ? 'Ocultar Guia' : 'Guia de Seletores'}</span>
            </button>
          </div>

          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="ex: .article-content, #main-post, article, main"
                className="w-full bg-slate-900 border border-orange-500/30 rounded-xl pl-9 pr-8 py-2 text-xs text-orange-200 font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition-all"
              />
              {selector && selector !== 'body' && (
                <button
                  type="button"
                  onClick={() => setSelector('body')}
                  title="Redefinir para 'body'"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:inline">
              Foco Atual: <code className="text-orange-300 font-bold">{selector || 'body'}</code>
            </span>
          </div>

          {/* Quick Selector Presets Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium">Seletores pré-configurados sugeridos:</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {SELECTOR_PRESETS.map((preset) => {
                const isActive = selector === preset.selector;
                return (
                  <button
                    key={preset.selector}
                    type="button"
                    onClick={() => setSelector(preset.selector)}
                    title={preset.desc}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                      isActive
                        ? 'bg-orange-500 text-slate-950 font-bold border-orange-400 shadow-md shadow-orange-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {preset.selector}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Selector Guide */}
          {showSelectorGuide && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900/90 border border-orange-500/20 text-xs text-slate-300 space-y-2 font-mono">
              <div className="font-bold text-orange-300 flex items-center gap-1.5 font-sans">
                <Code2 className="w-4 h-4 text-orange-400" />
                Como funcionam os Seletores CSS no Extrator Rust:
              </div>
              <ul className="space-y-1 list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-slate-200">Classes CSS (ex: .article-content):</strong> Isolam contêineres específicos que possuem a classe.
                </li>
                <li>
                  <strong className="text-slate-200">IDs CSS (ex: #main-article):</strong> Direcionam a extração para um elemento único na página.
                </li>
                <li>
                  <strong className="text-slate-200">Tags Semânticas (ex: article, main):</strong> Ideais para páginas modernas com HTML5 bem estruturado.
                </li>
                <li>
                  <strong className="text-slate-200">Múltiplos Seletores (ex: .article-content, main, body):</strong> Tenta o primeiro seletor; se não encontrar, aplica o fallback automaticamente.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* DOM Cleaning Options Row */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="rem-scripts"
              checked={removeScripts}
              onChange={(e) => setRemoveScripts(e.target.checked)}
              className="rounded accent-orange-500 bg-slate-900 border-slate-800"
            />
            <label htmlFor="rem-scripts" className="text-xs text-slate-300 cursor-pointer select-none">
              Limpar &lt;script&gt;
            </label>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="rem-styles"
              checked={removeStyles}
              onChange={(e) => setRemoveStyles(e.target.checked)}
              className="rounded accent-orange-500 bg-slate-900 border-slate-800"
            />
            <label htmlFor="rem-styles" className="text-xs text-slate-300 cursor-pointer select-none">
              Limpar &lt;style&gt;
            </label>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="rem-nav"
              checked={removeNavFooter}
              onChange={(e) => setRemoveNavFooter(e.target.checked)}
              className="rounded accent-orange-500 bg-slate-900 border-slate-800"
            />
            <label htmlFor="rem-nav" className="text-xs text-slate-300 cursor-pointer select-none">
              Remover &lt;nav&gt;/&lt;footer&gt;
            </label>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="rem-ads"
              checked={removeAds}
              onChange={(e) => setRemoveAds(e.target.checked)}
              className="rounded accent-orange-500 bg-slate-900 border-slate-800"
            />
            <label htmlFor="rem-ads" className="text-xs text-slate-300 cursor-pointer select-none">
              Expurgar Anúncios
            </label>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Falha ao executar o Web Scraping</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Execution Results Summary Banner */}
      {resultData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Status</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>200 OK</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Seletor CSS Usado</div>
            <div className="text-xs font-bold text-orange-400 font-mono mt-0.5 truncate" title={resultData.matchedSelector}>
              {resultData.matchedSelector || resultData.selector || selector}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Latência</div>
            <div className="text-xs font-bold text-white font-mono mt-0.5">
              {resultData.durationMs} ms
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase">HTML Original</div>
            <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">
              {(resultData.rawSize / 1024).toFixed(1)} KB
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Markdown Final</div>
            <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
              {(resultData.markdownSize / 1024).toFixed(1)} KB
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Limpeza DOM</div>
            <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">
              {resultData.compressionRatio}
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation for Output Views */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'markdown'
                ? 'bg-slate-800 text-orange-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Markdown Resultado
          </button>
          <button
            onClick={() => setActiveTab('dom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dom'
                ? 'bg-slate-800 text-orange-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            HTML DOM Limpo
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-orange-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Logs CDP / Tokio Runtime
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'markdown' && (
        <MarkdownViewer
          markdown={resultData?.markdown || ''}
          headings={resultData?.headings || []}
          title={resultData?.title}
          url={resultData?.url}
          onAiAnalyze={onAiAnalyze}
          isAiAnalyzing={isAiAnalyzing}
          aiResult={aiResult}
        />
      )}

      {activeTab === 'dom' && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre className="text-slate-300 whitespace-pre-wrap break-words">
            {resultData?.cleanedHtml || 'Nenhum HTML capturado ainda.'}
          </pre>
        </div>
      )}

      {activeTab === 'logs' && (
        <TerminalLogs logs={resultData?.logs || []} isScraping={isScraping} />
      )}
    </div>
  );
};
