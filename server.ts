import { serve } from "bun";
import * as cheerio from "cheerio";

// Função utilitária para dividir o texto em chunks otimizados para RAG
function splitIntoChunks(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let index = 0;
  
  while (index < cleaned.length) {
    let end = index + maxChunkSize;
    if (end < cleaned.length) {
      // Tenta quebrar num espaço para não cortar palavras ao meio
      const nextSpace = cleaned.indexOf(" ", end);
      if (nextSpace !== -1 && nextSpace - end < 50) {
        end = nextSpace;
      }
    }
    chunks.push(cleaned.slice(index, end).trim());
    index += maxChunkSize - overlap;
  }
  return chunks;
}

const server = serve({
  port: 3001,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);

    // Rota Raiz: Serve a Interface Gráfica
    if (url.pathname === "/" && req.method === "GET") {
      const file = Bun.file("index.html");
      return new Response(file, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Endpoint Avançado de Ingestão e Scraping para RAG (/v1/ingest)
    if (url.pathname === "/v1/ingest" && req.method === "POST") {
      try {
        const body = await req.json();
        const targetUrl = body.url;

        if (!targetUrl) {
          return new Response(JSON.stringify({ success: false, error: "URL não fornecida." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const response = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FirestarterEngine/2.0" }
        });

        if (!response.ok) {
          throw new Error(`Falha ao aceder à página: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove ruídos comuns (scripts, estilos, rodapés, navegação)
        $("script, style, nav, footer, header, aside").remove();

        const title = $("title").text().trim() || targetUrl;
        const rawText = $("body").text().replace(/\s+/g, " ").trim();
        
        // Gera os Chunks automáticos para RAG/GraphRAG
        const chunks = splitIntoChunks(rawText, 1000, 200);

        // Gera um Markdown estruturado
        const markdown = `# ${title}\n\n**Fonte:** ${targetUrl}\n\n## Conteúdo Extrafido\n\n${rawText}`;

        return new Response(
          JSON.stringify({
            success: true,
            metadata: {
              url: targetUrl,
              title,
              totalLength: rawText.length,
              totalChunks: chunks.length,
              estimatedTokens: Math.ceil(rawText.length / 4)
            },
            markdown,
            chunks
          }),
          {
            headers: { "Content-Type": "application/json; charset=utf-8" },
          }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🔥 Firestarter Enterprise Server running at http://${server.hostname}:${server.port}`);
