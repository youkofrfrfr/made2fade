import { loadShop, shopNow, shopDay, hoursFor, openStatus, formatTime, timeAgo, stars, platform, DAYS } from './shop.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// ---------- Page chrome ----------

const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const menuBtn = $('#menuBtn');
const links = $('#navLinks');
menuBtn.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  nav.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  nav.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', false);
}));

const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12 });
const observeReveals = () => $$('.reveal:not(.in)').forEach(el => io.observe(el));
observeReveals();

// ---------- QR code ----------

// Scanning lands on /app, which sends phones to the right app store or the booking page.
// On a local preview a phone can't reach the page, so point straight at booking instead.
function renderQr(shop) {
  const box = $('#qr');
  if (!box || typeof qrcode !== 'function') return;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const target = local ? shop.links.booking : new URL('/app', location.origin).href;
  const qr = qrcode(0, 'M');
  qr.addData(target);
  qr.make();
  box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: `QR code: ${target}` });
  box.dataset.target = target;
}

// ---------- Data-driven sections ----------

function renderStatic(shop) {
  $$('[data-rating]').forEach(el => { el.textContent = shop.rating.toFixed(1); });
  $$('[data-review-count]').forEach(el => { el.textContent = shop.reviewCount.toLocaleString('en-US'); });
  $$('[data-stars]').forEach(el => { el.textContent = stars(shop.rating); });
  $$('[data-phone]').forEach(el => {
    el.textContent = shop.phone;
    if (el.tagName === 'A') el.href = 'tel:+1' + shop.phone.replace(/\D/g, '');
  });
  $$('[data-tel]').forEach(el => { el.href = 'tel:+1' + shop.phone.replace(/\D/g, ''); });
  $$('[data-link]').forEach(el => {
    const url = shop.links[el.dataset.link];
    if (url) el.href = url;
  });

  $$('[data-barber-link]').forEach(el => {
    const b = barber(shop, el.dataset.barberLink);
    if (b?.booking) el.href = b.booking;
  });

  const selected = $('#priceTabs [aria-selected="true"]')?.dataset.barber || 'tony';
  renderPrices(shop, selected);

  // Highlight the store button for the visitor's phone
  const p = platform();
  if (p !== 'other') $(`.store-btn[data-store="${p}"]`)?.classList.add('highlight');

  renderQr(shop);
}

const barber = (shop, id) => (shop.barbers || []).find(b => b.id === id);

// Tony's services live at the top level of shop.json; other barbers under "barbers".
function renderPrices(shop, id) {
  const list = $('#priceList');
  const services = id === 'tony' ? shop.services : barber(shop, id)?.services;
  if (!list || !services?.length) return;
  list.innerHTML = services.map(s => {
    const time = s.minutes >= 60 ? `${s.minutes / 60} hr${s.minutes >= 120 ? 's' : ''}` : `${s.minutes} min`;
    return `<li>
      <div class="price-row"><span class="name">${esc(s.name)}</span><span class="dots"></span><span class="price">$${s.price}</span></div>
      <div class="price-meta">${time}${s.note ? ' · ' + esc(s.note) : ''}</div>
    </li>`;
  }).join('');
}

$$('#priceTabs button').forEach(btn => btn.addEventListener('click', () => {
  $$('#priceTabs button').forEach(b => b.setAttribute('aria-selected', b === btn));
  if (shop) renderPrices(shop, btn.dataset.barber);
}));

function renderBarber(shop, id) {
  const b = barber(shop, id);
  if (!b) return;
  const status = openStatus({ ...shop, hours: b.hours });
  const dot = $(`#${id}Dot`);
  dot.classList.toggle('open', status.state === 'open');
  dot.classList.toggle('soon', status.state === 'soon');
  $(`#${id}Status`).textContent = status.label.replace('Open now', 'In the shop now');

  const todayDow = shopDay(shopNow(shop.timezone)).dow;
  $(`#${id}Hours`).innerHTML = [1, 2, 3, 4, 5, 6, 0].map(dow => {
    const h = b.hours[DAYS[dow]];
    const name = DAYS[dow].slice(0, 3);
    // Compact form for the small day tiles, e.g. "8:30a–6p"
    const short = t => formatTime(t).replace(':00', '').replace(' AM', 'a').replace(' PM', 'p');
    return `<li class="${h ? '' : 'off'} ${dow === todayDow ? 'today' : ''}"><span>${name[0].toUpperCase() + name.slice(1)}</span><span>${h ? `${short(h[0])}–${short(h[1])}` : 'Off'}</span></li>`;
  }).join('');
  $(`#${id}Note`).textContent = b.hoursNote || '';
}

// Anything that depends on the current time. Re-run every 30 seconds.
function renderLive(shop) {
  const status = openStatus(shop);
  const dot = $('#statusDot');
  dot.classList.toggle('open', status.state === 'open');
  dot.classList.toggle('soon', status.state === 'soon');
  $('#statusText').textContent = status.label;

  const now = shopNow(shop.timezone);
  const today = shopDay(now);
  const order = [1, 2, 3, 4, 5, 6, 0];
  $('#hours').innerHTML = order.map(dow => {
    const regular = shop.hours[DAYS[dow]];
    const isToday = dow === today.dow;
    // Today's row reflects any holiday closure; other rows show regular hours
    const h = isToday ? hoursFor(shop, today).hours : regular;
    const label = h ? `${formatTime(h[0])} – ${formatTime(h[1])}` : 'Closed';
    const name = DAYS[dow][0].toUpperCase() + DAYS[dow].slice(1);
    return `<li class="${isToday ? 'today' : ''}"><span>${name}</span><span>${label}</span></li>`;
  }).join('');

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

  const grid = $('#reviewGrid');
  if (grid && shop.reviews?.length) {
    grid.innerHTML = shop.reviews.map(r => {
      const initials = r.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      return `<article class="review">
        <div class="avatar">${esc(initials)}</div>
        <div><strong>${esc(r.name)}</strong><div class="stars">${stars(r.stars)}</div><time datetime="${r.date}">${timeAgo(r.date, shop.timezone)}</time></div>
      </article>`;
    }).join('');
  }

  renderBarber(shop, 'endless');

  $('#year').textContent = now.y;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
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
