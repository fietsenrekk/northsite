import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve('dist');
const PORT = Number(process.env.PORT || 4220);
const T = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2',
  '.json':'application/json', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8' };
// gzip text and cache assets, so local Lighthouse numbers mean the same thing
// GitHub Pages will. Without this the run is penalised for 111 KiB it will
// never actually send.
const ZIP = new Set(['.html','.css','.js','.svg','.json','.xml','.txt']);

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  const ext = path.extname(f);
  const immutable = /^\/assets\//.test(p) && ext !== '.html';
  const head = {
    'content-type': T[ext] || 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=600',
  };
  const body = fs.readFileSync(f);
  if (ZIP.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    const gz = zlib.gzipSync(body, { level: 9 });
    res.writeHead(200, { ...head, 'content-encoding': 'gzip', 'content-length': gz.length });
    return res.end(gz);
  }
  res.writeHead(200, { ...head, 'content-length': body.length });
  res.end(body);
}).listen(PORT, () => console.log('northsite on http://localhost:' + PORT));
