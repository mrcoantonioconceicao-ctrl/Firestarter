import React, { useState } from 'react';
import { Terminal, Copy, Check, RefreshCw } from 'lucide-react';

interface TerminalLogsProps {
  logs: string[];
  isScraping: boolean;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs, isScraping }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <Terminal className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-slate-300 font-semibold">tokio-tracing-subscriber.log</span>
        </div>

        <div className="flex items-center gap-3">
          {isScraping && (
            <div className="flex items-center gap-2 text-orange-400 text-[11px] font-semibold animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Executando Tokio async task...
            </div>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar Logs'}
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-[350px] space-y-1.5 font-mono text-slate-300 leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Nenhum log gerado ainda. Execute uma tarefa no sandbox.</div>
        ) : (
          logs.map((log, idx) => {
            let color = 'text-slate-300';
            if (log.includes('[ERROR]')) color = 'text-rose-400 font-bold';
            else if (log.includes('[WARN]')) color = 'text-amber-300';
            else if (log.includes('🚀') || log.includes('✅')) color = 'text-emerald-400 font-semibold';
            else if (log.includes('🌐') || log.includes('🧹')) color = 'text-orange-300';

            return (
              <div key={idx} className="flex gap-2">
                <span className="text-slate-600 select-none w-6 text-right font-mono">{idx + 1}</span>
                <span className={color}>{log}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
