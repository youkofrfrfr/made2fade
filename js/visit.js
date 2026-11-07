// /visit: shop hours (live), holiday notices, contact and map.
import { loadShop, shopNow, shopDay, hoursFor, openStatus, formatTime, DAYS } from './shop.js';
import { $, esc, fillShopLinks, hoursListHtml } from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

function renderLive(shop) {
  const status = openStatus(shop);
  const dot = $('#statusDot');
  dot.classList.toggle('open', status.state === 'open');
  dot.classList.toggle('soon', status.state === 'soon');
  $('#statusText').textContent = status.label;

  // Today's row reflects any holiday closure
  const now = shopNow(shop.timezone);
  const today = shopDay(now);
  $('#hours').innerHTML = hoursListHtml(shop, { ...shop.hours, [DAYS[today.dow]]: hoursFor(shop, today).hours });

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
}

try {
  const shop = await loadShop();
  fillShopLinks(shop);
  renderLive(shop);
  setInterval(() => renderLive(shop), 30 * 1000);
} catch (err) {
  console.warn(err);
}
