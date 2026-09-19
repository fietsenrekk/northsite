/* Layout QA. Captures the live page at every breakpoint in the budget.
   Reduced motion is emulated so every revealed element is in its final state,
   which is the only way a full-page capture tells the truth about layout. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.NS_URL || 'http://localhost:4220/';
const OUT = process.env.NS_OUT || 'docs/qa';
const WIDTHS = (process.env.NS_W || '360,390,430,768,1024,1280,1440,1920,2560,3440').split(',').map(Number);

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});

const rows = [];
for (const w of WIDTHS) {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 140)); });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 900));

  const m = await page.evaluate(() => {
    const de = document.documentElement;
    /* anything wider than the viewport is a horizontal-scroll bug */
    const over = [...document.querySelectorAll('body *')].filter(el => { if (el.classList.contains('skip')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > de.clientWidth + 1.5 || r.left < -1.5);
    }).slice(0, 6).map(el => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
    const gut = el => { const r = el.getBoundingClientRect(); return Math.round(Math.min(r.left, de.clientWidth - r.right)); };
    const h1 = document.querySelector('.hero h1');
    return {
      scrollW: de.scrollWidth, clientW: de.clientWidth, docH: de.scrollHeight,
      hScroll: de.scrollWidth > de.clientWidth + 1,
      over, gutter: gut(h1),
      h1px: parseFloat(getComputedStyle(h1).fontSize).toFixed(0),
      shelfCols: new Set([...document.querySelectorAll('.card')].map(c => Math.round(c.getBoundingClientRect().left))).size,
      cardW: Math.round(document.querySelector('.card').getBoundingClientRect().width),
      barH: Math.round(document.querySelector('.bar').getBoundingClientRect().height),
    };
  });
  // walk the page so every lazy image is decoded before the full-page capture
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; })));
    await new Promise(r => setTimeout(r, 300));
  });
  await page.screenshot({ path: `${OUT}/${w}.png`, fullPage: true });
  await page.close();
  rows.push({ w, ...m, errs: errs.length });
  const flag = m.hScroll ? '  H-SCROLL' : (m.gutter < 16 ? '  GUTTER<16' : '');
  console.log(`${String(w).padStart(5)}  doc ${String(m.docH).padStart(5)}  cols ${m.shelfCols}  card ${String(m.cardW).padStart(4)}  h1 ${m.h1px}px  gutter ${String(m.gutter).padStart(3)}  err ${errs.length}${flag}`);
  if (m.over.length) console.log(`        overflowing: ${m.over.join(', ')}`);
  if (errs.length) console.log(`        ${errs.slice(0, 2).join(' | ')}`);
}
await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(rows, null, 2));
