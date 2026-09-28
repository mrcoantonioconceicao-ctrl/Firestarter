import { serve } from "bun";
import * as cheerio from "cheerio";

function splitIntoChunks(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let index = 0;
  
  while (index < cleaned.length) {
    let end = index + maxChunkSize;
    if (end < cleaned.length) {
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

// Pesquisa web 100% real e dinâmica via DuckDuckGo HTML (sem mocks)
async function searchRealWeb(query: string): Promise<string> {
  const q = query.trim();
  if (q.startsWith("http://") || q.startsWith("https://")) {
    return q;
  }

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) throw new Error("Falha ao contactar o motor de busca.");

    const html = await response.text();
    const $ = cheerio.load(html);
    let resolvedUrl = "";

    // Procura o primeiro link de resultado orgânico real da web
    $(".result__url").each((_, el) => {
      let href = $(el).attr("href");
      if (href) {
        // Remove redirecionamentos do DuckDuckGo se existirem
        if (href.includes("uddg=")) {
          const match = href.match(/uddg=([^&]+)/);
          if (match) {
            resolvedUrl = decodeURIComponent(match[1]);
          }
        } else {
          resolvedUrl = href;
        }
        if (resolvedUrl.startsWith("http")) {
          return false; // Para no primeiro link válido encontrado
        }
      }
    });

    // Fallback caso o seletor mude: procura tags `a` dentro dos resultados
    if (!resolvedUrl) {
      $(".result__a").each((_, el) => {
        let href = $(el).attr("href");
        if (href && href.startsWith("http")) {
          resolvedUrl = href;
          return false;
        }
      });
    }

    if (!resolvedUrl) {
      throw new Error("Nenhum resultado web encontrado para a consulta.");
    }

    return resolvedUrl;
  } catch (error) {
    console.error("Erro na pesquisa web real:", error);
    throw new Error("Não foi possível resolver a URL na web em tempo real.");
  }
}

const server = serve({
  port: 3001,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/" && req.method === "GET") {
      const file = Bun.file("index.html");
      return new Response(file, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/v1/ingest" && req.method === "POST") {
      try {
        const body = await req.json();
        const rawInput = body.url;

        if (!rawInput) {
          return new Response(JSON.stringify({ success: false, error: "Consulta ou URL não fornecida." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Pesquisa real na web em tempo real
        const targetUrl = await searchRealWeb(rawInput);

        const response = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FirestarterEngine/2.4" }
        });

        if (!response.ok) {
          throw new Error(`Falha ao aceder à página web resolvida (${targetUrl}): ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Limpeza agressiva de ruído de navegação
        $("script, style, nav, footer, header, aside, .sidebar, #sidebar, .menu, .navigation, [role='navigation']").remove();

        let contentContainer = $("article").length ? $("article") : $("main").length ? $("main") : $(".content").length ? $(".content") : $("body");
        
        const title = $("title").text().trim() || targetUrl;
        const rawText = contentContainer.text().replace(/\s+/g, " ").trim();
        
        const chunks = splitIntoChunks(rawText, 1000, 200);
        const markdown = `# ${title}\n\n**Consulta Real:** ${rawInput}\n**URL Web Resolvida:** ${targetUrl}\n\n## Conteúdo Extraído\n\n${rawText}`;

        return new Response(
          JSON.stringify({
            success: true,
            metadata: {
              query: rawInput,
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
