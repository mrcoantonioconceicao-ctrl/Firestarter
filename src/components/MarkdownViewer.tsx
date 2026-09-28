import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Copy, Check, FileText, Code, List, Eye, Sparkles, Loader2 } from 'lucide-react';

interface Heading {
  level: number;
  text: string;
}

interface MarkdownViewerProps {
  markdown: string;
  headings?: Heading[];
  title?: string;
  url?: string;
  onAiAnalyze?: (promptType: 'summary' | 'entities') => void;
  isAiAnalyzing?: boolean;
  aiResult?: string | null;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  markdown,
  headings = [],
  title,
  url,
  onAiAnalyze,
  isAiAnalyzing,
  aiResult
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw' | 'ai'>('rendered');

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedHtml = useMemo(() => {
    if (!markdown) return '';
    try {
      return marked.parse(markdown);
    } catch (e) {
      return `<pre class="text-rose-400 font-mono">${markdown}</pre>`;
    }
  }, [markdown]);

  const wordCount = useMemo(() => {
    return markdown ? markdown.trim().split(/\s+/).length : 0;
  }, [markdown]);

  const readTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  if (!markdown) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">Nenhum Markdown Extraído Ainda</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Insira uma URL na barra de execução acima e clique em "Executar Scraping" para extrair o DOM em tempo real e converter para Markdown limpo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Output Extraído
          </span>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{wordCount.toLocaleString()} palavras</span>
            <span className="text-slate-600">·</span>
            <span>~{readTimeMin} min de leitura</span>
            <span className="text-slate-600">·</span>
            <span>{(new Blob([markdown]).size / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle buttons */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('rendered')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'rendered'
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Renderizado
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'raw'
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Markdown Bruto
            </button>
            {aiResult && (
              <button
                onClick={() => setViewMode('ai')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'ai'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Análise AI
              </button>
            )}
          </div>

          {/* AI buttons */}
          {onAiAnalyze && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAiAnalyze('summary')}
                disabled={isAiAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 transition-all disabled:opacity-50"
                title="Resumir conteúdo extraído usando Gemini AI"
              >
                {isAiAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                Resumir com AI
              </button>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px] divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Table of contents sidebar */}
        <div className="p-4 bg-slate-950/40 lg:col-span-1 overflow-y-auto max-h-[600px]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <List className="w-3.5 h-3.5 text-orange-400" />
            Estrutura de Títulos ({headings.length})
          </div>
          {headings.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Nenhum título H1-H3 detectado na página.</p>
          ) : (
            <div className="space-y-1.5 font-sans">
              {headings.map((h, i) => (
                <div
                  key={i}
                  style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                  className="text-xs text-slate-300 hover:text-orange-400 transition-colors truncate py-0.5 border-l border-slate-800 pl-2"
                >
                  <span className="text-slate-500 font-mono text-[10px] mr-1.5">H{h.level}</span>
                  {h.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Output View */}
        <div className="lg:col-span-3 p-6 overflow-y-auto max-h-[600px] bg-slate-900/40">
          {viewMode === 'rendered' && (
            <div
              className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-orange-100 prose-a:text-orange-400 prose-code:font-mono prose-code:bg-slate-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 text-slate-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}

          {viewMode === 'raw' && (
            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              {markdown}
            </pre>
          )}

          {viewMode === 'ai' && aiResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Análise Gerada pelo Gemini AI
              </div>
              <div
                className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed bg-slate-950 p-5 rounded-xl border border-amber-500/20"
                dangerouslySetInnerHTML={{ __html: marked.parse(aiResult) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
