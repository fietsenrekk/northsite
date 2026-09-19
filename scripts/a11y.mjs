/* axe-core against the real page, in three states: at rest, with the booking
   sheet open, and at phone width. A violation in any state is a violation. */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const axeSrc = fs.readFileSync(axePath, 'utf8');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.NS_URL || 'http://localhost:4220/';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'],
});

async function run(label, { width, height, openSheet }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000));
  if (openSheet) {
    await page.click('#bookBar');
    await new Promise(r => setTimeout(r, 2500));
  }
  await page.evaluate(axeSrc);
  const res = await page.evaluate(async () => await window.axe.run(document, {
    resultTypes: ['violations'],
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  }));
  const v = res.violations.filter(x => x.impact !== null);
  console.log(`${label.padEnd(28)} violations: ${v.length}`);
  for (const x of v) {
    console.log(`  [${x.impact}] ${x.id}: ${x.help}`);
    for (const n of x.nodes.slice(0, 3)) console.log(`      ${n.target.join(' ')}`);
  }
  await page.close();
  return v.length;
}

let total = 0;
total += await run('desktop 1440, at rest', { width: 1440, height: 900 });
total += await run('desktop 1440, sheet open', { width: 1440, height: 900, openSheet: true });
total += await run('phone 390, at rest', { width: 390, height: 844 });
total += await run('phone 390, sheet open', { width: 390, height: 844, openSheet: true });
await browser.close();

console.log(total === 0 ? '\naxe: 0 violations across all four states.' : `\naxe: ${total} violation(s).`);
process.exitCode = total === 0 ? 0 : 1;
