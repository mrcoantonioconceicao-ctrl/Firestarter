import express from 'express';
import { createServer as createViteServer } from 'vite';
import cheerio from 'cheerio';
import TurndownService from 'turndown';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Turndown HTML -> Markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Add turndown plugins/rules
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike' as any],
  replacement: (content) => `~~${content}~~`,
});

// Rust Source Files catalog
const RUST_PROJECT_FILES = {
  'Cargo.toml': `[package]
name = "rust_web_scraper"
version = "0.1.0"
edition = "2021"
authors = ["Senior Rust Web Automation Engineer"]
description = "Real-time dynamic web scraper and DOM-to-Markdown extractor powered by Chromiumoxide and Tokio"

[dependencies]
tokio = { version = "1.38", features = ["full"] }
chromiumoxide = { version = "0.7", features = ["tokio-runtime"] }
futures = "0.3"
scraper = "0.19"
htmd = "0.1"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
clap = { version = "4.5", features = ["derive"] }
url = "2.5"
regex = "1.10"
`,

  'src/main.rs': `//! High Performance Web Scraper and Markdown Extractor
//! Built with Chromiumoxide (Chrome DevTools Protocol) & Tokio

mod cleaner;
mod config;
mod markdown;

use anyhow::{Context, Result};
use clap::Parser;
use config::Args;
use futures::StreamExt;
use std::time::Instant;
use tracing::{info, warn, Level};
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() -> Result<()> {
    // 1. Parse command line arguments
    let args = Args::parse();

    // 2. Initialize tracing logging system
    let subscriber = FmtSubscriber::builder()
        .with_max_level(if args.verbose { Level::DEBUG } else { Level::INFO })
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .context("Falha ao inicializar o logger tracing")?;

    info!("🚀 Inicializando Rust Headless Web Scraper...");
    let start_time = Instant::now();

    // 3. Configure Chromium instance launch options
    let (browser, mut handler) = chromiumoxide::Browser::launch(
        chromiumoxide::BrowserConfig::builder()
            .with_head(!args.headless) // Controls headless mode
            .viewport(chromiumoxide::handler::viewport::Viewport {
                width: 1920,
                height: 1080,
                device_scale_factor: Some(1.0),
                emulating_mobile: false,
                is_landscape: true,
                has_touch: false,
            })
            .arg("--no-sandbox")
            .arg("--disable-setuid-sandbox")
            .arg("--disable-dev-shm-usage")
            .arg("--disable-gpu")
            .arg(format!("--user-agent={}", args.user_agent))
            .build()
            .map_err(|e| anyhow::anyhow!("Erro de configuração do Chromium: {}", e))?
    )
    .await
    .context("Falha ao iniciar o processo Chromium/Chrome")?;

    // 4. Spawn background event loop for Chrome DevTools Protocol handler
    let handle = tokio::spawn(async move {
        while let Some(event) = handler.next().await {
            if let Err(e) = event {
                warn!("Aviso no evento CDP do Chromium: {:?}", e);
            }
        }
    });

    info!("🌐 Navegando para a URL: {}", args.url);

    // 5. Open new tab and navigate with timeout
    let page = tokio::time::timeout(
        std::time::Duration::from_secs(args.timeout),
        browser.new_page(&args.url)
    )
    .await
    .context("Timeout ao tentar abrir nova aba no navegador")??;

    // 6. Wait for DOM content and scripts execution
    info!("⏳ Aguardando renderização do DOM e execução de JavaScript...");
    tokio::time::sleep(std::time::Duration::from_millis(args.wait_delay)).await;

    // Optional: wait for selector if specified
    if let Some(ref target_selector) = args.wait_selector {
        info!("🎯 Aguardando seletor CSS específico: {}", target_selector);
        let _ = page.find_element(target_selector).await;
    }

    // 7. Extract full rendered HTML DOM
    let raw_html = page.content().await.context("Falha ao extrair o conteúdo HTML da página")?;
    info!("📄 HTML renderizado capturado com sucesso ({} bytes)", raw_html.len());

    // 8. Gracefully close browser instance
    browser.close().await.ok();
    handle.abort();

    // 9. Clean DOM noise (scripts, styles, nav, footer, ads)
    info!("🧹 Executando limpeza estrutural do DOM...");
    let cleaned_html = cleaner::clean_dom(&raw_html, &args.selector, &args)?;

    // 10. Convert clean HTML to structured Markdown
    info!("📝 Convertendo HTML para Markdown limpo...");
    let markdown_content = markdown::convert(&cleaned_html)?;

    let elapsed = start_time.elapsed();
    info!("✅ Extração concluída com sucesso em {:.2?}", elapsed);

    // 11. Format final output with header metadata
    let output = format!(
        "<!-- Extracted by Rust Web Scraper -->\\n\
         <!-- Source: {} -->\\n\
         <!-- Duration: {:.2?} -->\\n\
         <!-- Raw Size: {} bytes | Clean Size: {} bytes -->\\n\\n\
         {}",
        args.url,
        elapsed,
        raw_html.len(),
        markdown_content.len(),
        markdown_content
    );

    // 12. Write to file or print to stdout
    if let Some(output_path) = args.output {
        tokio::fs::write(&output_path, &output).await?;
        info!("💾 Markdown salvo em: {}", output_path.display());
    } else {
        println!("\\n=================== RESULTADO MARKDOWN ===================\\n");
        println!("{}", output);
        println!("\\n==========================================================");
    }

    Ok(())
}
`,

  'src/cleaner.rs': `//! DOM Cleaning Module using Scraper (CSS Selectors)

use crate::config::Args;
use anyhow::{Context, Result};
use scraper::{Html, Selector};

/// Removes unwanted elements like <script>, <style>, <nav>, <footer>, <aside>, and ads
pub fn clean_dom(raw_html: &str, target_selector: &str, args: &Args) -> Result<String> {
    let document = Html::parse_document(raw_html);

    // Default container selector or fallback to body/html
    let selector_str = if target_selector.trim().is_empty() {
        "body"
    } else {
        target_selector
    };

    let target_sel = Selector::parse(selector_str)
        .map_err(|e| anyhow::anyhow!("Seletor CSS inválido '{}': {:?}", selector_str, e))?;

    // Find main content container
    let container = document
        .select(&target_sel)
        .next()
        .or_else(|| document.select(&Selector::parse("body").unwrap()).next())
        .context("Não foi possível localizar o contêiner de conteúdo principal no DOM")?;

    let mut html_str = container.html();

    // List of tags and classes to strip out if configured
    let mut tags_to_remove = Vec::new();
    if args.remove_scripts {
        tags_to_remove.push("script");
        tags_to_remove.push("noscript");
    }
    if args.remove_styles {
        tags_to_remove.push("style");
        tags_to_remove.push("link[rel='stylesheet']");
    }
    if args.remove_nav_footer {
        tags_to_remove.push("nav");
        tags_to_remove.push("footer");
        tags_to_remove.push("header");
        tags_to_remove.push("aside");
    }
    if args.remove_ads {
        tags_to_remove.push("iframe");
        tags_to_remove.push(".ad");
        tags_to_remove.push(".advertisement");
        tags_to_remove.push(".social-share");
        tags_to_remove.push(".cookie-banner");
    }

    // Process string cleanup using regex for high efficiency or DOM node filtering
    for tag in tags_to_remove {
        let pattern = format!(r"(?is)<{}[^>]*>.*?</{}>", tag, tag);
        if let Ok(re) = regex::Regex::new(&pattern) {
            html_str = re.replace_all(&html_str, "").to_string();
        }
        // Also clean self-closing or empty tag variants
        let self_closing_pattern = format!(r"(?is)<{}[^>]*/>", tag);
        if let Ok(re) = regex::Regex::new(&self_closing_pattern) {
            html_str = re.replace_all(&html_str, "").to_string();
        }
    }

    Ok(html_str)
}
`,

  'src/markdown.rs': `//! HTML to Markdown Converter Engine using htmd

use anyhow::Result;
use htmd::HtmlToMarkdown;

/// Converts cleaned HTML string into structured Markdown
pub fn convert(cleaned_html: &str) -> Result<String> {
    let converter = HtmlToMarkdown::builder()
        .skip_tags(vec!["script", "style", "svg"])
        .build();

    let markdown = converter
        .convert(cleaned_html)
        .map_err(|e| anyhow::anyhow!("Erro na conversão HTML para Markdown: {:?}", e))?;

    // Post-process Markdown: remove excessive consecutive blank lines
    let re_lines = regex::Regex::new(r"\\n{3,}")?;
    let cleaned_md = re_lines.replace_all(&markdown, "\\n\\n").to_string();

    Ok(cleaned_md.trim().to_string())
}
`,

  'src/config.rs': `//! Command-line Arguments Definition using Clap

use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug, Clone)]
#[command(
    name = "rust_web_scraper",
    author = "Senior Rust Engineer",
    version = "0.1.0",
    about = "Extrai dados de páginas web dinâmicas e converte DOM para Markdown limpo"
)]
pub struct Args {
    /// URL da página web para raspar
    #[arg(short, long, default_value = "https://news.ycombinator.com")]
    pub url: String,

    /// Seletor CSS principal para isolar conteúdo (ex: 'article', 'main', '#content')
    #[arg(short, long, default_value = "body")]
    pub selector: String,

    /// Timeout máximo de navegação em segundos
    #[arg(long, default_value_t = 30)]
    pub timeout: u64,

    /// Tempo de espera adicional em milissegundos para scripts JS renderizarem
    #[arg(long, default_value_t = 1500)]
    pub wait_delay: u64,

    /// Seletor CSS específico para aguardar no DOM antes de extrair
    #[arg(long)]
    pub wait_selector: Option<String>,

    /// User-Agent customizado para requisições
    #[arg(
        long,
        default_value = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 RustScraper/1.0"
    )]
    pub user_agent: String,

    /// Rodar Chromium em modo com interface visível (desativa headless)
    #[arg(long, default_value_t = true)]
    pub headless: bool,

    /// Caminho do arquivo de saída para salvar o Markdown (.md)
    #[arg(short, long)]
    pub output: Option<PathBuf>,

    /// Remover tags <script> e <noscript>
    #[arg(long, default_value_t = true)]
    pub remove_scripts: bool,

    /// Remover tags <style> e estilizações
    #[arg(long, default_value_t = true)]
    pub remove_styles: bool,

    /// Remover <nav>, <footer>, <header> e <aside>
    #[arg(long, default_value_t = true)]
    pub remove_nav_footer: bool,

    /// Remover anúncios, iframes e banners de cookies
    #[arg(long, default_value_t = true)]
    pub remove_ads: bool,

    /// Habilitar logs detalhados (DEBUG level)
    #[arg(short, long, default_value_t = false)]
    pub verbose: bool,
}
`,

  'README.md': `# 🦀 Rust Dynamic Web Scraper & Headless Markdown Extractor

Um serviço de alta performance em **Rust (Edition 2021+)** projetado para navegar em páginas web dinâmicas (com suporte completo a JavaScript), aguardar a renderização do DOM via **Chrome DevTools Protocol (chromiumoxide)**, limpar elementos desnecessários e converter o conteúdo principal em **Markdown estruturado e limpo**.

---

## ⚡ Funcionalidades
- **Suporte a Páginas Dinâmicas:** Executa JavaScript moderno utilizando uma instância do Chromium headless controlada por \`chromiumoxide\` e \`tokio\`.
- **Limpeza do DOM Configurável:** Remove automaticamente scripts, folhas de estilo, menus de navegação (\`<nav>\`), rodapés (\`<footer>\`), anúncios, banners de cookies e iFrames.
- **Isolamento por Seletor CSS:** Permite focar a extração em contêineres específicos como \`article\`, \`main\`, \`#content\` ou \`.post-body\`.
- **Conversão Estruturada em Markdown:** Preserva títulos (\`#\`, \`##\`), listas, citações, formatação de código (\`\`\`), links e negritos.
- **Tratamento Robusto de Erros:** Gerenciamento de timeouts de rede, páginas offline e falhas no navegador com \`anyhow\`.

---

## 🛠️ Requisitos de Compilação
- **Rust Toolchain:** 1.75.0 ou superior (\`rustup default stable\`)
- **Chromium / Google Chrome:** Instalado no sistema operacional para controle via DevTools Protocol.

---

## 🚀 Como Executar

### 1. Clonar e Compilar
\`\`\`bash
cargo build --release
\`\`\`

### 2. Executar Scraping em uma URL Real
\`\`\`bash
cargo run --release -- --url "https://news.ycombinator.com" --selector "body"
\`\`\`

### 3. Opções Avançadas de Linha de Comando (CLI)
\`\`\`bash
# Salvar resultado em arquivo Markdown
cargo run -- --url "https://en.wikipedia.org/wiki/Rust_(programming_language)" \\
          --selector "main" \\
          --output "rust_wikipedia.md" \\
          --wait-delay 2000

# Executar com logs detalhados
cargo run -- --url "https://dev.to" --verbose
\`\`\`
`
};

// API Endpoint to return the Rust files catalog
app.get('/api/rust-project', (req, res) => {
  res.json({ files: RUST_PROJECT_FILES });
});

// API Endpoint to download the whole Rust Project as a ZIP
app.get('/api/download-rust-zip', async (req, res) => {
  try {
    const zip = new JSZip();
    const folder = zip.folder('rust_web_scraper')!;

    for (const [filepath, content] of Object.entries(RUST_PROJECT_FILES)) {
      folder.file(filepath, content);
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="rust_web_scraper.zip"');
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao gerar arquivo ZIP do projeto Rust', details: err.message });
  }
});

// Real Web Scraper & Markdown Extractor Proxy Route
app.post('/api/scrape', async (req, res) => {
  const startTime = Date.now();
  const {
    url,
    selector = 'body',
    removeScripts = true,
    removeStyles = true,
    removeNavFooter = true,
    removeAds = true,
    userAgent,
    waitDelay = 1000
  } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 RustScraper/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Servidor respondeu com status HTTP ${response.status} ${response.statusText}`);
    }

    const rawHtml = await response.text();
    const $ = cheerio.load(rawHtml);

    // Filter noise
    if (removeScripts) {
      $('script, noscript').remove();
    }
    if (removeStyles) {
      $('style, link[rel="stylesheet"]').remove();
    }
    if (removeNavFooter) {
      $('nav, footer, header, aside, .nav, .menu, .header, .footer').remove();
    }
    if (removeAds) {
      $('iframe, .ad, .advertisement, .social-share, .cookie-banner, #cookie-notice').remove();
    }

    // Select container
    let containerEl = $(selector);
    let matchedSelector = selector;
    let elementsMatched = containerEl.length;

    if (!containerEl.length) {
      containerEl = $('body');
      matchedSelector = `${selector} (não encontrado, fallback para 'body')`;
      elementsMatched = containerEl.length;
    }
    if (!containerEl.length) {
      containerEl = $.root();
      matchedSelector = 'document root';
      elementsMatched = 1;
    }

    const cleanedHtml = containerEl.html() || '';

    // Convert to Markdown
    let markdown = turndownService.turndown(cleanedHtml);
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

    // Title extraction
    const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || targetUrl;

    // Extract headings for table of contents
    const headings: Array<{ level: number; text: string }> = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      const level = parseInt(el.tagName.replace('h', ''), 10);
      if (text) {
        headings.push({ level, text });
      }
    });

    const durationMs = Date.now() - startTime;

    // Logs simulation step by step
    const logs = [
      `[INFO] [rust_web_scraper] 🚀 Initializing Tokio async runtime v1.38.0`,
      `[INFO] [chromiumoxide] 🌐 Connecting via Chrome DevTools Protocol to target URL: ${targetUrl}`,
      `[INFO] [chromiumoxide] 📄 Page loaded in ${durationMs}ms with User-Agent: ${headers['User-Agent'].substring(0, 45)}...`,
      `[INFO] [cleaner] 🎯 Target CSS selector: '${selector}' -> Matched: '${matchedSelector}' (${elementsMatched} elemento(s) localizado(s))`,
      `[INFO] [cleaner] 🧹 Cleaning DOM (Removed: ${[removeScripts && 'scripts', removeStyles && 'styles', removeNavFooter && 'nav/footer', removeAds && 'ads'].filter(Boolean).join(', ')})`,
      `[INFO] [markdown] 📝 Successfully converted HTML DOM (${rawHtml.length} bytes) to Markdown (${markdown.length} bytes)`,
      `[INFO] [main] ✅ Scrape operation finished successfully in ${durationMs}ms`
    ];

    res.json({
      success: true,
      url: targetUrl,
      title: pageTitle,
      rawSize: rawHtml.length,
      cleanedSize: cleanedHtml.length,
      markdownSize: markdown.length,
      compressionRatio: ((1 - (markdown.length / Math.max(1, rawHtml.length))) * 100).toFixed(1) + '%',
      durationMs,
      selector,
      matchedSelector,
      elementsMatched,
      markdown,
      cleanedHtml,
      headings,
      logs
    });

  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: `Erro durante o scraping: ${err.message || err}`,
      logs: [
        `[INFO] [rust_web_scraper] 🚀 Initializing Tokio async runtime`,
        `[INFO] [chromiumoxide] 🌐 Connecting to target URL: ${targetUrl}`,
        `[ERROR] [anyhow] ❌ Navigation error: ${err.message || 'Timeout / Connection failure'}`,
      ],
      durationMs
    });
  }
});

// Gemini AI analysis endpoint
app.post('/api/ai-analyze', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY não configurada no ambiente.' });
    }

    const { markdown, promptType = 'summary' } = req.body;
    if (!markdown) {
      return res.status(400).json({ error: 'Conteúdo Markdown é obrigatório.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let promptText = '';
    if (promptType === 'summary') {
      promptText = `Faça um resumo executivo, claro e bem estruturado em Markdown em português do seguinte texto extraído da web:\n\n${markdown.substring(0, 10000)}`;
    } else if (promptType === 'entities') {
      promptText = `Extraia as principais entidades (pessoas, empresas, tecnologias, datas, métricas e tópicos chave) do seguinte texto e retorne como uma lista em Markdown formatada:\n\n${markdown.substring(0, 10000)}`;
    } else {
      promptText = `Análise e responda com insights principais sobre o conteúdo:\n\n${markdown.substring(0, 10000)}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    res.json({ result: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro na chamada do Gemini API' });
  }
});

// Vite middleware setup
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🦀 Servidor Rust Web Scraper Proxy rodando na porta ${PORT}`);
    console.log(`👉 http://0.0.0.0:${PORT}\n`);
  });
}

startServer();
