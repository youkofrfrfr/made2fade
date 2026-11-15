// Reads each barber's public theCut profile and updates data/shop.json with their
// current rating, review count and newest reviews. Run by .github/workflows/update-reviews.yml.
//
//   node .github/scripts/update-reviews.mjs [path/to/shop.json]
//
// Only writes the file when something changed, and prints a one-line summary per barber.

import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const FILE = process.argv[2] || 'data/shop.json';
const PER_BARBER = 5;          // newest reviews kept per barber
const PAUSE_MS = 3000;         // be gentle: one page every few seconds

// ---------- Parsing the page text ----------

// Runs inside the page. Returns { rating, count, reviews: [{ name, when, stars, text }] }.
function extract() {
  const text = document.body.innerText;
  const head = text.match(/★\s*\n\s*([0-9.]+)\s*\n\s*\((\d+)\)/);
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const start = lines.findIndex(l => /^REVIEWS\s*\(\d+\)$/i.test(l));
  if (start < 0) return { rating: head ? +head[1] : null, count: head ? +head[2] : 0, reviews: [] };
  const end = lines.findIndex((l, i) => i > start && /^(VIEW ALL REVIEWS|BOOK APPOINTMENT)$/i.test(l));
  const sec = lines.slice(start + 1, end < 0 ? undefined : end);
  const isWhen = l => /^(today|yesterday|\d+\s+(minute|hour|day|week|month|year)s?\s+ago)$/i.test(l);
  const at = sec.map((l, i) => (isWhen(l) ? i : -1)).filter(i => i >= 0);
  const reviews = at.map((d, k) => {
    let j = d + 1;
    let stars = 0;
    while (sec[j] === '★') { stars++; j++; }
    const stop = k + 1 < at.length ? at[k + 1] - 1 : sec.length;
    let body = sec.slice(j, stop);
    // Drop the next review's initials bubble (e.g. "KS") and "More" links
    if (k + 1 < at.length && /^[A-Z]{1,2}$/.test(body[body.length - 1] || '')) body = body.slice(0, -1);
    body = body.filter(x => x !== 'More');
    return { name: sec[d - 1], when: sec[d], stars, text: body.join(' ') };
  });
  return { rating: head ? +head[1] : null, count: head ? +head[2] : 0, reviews };
}

// "BOOKER T. WHEELER, II" -> "Booker W."  ·  "FLACO" -> "Flaco"
export function shortName(full) {
  // Keep initials like "LJ" or "T.J" as they are; title-case everything else
  const cap = w => (w.length <= 2 || w.includes('.')) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const words = full.replace(/,/g, ' ').split(/\s+/).filter(Boolean)
    .filter(w => !/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(w));
  if (!words.length) return 'Client';
  const first = cap(words[0]);
  const last = words.length > 1 ? words[words.length - 1].replace(/[^a-z]/gi, '') : '';
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

// Today's date at the shop (Eastern), shifted back by "3 days ago" / "2 weeks ago" etc.
export function whenToDate(when, now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now).split('-').map(Number);
  const n = parseInt(when, 10) || 1;
  const days = /today|minute|hour/i.test(when) ? 0
    : /yesterday/i.test(when) ? 1
    : /day/i.test(when) ? n
    : /week/i.test(when) ? n * 7
    : /month/i.test(when) ? n * 30
    : /year/i.test(when) ? n * 365
    : 0;
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

// Replace a barber's reviews with the fresh ones, keeping dates we already knew
// so "1 weeks ago" doesn't make an old review's date drift each run.
export function mergeReviews(existing, barberId, fresh, now) {
  const mine = existing.filter(r => r.barber === barberId);
  const others = existing.filter(r => r.barber !== barberId);
  const next = fresh.slice(0, PER_BARBER).map(r => {
    const name = shortName(r.name);
    const known = mine.find(o => o.name === name && (o.text || '') === (r.text || ''));
    const out = { name, stars: r.stars || 5, date: known ? known.date : whenToDate(r.when, now), barber: barberId };
    if (r.text) out.text = r.text.length > 240 ? r.text.slice(0, 237).trimEnd() + '…' : r.text;
    return out;
  });
  return [...others, ...next].sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- Main ----------

async function main() {
  const raw = await readFile(FILE, 'utf8');
  const shop = JSON.parse(raw);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const now = new Date();
  let failures = 0;

  for (const b of shop.barbers.filter(x => x.thecut)) {
    try {
      await page.goto(`https://app.thecut.co/barbers/${b.thecut}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // The rating shows first; the review list loads a moment later. While it loads the page
      // shows a "No reviews yet" placeholder, so only trust that text when the count is really 0.
      await page.waitForFunction(() => /★\s*\n\s*[0-9.]+\s*\n\s*\(\d+\)|No reviews yet/i.test(document.body.innerText), null, { timeout: 30000 });
      await page.waitForFunction(
        `(() => { const d = (${extract})(); return d.reviews.length > 0 || (d.count === 0 && /No reviews yet/i.test(document.body.innerText)); })()`,
        null, { timeout: 25000, polling: 500 },
      ).catch(() => {});
      const data = await page.evaluate(extract);
      const before = `${b.rating ?? '-'}/${b.reviewCount ?? 0}`;
      if (data.count) {
        b.rating = data.rating;
        b.reviewCount = data.count;
      }
      if (data.reviews.length) shop.reviews = mergeReviews(shop.reviews, b.id, data.reviews, now);
      console.log(`${b.id}: ${before} -> ${b.rating ?? '-'}/${b.reviewCount ?? 0}, ${data.reviews.length} reviews on page`);
    } catch (err) {
      failures++;
      console.warn(`${b.id}: skipped (${err.message.split('\n')[0]})`);
    }
    await page.waitForTimeout(PAUSE_MS);
  }
  await browser.close();

  const out = JSON.stringify(shop, null, 2) + '\n';
  if (out !== raw) {
    await writeFile(FILE, out);
    console.log('shop.json updated');
  } else {
    console.log('no changes');
  }
  // Fail the run only if every barber failed (e.g. theCut changed its page)
  if (failures && failures === shop.barbers.filter(x => x.thecut).length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
