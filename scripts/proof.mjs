/* Interaction proof shots. Hovering a card, the booking sheet open, and the
   featured pin mid-hold. These double as the Awwwards element submissions. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.NS_URL || 'http://localhost:4220/';
const OUT = 'docs/proof';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});

async function page(w = 1440, h = 900, dsf = 2) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dsf });
  await p.goto(URL, { waitUntil: 'networkidle2' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2200));
  return p;
}

/* 1. the hover cursor over a shelf card */
{
  const p = await page();
  await p.evaluate(() => document.querySelector('.shelf').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 1600));
  const box = await p.$eval('.shelf .card:nth-child(2) .card__media', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width * 0.5, y: r.y + r.height * 0.5 };
  });
  /* two moves: the first arms the ghost, the second lets it catch up */
  await p.mouse.move(box.x - 60, box.y - 40);
  await new Promise(r => setTimeout(r, 260));
  await p.mouse.move(box.x, box.y);
  await new Promise(r => setTimeout(r, 900));
  const ghost = await p.evaluate(() => {
    const g = document.getElementById('ghost');
    return { on: g.classList.contains('is-on'), opacity: getComputedStyle(g).opacity, text: g.innerText.trim() };
  });
  await p.screenshot({ path: `${OUT}/hover-card.png` });
  console.log(`hover-card.png    ghost on=${ghost.on} opacity=${ghost.opacity} text="${ghost.text}"`);
  await p.close();
}

/* 2. the booking sheet, open, with the real embed */
{
  const p = await page();
  await p.click('#bookBar');
  await new Promise(r => setTimeout(r, 6000));
  const state = await p.evaluate(() => {
    const f = document.querySelector('.sheet__frame');
    return { open: document.getElementById('sheet').classList.contains('is-open'), frame: !!f, src: f ? f.src.slice(0, 52) : null };
  });
  await p.screenshot({ path: `${OUT}/sheet-open.png` });
  console.log(`sheet-open.png    open=${state.open} embed=${state.frame} src=${state.src}`);
  await p.close();
}

/* 3. the featured pin, mid-hold, with a later step lit */
{
  const p = await page();
  const y = await p.evaluate(() => {
    const g = document.querySelector('.feat__grid');
    return g.getBoundingClientRect().top + scrollY;
  });
  await p.evaluate(t => window.scrollTo(0, t), y + 900);
  await new Promise(r => setTimeout(r, 1800));
  const lit = await p.evaluate(() => {
    const s = [...document.querySelectorAll('.feat__step')];
    return s.findIndex(x => x.classList.contains('is-on')) + 1;
  });
  await p.screenshot({ path: `${OUT}/featured-pin.png` });
  console.log(`featured-pin.png  step lit = 0${lit}`);
  await p.close();
}

await browser.close();
