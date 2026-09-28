import * as cheerio from 'cheerio';
import { serve } from 'bun';
import { readFileSync, existsSync } from 'fs';

const PORT = 3001;

serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);

    // Endpoint de scraping (POST)
    if (req.method === 'POST' && url.pathname === '/v1/scrape') {
      try {
        const body = await req.json();
        const targetUrl = body.url;

        if (!targetUrl) {
          return new Response(JSON.stringify({ error: 'URL é obrigatória' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const response = await fetch(targetUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        $('script, style, nav, footer').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();

        return new Response(JSON.stringify({
          success: true,
          url: targetUrl,
          markdown: textContent.substring(0, 2000)
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Servir o Frontend (index.html) na raiz (GET /)
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      if (existsSync('index.html')) {
        const htmlContent = readFileSync('index.html', 'utf-8');
        return new Response(htmlContent, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      return new Response('Arquivo index.html não encontrado na raiz.', { status: 404 });
    }

    return new Response('Endpoint não encontrado', { status: 404 });
  },
});

console.log(`🚀 Firestarter rodando em http://127.0.0.1:${PORT}`);
