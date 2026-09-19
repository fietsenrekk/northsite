import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const data = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));
const only = process.argv[2];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});

async function shoot({ id, url, shot, out, dsf = 2 }) {
  const page = await browser.newPage();
  await page.setViewport({ width: shot.vw, height: shot.vh, deviceScaleFactor: dsf });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (e) {
    console.log(`  ! ${id} nav: ${e.message.slice(0, 70)}`);
  }
  await new Promise(r => setTimeout(r, shot.wait ?? 3000));
  if (shot.scroll) {
    await page.evaluate(y => {
      window.scrollTo({ top: y, behavior: 'auto' });
      document.documentElement.scrollTop = y;
      document.body.scrollTop = y;
    }, shot.scroll);
    await new Promise(r => setTimeout(r, 2200));
  }
  // kill anything that would date the shot or leak a cookie banner into the frame
  await page.evaluate(() => {
    for (const s of ['[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]', '[class*="preloader"]', '[class*="loader"]']) {
      document.querySelectorAll(s).forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && parseFloat(cs.opacity) > 0.02) el.remove();
      });
    }
  });
  await page.screenshot({ path: out, type: 'png' });
  const px = await page.evaluate(() => [innerWidth, innerHeight, Math.round(scrollY)]);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`  ok ${id.padEnd(16)} ${px[0]}x${px[1]} @${dsf}x  scrollY=${px[2]}  ${kb} KB${errs.length ? '  jsErr:' + errs.length : ''}`);
  await page.close();
}

fs.mkdirSync('assets/shots', { recursive: true });
console.log('Capturing shelf screenshots…');
for (const p of data.cleared) {
  if (only && p.id !== only) continue;
  await shoot({ id: p.id, url: p.shotUrl || p.url, shot: p.shot, out: `assets/shots/${p.id}.png` });
}
// logo proof sheet
const lp = pathToFileURL('assets/img/_preview.html').href;
await shoot({ id: 'logo-proof', url: lp, shot: { vw: 560, vh: 340, wait: 600 }, out: 'assets/img/_logo-proof.png', dsf: 2 });
await browser.close();
console.log('done.');
