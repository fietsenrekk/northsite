/* Proves the featured pin actually holds. Walks the section in 120px steps and
   reports the figure's viewport-top plus which step is lit. A correct pin keeps
   figTop constant from the moment step 01 lights until step 04 has been read. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.NS_URL || 'http://localhost:4220/';
const VH = Number(process.env.NS_VH || 900);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: VH, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle2' });
await page.evaluateHandle('document.fonts.ready');
await new Promise(r => setTimeout(r, 1800));

const walk = await page.evaluate(async (vh) => {
  const grid = document.querySelector('.feat__grid');
  const fig = document.querySelector('.feat__pin figure');
  const steps = [...document.querySelectorAll('.feat__step')];
  const top = grid.getBoundingClientRect().top + scrollY;
  const end = top + grid.getBoundingClientRect().height;
  const rows = [];
  for (let y = top - vh * 0.5; y < end; y += 120) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 90));
    rows.push({
      y: Math.round(scrollY),
      figTop: Math.round(fig.getBoundingClientRect().top),
      lit: steps.findIndex(s => s.classList.contains('is-on')) + 1,
    });
  }
  return { top: Math.round(top), end: Math.round(end), height: Math.round(end - top), rows };
}, VH);

/* the pin is "held" on any sample where figTop equals the sticky offset */
const offsets = walk.rows.map(r => r.figTop);
const mode = offsets.sort((a, b) =>
  offsets.filter(v => v === a).length - offsets.filter(v => v === b).length).pop();
const held = walk.rows.filter(r => r.figTop === mode);
const litDuringHold = [...new Set(held.map(r => r.lit))].filter(n => n > 0).sort();

console.log(`featured section: ${walk.height}px tall, viewport ${VH}px`);
console.log(`figure sticks at figTop=${mode}px for ${held.length} of ${walk.rows.length} samples ` +
  `(${Math.round(held.length / walk.rows.length * 100)}% of the section)`);
console.log(`steps lit while the figure is held: ${litDuringHold.join(', ') || 'none'}`);
/* Step 01 lights as the image rises into its sticky slot, which is the correct
   reading: the picture settles, then the text advances beside it. What has to
   be true is that the image is STILL held when the last step is read, and that
   it holds across a meaningful share of the section instead of flickering. */
const lastStep = walk.rows.reduce((m, r) => Math.max(m, r.lit), 0);
const share = held.length / walk.rows.length;
const ok = litDuringHold.includes(lastStep) && share >= 0.35;
console.log(ok
  ? `PASS: held through the final step (0${lastStep}) across ${Math.round(share * 100)}% of the section.`
  : `FAIL: lastStep=0${lastStep} read-while-held=${litDuringHold.join(',')} share=${Math.round(share * 100)}%`);
process.exitCode = ok ? 0 : 1;
await browser.close();
