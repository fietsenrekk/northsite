/* Renders the social card, the touch icon, and the Awwwards thumbnails.
   Run after `node scripts/build.mjs` and with the dev server up on :4220. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LOCAL = process.env.NS_LOCAL || 'http://localhost:4220/';
const logo = fs.readFileSync('assets/img/logo.svg', 'utf8');
const data = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));

const shots = data.cleared.map(p => {
  const f = `dist/assets/shots/${p.id}.webp`;
  return fs.existsSync(f) ? 'data:image/webp;base64,' + fs.readFileSync(f).toString('base64') : '';
}).filter(Boolean).slice(0, 5);

const css = `
@font-face{font-family:Switzer;src:url("${pathToFileURL('assets/fonts/Switzer-Regular.woff2').href}") format("woff2");font-weight:400}
@font-face{font-family:Switzer;src:url("${pathToFileURL('assets/fonts/Switzer-Bold.woff2').href}") format("woff2");font-weight:700}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#F4F3EF;color:#0C1033;font-family:Switzer,sans-serif;
  display:flex;flex-direction:column;justify-content:space-between;padding:66px 72px;overflow:hidden}
.top{display:flex;align-items:center;gap:16px}
.top svg{width:52px;height:52px}
.n{font-weight:700;font-size:30px;letter-spacing:-.035em}
.by{font-weight:400;font-size:16px;opacity:.6;margin-left:4px}
h1{font-weight:700;font-size:112px;line-height:.9;letter-spacing:-.05em;max-width:15ch}
.row{display:flex;gap:14px;align-items:flex-end;justify-content:space-between}
.strip{display:flex;gap:12px}
.strip img{width:142px;height:89px;object-fit:cover;object-position:top center;border:1px solid #D6D4CB}
.meta{font-weight:700;font-size:13px;letter-spacing:.16em;text-transform:uppercase;opacity:.55;text-align:right;line-height:1.7}
`;

const ogHtml = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<div class="top">${logo}<span class="n">northsite</span><span class="by">by visualsbyfiets</span></div>
<h1>Everything here is live.</h1>
<div class="row">
  <div class="strip">${shots.map(s => `<img src="${s}">`).join('')}</div>
  <p class="meta">${data.cleared.length} sites in stock<br>Antwerp, Belgium</p>
</div>`;

const iconHtml = `<!doctype html><meta charset="utf-8">
<style>*{margin:0}body{width:180px;height:180px;overflow:hidden}
svg{width:180px;height:180px;display:block}</style>
${fs.readFileSync('dist/assets/img/favicon.svg', 'utf8')}`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});

async function fromHtml(html, out, w, h, dsf = 1) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: out });
  console.log(`  ${out}  ${w * dsf}x${h * dsf}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  await page.close();
}

async function fromLive(out, w, h, scroll, dsf = 1) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf });
  await page.goto(LOCAL, { waitUntil: 'networkidle2' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000));
  if (scroll) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'auto' }), scroll);
    await new Promise(r => setTimeout(r, 2000));
  }
  await page.screenshot({ path: out });
  console.log(`  ${out}  ${w * dsf}x${h * dsf}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  await page.close();
}

fs.mkdirSync('submission', { recursive: true });
console.log('Rendering cards…');
await fromHtml(ogHtml, 'assets/img/og.png', 1200, 630);
await fromHtml(iconHtml, 'assets/img/apple-touch-icon.png', 180, 180);
fs.copyFileSync('assets/img/og.png', 'dist/assets/img/og.png');
fs.copyFileSync('assets/img/apple-touch-icon.png', 'dist/assets/img/apple-touch-icon.png');

console.log('Rendering Awwwards thumbnails from the live page…');
/* The shelf mid-scroll, not the bare hero: the card interaction is the idea. */
await fromLive('submission/thumb-desktop.png', 1200, 900, 640);
await fromLive('submission/thumb-mobile.png', 420, 746, 620, 2);
await browser.close();
console.log('done.');
