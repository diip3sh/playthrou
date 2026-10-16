import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root = new URL("..", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const port = Number(process.env.PORT) || 5178;
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/examples/";
  if (p.endsWith("/")) p += "index.html";
  const file = normalize(join(root, p));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
  } catch { res.writeHead(404).end("not found"); }
}).listen(port, () => console.log(`playthru demo → http://localhost:${port}/`));
