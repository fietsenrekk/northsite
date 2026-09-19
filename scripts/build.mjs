import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE = process.env.NS_BASE || 'https://fietsenrekk.github.io/northsite/';
const BOOK = 'https://calendly.com/charlesmuwangam/intro-call';
const BOOK_EMBED = BOOK + '?hide_gdpr_banner=1&amp;hide_event_type_details=1&amp;hide_landing_page_details=1&amp;background_color=F4F3EF&amp;text_color=0C1033&amp;primary_color=1E35F0';

const data = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));
const logo = fs.readFileSync('assets/img/logo.svg', 'utf8').trim();

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* ------------------------------------------------------- the logo, in pieces */
/* The mark is a window holding two chevrons and a cursor. Each part is reused
   on its own so the page is built out of its own logo rather than decorated
   with it: dots mark a section, chevrons bracket its number, and the cursor is
   every "this opens something" affordance. */
const MARK = logo
  .replace('<svg ', '<svg class="brand__mark" aria-hidden="true" focusable="false" ')
  .replace(' role="img" aria-label="northsite"', '');

const CURSOR = '<svg viewBox="0 0 22 34" aria-hidden="true" focusable="false">' +
  '<path d="M1 1v29.5l7-6.6 4.6 10.6 5.6-2.4-4.6-10.4 9.4-1.1Z" fill="currentColor"/></svg>';

const DOTS = '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>';

const CH_L = '<svg viewBox="0 0 8 12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 1 2 6l4 5"/></svg>';
const CH_R = '<svg viewBox="0 0 8 12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1l4 5-4 5"/></svg>';
const chev = n => `<span class="chev" aria-hidden="true">${CH_L}<b class="num">${pad(n)}</b>${CH_R}</span>`;

/* ---------------------------------------------------------------- images */
/* WebP, not AVIF, and no <picture>. A <picture> element breaks object-fit on
   the card media, and a shelf whose images fail is not a shelf. */
function encode(src, out, width) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src,
    '-vf', `scale=${width}:-2:flags=lanczos`,
    '-c:v', 'libwebp', '-quality', '80', '-compression_level', '6', '-preset', 'picture', out]);
  return fs.statSync(out).size;
}
function dims(f) {
  const o = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',');
  return { w: +o[0], h: +o[1] };
}

fs.rmSync('dist', { recursive: true, force: true });
for (const d of ['dist/assets/shots', 'dist/assets/fonts', 'dist/assets/img', 'dist/assets/js']) {
  fs.mkdirSync(d, { recursive: true });
}

const shotReport = [];
for (const p of data.cleared) {
  const src = `assets/shots/${p.id}.png`;
  if (!fs.existsSync(src)) throw new Error(`missing screenshot: ${src}. Run: npm run shoot`);
  /* three columns at 1400px means a card about 430px wide, so 900px covers 2x */
  const cardBytes = encode(src, `dist/assets/shots/${p.id}.webp`, 900);
  const cd = dims(`dist/assets/shots/${p.id}.webp`);
  p._card = cd;
  const row = { id: p.id, source: p.url, captured: `${dims(src).w}x${dims(src).h} @2x`,
    card: `${cd.w}x${cd.h} webp q80 ${(cardBytes / 1024).toFixed(0)} KB` };
  if (p.featured) {
    const fb = encode(src, `dist/assets/shots/${p.id}-feat.webp`, 1600);
    const fd = dims(`dist/assets/shots/${p.id}-feat.webp`);
    p._feat = fd;
    row.featured = `${fd.w}x${fd.h} webp q80 ${(fb / 1024).toFixed(0)} KB`;
  }
  shotReport.push(row);
}

/* ---------------------------------------------------------------- the shelf */
const shelf = data.cleared.map((p, i) => `      <li class="card rise">
        <div class="card__win">
          <div class="card__bar">${DOTS}<span class="card__idx num">${pad(i + 1)}</span></div>
          <div class="card__media">
            <img src="assets/shots/${p.id}.webp" width="${p._card.w}" height="${p._card.h}"
                 alt="The ${esc(p.name)} site, as it looks right now."
                 loading="lazy" decoding="async">
          </div>
        </div>
        <div class="card__body">
          <h3 class="card__name">${esc(p.name)}</h3>
          <p class="card__kind">${esc(p.kind)}</p>
          <p class="card__line">${esc(p.line)}</p>
          <div class="card__foot">
            <p class="card__stat"><b class="num">${esc(p.stat)}</b><span>${esc(p.statLabel)}</span></p>
            <a class="open" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Open${CURSOR}<span class="vh"> ${esc(p.name)}, opens in a new tab</span></a>
          </div>
        </div>
      </li>`).join('\n');

const feat = data.cleared.find(p => p.featured);
const featSteps = feat.detail.map((d, i) => `          <li class="feat__step rise">
            <span class="feat__n num" aria-hidden="true">${pad(i + 1)}</span>
            <p>${esc(d)}</p>
          </li>`).join('\n');

/* ---------------------------------------------------------------- jsonld */
const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService', '@id': BASE + '#biz', name: 'northsite',
      alternateName: 'northsite by Visuals by Fiets', url: BASE,
      description: 'Web development from Antwerp. Static-first sites built to be found by search engines and AI assistants, to load in under a second, and to take the booking on the page.',
      areaServed: { '@type': 'City', name: 'Antwerp', addressCountry: 'BE' },
      founder: { '@id': BASE + '#me' },
      knowsAbout: ['Search engine optimisation', 'Structured data', 'Web accessibility',
        'Core Web Vitals', 'Static site generation', 'Online booking integration'],
      sameAs: ['https://www.instagram.com/northsite.co/', 'https://www.tiktok.com/@northsite.co'],
    },
    {
      '@type': 'Person', '@id': BASE + '#me', name: 'Charles Muwanga Musisi',
      jobTitle: 'Web developer', worksFor: { '@id': BASE + '#biz' },
      sameAs: ['https://www.instagram.com/northsite.co/', 'https://www.tiktok.com/@northsite.co'],
    },
    ...data.cleared.map(p => ({
      '@type': 'CreativeWork', name: p.name, url: p.url, abstract: p.line,
      creator: { '@id': BASE + '#me' }, genre: p.kind,
    })),
  ],
};

/* ---------------------------------------------------------------- the page */
const checked = new Date().toISOString().slice(0, 10);
let html = fs.readFileSync('src/index.html', 'utf8')
  .replace('{{MARK}}', MARK)
  .replace(/\{\{CURSOR\}\}/g, CURSOR)
  .replace(/\{\{DOTS\}\}/g, DOTS)
  .replace('{{N1}}', chev(1)).replace('{{N2}}', chev(2)).replace('{{N3}}', chev(3))
  .replace('{{SHELF}}', shelf)
  .replace('{{FEAT_STEPS}}', featSteps)
  .replace(/\{\{FEAT_NAME\}\}/g, esc(feat.name))
  .replace(/\{\{FEAT_URL\}\}/g, esc(feat.url))
  .replace('{{FEAT_LINE}}', esc(feat.line))
  .replace('{{FEAT_HOST}}', esc(host(feat.url)))
  .replace('{{FEAT_ID}}', feat.id + '-feat')
  .replace('{{FEAT_W}}', feat._feat.w)
  .replace('{{FEAT_H}}', feat._feat.h)
  .replace(/{{COUNT_WORD}}/g, ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty'][data.cleared.length] || String(data.cleared.length))
  .replace('{{COUNT}}', data.cleared.length)
  .replace('{{CHECKED}}', checked)
  .replace('{{YEAR}}', new Date().getFullYear())
  .replace('{{JSONLD}}', JSON.stringify(jsonld))
  .replace('{{BOOK_EMBED}}', BOOK_EMBED)
  .replace(/\{\{BOOK\}\}/g, BOOK)
  .replace(/\{\{BASE\}\}/g, BASE);

/* Inline the stylesheet. It is the only render-blocking request on the page,
   and as a separate file it cost 301ms of blocked render in the Lighthouse run.
   Font URLs are rewritten because an inlined sheet resolves them against the
   document instead of against assets/. */
const css = fs.readFileSync('src/styles.css', 'utf8').replace(/url\(fonts\//g, 'url(assets/fonts/');
html = html.replace('<link rel="stylesheet" href="assets/styles.css">', `<style>${css}</style>`);

const left = html.match(/\{\{[A-Z_0-9]+\}\}/g);
if (left) throw new Error('unreplaced placeholders: ' + [...new Set(left)].join(', '));
fs.writeFileSync('dist/index.html', html);

/* ------------------------------------------------------------ static files */
fs.copyFileSync('src/app.js', 'dist/assets/app.js');
for (const f of fs.readdirSync('assets/fonts')) fs.copyFileSync(`assets/fonts/${f}`, `dist/assets/fonts/${f}`);
fs.copyFileSync('assets/img/logo.svg', 'dist/assets/img/logo.svg');
/* GSAP and Lenis are self-hosted, so no CDN sees a visitor's IP and there is
   nothing about a third party to disclose. Calendly is the only outside
   request on the page, and it is not made until someone opens the sheet. */
for (const f of fs.readdirSync('assets/js')) {
  if (f.endsWith('.js')) fs.copyFileSync(`assets/js/${f}`, `dist/assets/js/${f}`);
}
for (const f of ['og.png', 'apple-touch-icon.png']) {
  if (fs.existsSync(`assets/img/${f}`)) fs.copyFileSync(`assets/img/${f}`, `dist/assets/img/${f}`);
  else console.log(`  note: assets/img/${f} not built yet (npm run cards)`);
}

/* favicon: the chevrons and cursor without the window, so it survives 16px */
fs.writeFileSync('dist/assets/img/favicon.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">' +
  '<rect width="256" height="256" rx="46" fill="#0C1033"/>' +
  '<g stroke="#1E35F0" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
  '<path d="M104 78 56 128l48 50"/><path d="M152 78l48 50-48 50"/></g>' +
  '<g transform="translate(126 118) rotate(6) scale(2.9)">' +
  '<path d="M0 0v29.5l7-6.6 4.6 10.6 5.6-2.4-4.6-10.4 9.4-1.1Z" fill="#F4F3EF" stroke="#0C1033" ' +
  'stroke-width="4.4" stroke-linejoin="round" paint-order="stroke"/></g></svg>');

fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
fs.writeFileSync('dist/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  `  <url><loc>${BASE}</loc><lastmod>${checked}</lastmod></url>\n</urlset>\n`);
fs.writeFileSync('dist/.nojekyll', '');

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/SCREENSHOTS.md',
  '# Screenshot report\n\nEvery frame is a real capture of the live site, taken by `scripts/shoot.mjs` ' +
  'in headless Chrome at deviceScaleFactor 2. No mockups, no device frames, no browser chrome ' +
  'composited on top: the slim bar above each card is the northsite logo used as a device, not a ' +
  'picture of a browser.\n\n| id | source | captured | shelf card | featured |\n|---|---|---|---|---|\n' +
  shotReport.map(r => `| ${r.id} | ${r.source} | ${r.captured} | ${r.card} | ${r.featured || 'n/a'} |`).join('\n') +
  '\n\nGrade applied: none. A Lanczos downscale and WebP q80, nothing else. These are documents of ' +
  'real work and they should read as exactly that.\n');

const firstView = ['dist/index.html', 'dist/assets/app.js',
  'dist/assets/fonts/Switzer-Regular.woff2', 'dist/assets/fonts/Switzer-Bold.woff2',
  ...fs.readdirSync('dist/assets/js').map(f => `dist/assets/js/${f}`)]
  .reduce((a, f) => a + fs.statSync(f).size, 0);
const shots = fs.readdirSync('dist/assets/shots').reduce((a, f) => a + fs.statSync(`dist/assets/shots/${f}`).size, 0);

console.log(`built dist/  ${data.cleared.length} cards`);
console.log(`  page + fonts + js   ${(firstView / 1024).toFixed(0)} KB`);
console.log(`  all shelf images    ${(shots / 1024).toFixed(0)} KB (every one lazy)`);
for (const r of shotReport) console.log(`  ${r.id.padEnd(19)} ${r.card}`);
