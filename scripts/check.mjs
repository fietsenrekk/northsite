/* The gates. Exits non-zero on any failure, so the build cannot ship past it.
   Run against dist/ plus a live render, because the rendered text is what a
   visitor actually reads and that is what the rules are about. */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.NS_URL || 'http://localhost:4220/';
const EM = '\u2014';
const EN = '\u2013';

const fails = [];
const notes = [];
const ok = m => console.log('  ok    ' + m);
const bad = m => { fails.push(m); console.log('  FAIL  ' + m); };

/* ------------------------------------------------- 1. em dash, source files */
const textFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|css|js|json|xml|txt|md)$/i.test(e.name)) textFiles.push(p);
  }
})('dist');

let emHits = [];
for (const f of textFiles) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(EM)) {
    s.split('\n').forEach((l, i) => { if (l.includes(EM)) emHits.push(`${f}:${i + 1}`); });
  }
}
emHits.length ? bad(`em dash in shipped files: ${emHits.join(', ')}`)
  : ok(`no em dash in any of ${textFiles.length} shipped text files`);

/* ------------------------------------------------- 2. banned phrasing */
const BANNED = [
  'bring your vision to life', 'pixel perfect', 'pixel-perfect', 'cutting edge', 'cutting-edge',
  'seamless', "let's build something amazing", 'lets build something amazing',
  "in today's digital landscape", 'unlock your potential', 'digital experiences',
  'passionate about', 'booked solid', 'select clients only', 'state of the art',
  'best in class', 'game-changing', 'end-to-end solution', 'robust solution',
  'synergy', 'elevate your', 'leverage the', 'we leverage', 'take your business to the next level',
];
const pageSrc = fs.readFileSync('dist/index.html', 'utf8').toLowerCase();
const hits = BANNED.filter(b => pageSrc.includes(b));
hits.length ? bad(`banned phrasing on the page: ${hits.join(', ')}`)
  : ok(`none of the ${BANNED.length} banned phrases appear on the page`);

/* ------------------------------------------------- 3. every outbound link */
const html = fs.readFileSync('dist/index.html', 'utf8');
const BASE = process.env.NS_BASE || 'https://fietsenrekk.github.io/northsite/';
/* The canonical and og:url point at this site's own address. Before the first
   deploy that URL is legitimately a 404, so it is checked by the post-deploy
   verify step instead of here. */
const urls = [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
  .map(m => m[1].replace(/&amp;/g, '&'))
  .filter(u => !u.startsWith(BASE)))];
const data = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));
const shelfUrls = data.cleared.map(p => p.url);
const missing = shelfUrls.filter(u => !urls.includes(u));
if (missing.length) bad(`shelf item not linked from the page: ${missing.join(', ')}`);

const results = await Promise.all(urls.map(async u => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(25000),
        headers: { 'user-agent': 'Mozilla/5.0 (northsite link check)' } });
      if (r.ok) return { u, status: r.status };
      if (attempt) return { u, status: r.status };
    } catch (e) { if (attempt) return { u, status: 'ERR ' + e.name }; }
  }
}));
for (const r of results) {
  if (r.status === 200) ok(`200  ${r.u}`);
  else bad(`${r.status}  ${r.u}`);
}

/* ------------------------------------------------- 4. the rendered page */
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'],
});

async function render(reduced) {
  const page = await browser.newPage();
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: 1440, height: 900 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2200));
  return { page, errs };
}

/* 4a. motion on: console clean, text has no em dash, headings sane */
{
  const { page, errs } = await render(false);
  const info = await page.evaluate((em, en) => {
    const t = document.body.innerText;
    return {
      em: (t.match(new RegExp(em, 'g')) || []).length,
      en: (t.match(new RegExp(en, 'g')) || []).length,
      h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()),
      hOrder: [...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName),
      imgNoAlt: [...document.images].filter(i => !i.alt).length,
      extNoRel: [...document.querySelectorAll('a[target="_blank"]')]
        .filter(a => !/noopener/.test(a.rel)).length,
      labelled: !!document.querySelector('#bookBar').textContent.trim(),
    };
  }, EM, EN);
  info.em ? bad(`${info.em} em dash in the rendered text`) : ok('no em dash in the rendered text');
  if (info.en) notes.push(`${info.en} en dash in rendered text (not banned, noting it)`);
  info.h1.length === 1 ? ok(`exactly one h1: "${info.h1[0]}"`) : bad(`h1 count is ${info.h1.length}`);
  info.imgNoAlt ? bad(`${info.imgNoAlt} image without alt text`) : ok('every image has alt text');
  info.extNoRel ? bad(`${info.extNoRel} target=_blank link without rel=noopener`)
    : ok('every new-tab link carries rel=noopener');
  errs.length ? bad(`console/page errors: ${errs.slice(0, 3).join(' | ')}`) : ok('console clean with motion on');
  await page.close();
}

/* 4b. reduced motion: nothing may be left invisible or dimmed */
{
  const { page, errs } = await render(true);
  const hidden = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.rise, .feat__step, .card')) {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.95) out.push((el.className || '').toString().split(' ')[0] + '@' + cs.opacity);
    }
    return out;
  });
  hidden.length ? bad(`reduced motion leaves content faded: ${hidden.slice(0, 5).join(', ')}`)
    : ok('reduced motion renders every element at full opacity');
  errs.length ? bad(`reduced-motion errors: ${errs[0]}`) : ok('console clean with reduced motion');
  await page.close();
}

/* 4c. no JavaScript at all: the shelf must still be a list of working links */
{
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));
  const noJs = await page.evaluate(() => ({
    links: [...document.querySelectorAll('.shelf .open')].map(a => a.getAttribute('href')),
    visible: [...document.querySelectorAll('.card')].every(c => parseFloat(getComputedStyle(c).opacity) > 0.95),
    bookHref: document.querySelector('.sheet__fallback a').getAttribute('href'),
  }));
  noJs.links.length === data.cleared.length && noJs.links.every(Boolean)
    ? ok(`no-JS: all ${noJs.links.length} shelf links are plain anchors`)
    : bad(`no-JS: shelf links are ${JSON.stringify(noJs.links)}`);
  noJs.visible ? ok('no-JS: every card is visible') : bad('no-JS: cards are stuck at opacity 0');
  noJs.bookHref ? ok('no-JS: the booking fallback link is present') : bad('no-JS: no booking fallback');
  await page.close();
}

/* 4d. the sheet, driven by keyboard only */
{
  const { page } = await render(false);
  const kb = await page.evaluate(async () => {
    const bar = document.getElementById('bookBar');
    const sheet = document.getElementById('sheet');
    bar.focus();
    const focusedBar = document.activeElement === bar;
    bar.click();
    await new Promise(r => setTimeout(r, 500));
    const opened = sheet.classList.contains('is-open');
    const ariaOpen = bar.getAttribute('aria-expanded');
    const focusMovedIn = sheet.contains(document.activeElement);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    return {
      focusedBar, opened, ariaOpen,
      focusMovedIn,
      closed: !sheet.classList.contains('is-open'),
      ariaClosed: bar.getAttribute('aria-expanded'),
      focusReturned: document.activeElement === bar,
      modal: sheet.getAttribute('aria-modal'),
    };
  });
  kb.focusedBar ? ok('the booking bar is focusable') : bad('the booking bar cannot take focus');
  kb.opened && kb.ariaOpen === 'true' ? ok('bar opens the sheet and sets aria-expanded=true')
    : bad(`sheet did not open (opened=${kb.opened}, aria=${kb.ariaOpen})`);
  kb.focusMovedIn ? ok('focus moves into the sheet on open') : bad('focus stayed outside the sheet');
  kb.closed && kb.ariaClosed === 'false' ? ok('Escape closes the sheet') : bad('Escape did not close the sheet');
  kb.focusReturned ? ok('focus returns to the bar on close') : bad('focus was not returned to the bar');

  /* the real embed has to load, or the styled fallback has to still be there */
  const bookedOk = await (async () => {
    const p2 = await browser.newPage();
    await p2.setViewport({ width: 1440, height: 900 });
    await p2.goto(URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await p2.click('#bookBar');
    await new Promise(r => setTimeout(r, 8000));
    const r = await p2.evaluate(() => {
      const f = document.querySelector('.sheet__frame');
      const fb = document.querySelector('.sheet__fallback');
      return { frame: !!f, frameSrc: f ? f.src : null, fallbackVisible: fb ? !fb.hidden : false };
    });
    await p2.close();
    return r;
  })();
  if (bookedOk.frame && /calendly\.com/.test(bookedOk.frameSrc || '')) ok('the Calendly embed mounts inside the sheet');
  else if (bookedOk.fallbackVisible) bad('the embed did not mount; only the fallback link is present');
  else bad('the sheet has neither an embed nor a visible fallback, which is a dead panel');
  await page.close();
}

await browser.close();

console.log('');
for (const n of notes) console.log('  note  ' + n);
if (fails.length) {
  console.log(`\n${fails.length} FAILURE(S). Nothing ships.`);
  process.exit(1);
}
console.log('\nAll gates pass.');
