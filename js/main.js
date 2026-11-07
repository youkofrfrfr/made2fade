// Home page: hero status, team strip, a few mixed cuts and quick links.
import { loadShop, shopNow, shopDay, hoursFor, openStatus, formatTime } from './shop.js';
import { $, $$, esc, initials, profileUrl, observeReveals, fillShopLinks, cutHtml, mixedCuts } from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

function renderStatic(shop) {
  const rated = shop.barbers.filter(b => b.reviewCount);
  const total = rated.reduce((n, b) => n + b.reviewCount, 0);
  const avg = rated.reduce((n, b) => n + b.rating * b.reviewCount, 0) / total;
  $$('[data-team-rating]').forEach(el => { el.textContent = avg.toFixed(1); });
  $$('[data-team-count]').forEach(el => { el.textContent = total.toLocaleString('en-US'); });
  fillShopLinks(shop);

  // Everyone gets the same size tile
  $('#teamStrip').innerHTML = shop.barbers.map(b => `
    <a class="strip-item" href="${profileUrl(b)}">
      <span class="strip-photo">${b.photo ? `<img src="${b.photo}" alt="" loading="lazy">` : initials(b.name)}</span>
      <strong>${esc(b.name)}</strong>
      <small>${b.reviewCount ? `★ ${b.rating.toFixed(1)} · ${b.reviewCount}` : 'New'}</small>
    </a>`).join('');

  // One cut from each barber so no one person stands out
  $('#cutGrid').innerHTML = mixedCuts(shop, 1).map(({ c, b }) => cutHtml(c, b)).join('');
  observeReveals();
}

function renderLive(shop) {
  const status = openStatus(shop);
  const dot = $('#statusDot');
  dot.classList.toggle('open', status.state === 'open');
  dot.classList.toggle('soon', status.state === 'soon');
  $('#statusText').textContent = status.label;

  const today = hoursFor(shop, shopDay(shopNow(shop.timezone))).hours;
  $('#todayHours').textContent = today ? `Today ${formatTime(today[0])} – ${formatTime(today[1])}` : 'Closed today';
}

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
setInterval(refresh, 15 * 60 * 1000);
