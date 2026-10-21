// Servidor local só para testar o site: node servidor.mjs  →  http://localhost:8080
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".jpg": "image/jpeg", ".json": "application/json" };

createServer(async (req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const arq = join(raiz, caminho || "index.html");
  if (!arq.startsWith(raiz)) return res.writeHead(403).end();
  try {
    const dados = await readFile(arq);
    res.writeHead(200, { "Content-Type": tipos[extname(arq)] || "application/octet-stream" }).end(dados);
  } catch {
    res.writeHead(404).end("não encontrado");
  }
}).listen(8080, () => console.log("http://localhost:8080"));
