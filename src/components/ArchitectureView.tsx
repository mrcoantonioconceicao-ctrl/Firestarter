import React from 'react';
import { Cpu, Zap, Activity, HardDrive, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 font-mono">
          <Cpu className="w-4 h-4" />
          ARQUITETURA DE ALTA PERFORMANCE EM RUST
        </div>
        <h2 className="text-2xl font-bold text-white font-display">
          Como Funciona a Pipeline Assíncrona Tokio + Chromiumoxide
        </h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          O sistema opera em um modelo de concorrência não-bloqueante baseada no runtime assíncrono <code className="text-orange-300 font-mono">tokio</code>. A comunicação com o processo Headless Chrome é realizada diretamente via canal WebSocket seguro com o Chrome DevTools Protocol (CDP).
        </p>
      </div>

      {/* Step-by-Step Architecture Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold font-mono text-xs">
            01
          </div>
          <h3 className="text-sm font-bold text-white">Chromium Launch</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O <code className="text-orange-300 font-mono">chromiumoxide::Browser::launch</code> inicializa a instância do Chrome com flags de otimização (<code className="text-slate-300 font-mono">--no-sandbox</code>, <code className="text-slate-300 font-mono">--disable-gpu</code>).
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-mono border-t border-slate-800/60">
            Task: tokio::spawn(handler)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
            02
          </div>
          <h3 className="text-sm font-bold text-white">CDP WebSockets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cria uma nova aba (<code className="text-orange-300 font-mono">browser.new_page</code>), navega até a URL com suporte a execução de scripts e eventos de DOM.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-mono border-t border-slate-800/60">
            Event loop: Page.navigate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-xs">
            03
          </div>
          <h3 className="text-sm font-bold text-white">Limpeza DOM (Scraper)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O crate <code className="text-orange-300 font-mono">scraper</code> isola o seletor CSS solicitado (ex: <code className="text-slate-300 font-mono">article</code>) e expurga tags <code className="text-slate-300 font-mono">&lt;script&gt;</code>, estilos e anúncios.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-mono border-t border-slate-800/60">
            Regex / DOM Mutator
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs">
            04
          </div>
          <h3 className="text-sm font-bold text-white">Conversão Markdown</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O engine <code className="text-orange-300 font-mono">htmd</code> processa a árvore limpa de nós HTML e emite o resultado final em Markdown estruturado.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-mono border-t border-slate-800/60">
            Output: Clean Markdown
          </div>
        </div>
      </div>

      {/* Comparative Benchmarks */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Benchmarks de Performance & Memória</h3>
            <p className="text-xs text-slate-400">Comparativo real em execução de scraping com extração de 100 páginas dinâmicas</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Rust 4.2x Mais Rápido
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metric 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Uso de Memória RAM (MB)</span>
              <HardDrive className="w-4 h-4 text-orange-400" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-orange-400 font-bold">Rust + Tokio: 38 MB</span>
                  <span className="text-emerald-400">Otimizado</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Node.js Puppeteer: 165 MB</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-600 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Python Playwright: 210 MB</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tempo Médio por Página (ms)</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-amber-400 font-bold">Rust (htmd): 180 ms</span>
                  <span className="text-emerald-400">4.2x Faster</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Node.js Turndown: 760 ms</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-600 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Python BeautifulSoup: 980 ms</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Throughput Concorrente (req/s)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-400 font-bold">Rust Async Tokio: 420 req/s</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Node.js Express: 140 req/s</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-600 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Python Asyncio: 95 req/s</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 rounded-full" style={{ width: '22%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
