import { loadShop, shopNow, shopDay, hoursFor, openStatus, formatTime, timeAgo, stars, platform, DAYS } from './shop.js';
import {
  $, $$, esc, initials, shortName, findBarber, profileUrl, initChrome, observeReveals, fillShopLinks,
  hoursListHtml, cutHtml, mixedCuts,
} from './ui.js';

initChrome();
observeReveals();

// ---------- QR code ----------

// Scanning lands on /app, which sends phones to the right app store or the barbers page.
function renderQr() {
  const box = $('#qr');
  if (!box || typeof qrcode !== 'function') return;
  const target = new URL('/app', location.origin).href;
  const qr = qrcode(0, 'M');
  qr.addData(target);
  qr.make();
  box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: `QR code: ${target}` });
  box.dataset.target = target;
}

// ---------- Data-driven sections ----------

function renderStatic(shop) {
  const rated = shop.barbers.filter(b => b.reviewCount);
  const total = rated.reduce((n, b) => n + b.reviewCount, 0);
  const avg = rated.reduce((n, b) => n + b.rating * b.reviewCount, 0) / total;
  $$('[data-team-rating]').forEach(el => { el.textContent = avg.toFixed(1); });
  $$('[data-team-count]').forEach(el => { el.textContent = total.toLocaleString('en-US'); });
  $$('[data-barber-rating]').forEach(el => { el.textContent = findBarber(shop, el.dataset.barberRating).rating.toFixed(1); });
  $$('[data-barber-count]').forEach(el => { el.textContent = findBarber(shop, el.dataset.barberCount).reviewCount; });
  fillShopLinks(shop);

  // Team preview: everyone gets the same size tile
  $('#teamStrip').innerHTML = shop.barbers.map(b => {
    const img = b.photo || b.cuts[0]?.src;
    return `<a class="strip-item" href="${profileUrl(b)}">
      <span class="strip-photo">${img ? `<img src="${img}" alt="" loading="lazy">` : initials(b.name)}</span>
      <strong>${esc(b.name)}</strong>
      <small>${b.reviewCount ? `★ ${b.rating.toFixed(1)} · ${b.reviewCount}` : 'New'}</small>
    </a>`;
  }).join('');

  // Two cuts from each barber so no one person dominates
  $('#cutGrid').innerHTML = mixedCuts(shop, 2).map(({ c, b }) => cutHtml(c, b)).join('');

  // Highlight the store button for the visitor's phone
  const p = platform();
  if (p !== 'other') $(`.store-btn[data-store="${p}"]`)?.classList.add('highlight');

  renderQr();
  observeReveals();
}

// Anything that depends on the current time. Re-run every 30 seconds.
function renderLive(shop) {
  const status = openStatus(shop);
  const dot = $('#statusDot');
  dot.classList.toggle('open', status.state === 'open');
  dot.classList.toggle('soon', status.state === 'soon');
  $('#statusText').textContent = status.label;

  const now = shopNow(shop.timezone);
  // Today's row reflects any holiday closure
  const today = shopDay(now);
  const todayHours = hoursFor(shop, today).hours;
  $('#hours').innerHTML = hoursListHtml(shop, { ...shop.hours, [DAYS[today.dow]]: todayHours });

  // Upcoming closures within the next 2 weeks
  const notes = [];
  for (let i = 0; i < 14; i++) {
    const day = shopDay(now, i);
    const info = hoursFor(shop, day);
    if (info.special) {
      const date = new Date(day.iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
      notes.push(`${date}: ${info.hours ? `${formatTime(info.hours[0])} – ${formatTime(info.hours[1])}` : 'Closed'}${info.note ? ` (${esc(info.note)})` : ''}`);
    }
  }
  $('#closures').innerHTML = notes.map(n => `<p class="closure-note">⚠ ${n}</p>`).join('');

  // Recent reviews, newest first, only for barbers shown on the site
  const reviews = shop.reviews
    .filter(r => findBarber(shop, r.barber))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  $('#reviewGrid').innerHTML = reviews.map(r => {
    const b = findBarber(shop, r.barber);
    return `<article class="review">
      <div class="avatar">${esc(initials(r.name))}</div>
      <div>
        <strong>${esc(r.name)}</strong><div class="stars">${stars(r.stars)}</div>
        ${r.text ? `<q>${esc(r.text)}</q>` : ''}
        <time datetime="${r.date}">${timeAgo(r.date, shop.timezone)} · for <a href="${profileUrl(b)}">${esc(shortName(b))}</a></time>
      </div>
    </article>`;
  }).join('');
}

// ---------- Boot ----------

let shop;
async function refresh() {
  try {
    shop = await loadShop();
    renderStatic(shop);
    renderLive(shop);
  } catch (err) {
    console.warn(err);
  }
}

await refresh();
setInterval(() => shop && renderLive(shop), 30 * 1000);
// Pick up edits to shop.json on long-open tabs
setInterval(refresh, 15 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && shop) renderLive(shop);
});
