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

// ---------- Helpers ----------

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
const initials = name => name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
// Short label for tabs and buttons, e.g. "Tony", "DaeCutz", "D The Barber"
const firstName = b => b.short || b.nickname || b.name.split(' ')[0];
const barber = (shop, id) => shop.barbers.find(b => b.id === id);
const tel = phone => 'tel:+1' + phone.replace(/\D/g, '');

const ICONS = {
  instagram: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  tiktok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z"/></svg>',
};

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

// ---------- Team ----------

function renderTeam(shop) {
  const grid = $('#teamGrid');
  // Tony has the owner section above, so the grid shows everyone else
  grid.innerHTML = shop.barbers.filter(b => b.id !== 'tony').map(b => {
    const img = b.photo || b.cuts[0]?.src;
    const media = img
      ? `<img src="${img}" alt="${esc(b.name)}" loading="lazy">`
      : `<div class="team-initials">${initials(b.name)}</div>`;
    const rating = b.reviewCount
      ? `<span class="team-rating"><b>★ ${b.rating.toFixed(1)}</b> (${b.reviewCount})</span>`
      : '<span class="team-rating new">New on theCut</span>';
    const social = Object.entries(b.social || {}).map(([k, url]) =>
      `<a class="icon-link" href="${url}" target="_blank" rel="noopener" aria-label="${esc(b.name)} on ${k}">${ICONS[k] || ''}</a>`).join('');
    const hours = b.hours ? `
      <div class="barber-status"><i class="status-dot" data-status-dot="${b.id}"></i><b data-status-text="${b.id}"></b></div>
      <ul class="mini-hours" data-hours="${b.id}"></ul>
      ${b.hoursNote ? `<p class="hours-note">${esc(b.hoursNote)}</p>` : ''}` : '';
    return `<article class="team-card reveal">
      <div class="team-media">${media}</div>
      <div class="team-body">
        <h3>${esc(b.name)}</h3>
        ${b.nickname ? `<div class="team-nick">"${esc(b.nickname)}"</div>` : ''}
        <div class="team-title">${esc(b.title)}</div>
        ${rating}
        <p>${esc(b.bio)}</p>
        ${hours}
        <div class="team-actions">
          <a class="btn btn-gold btn-sm" href="${b.booking}" target="_blank" rel="noopener">Book on ${esc(b.bookingLabel)}</a>
          ${b.altBooking ? `<a class="btn btn-ghost btn-sm" href="${b.altBooking}" target="_blank" rel="noopener">${esc(b.altBookingLabel)}</a>` : ''}
          ${b.cuts.length ? `<a class="btn btn-ghost btn-sm" href="#cuts" data-show-cuts="${b.id}">See Cuts</a>` : ''}
          ${social}
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('[data-show-cuts]').forEach(a => a.addEventListener('click', () => selectCuts(a.dataset.showCuts)));
}

// Live status + day tiles for barbers who publish weekly hours
function renderBarberHours(shop) {
  const todayDow = shopDay(shopNow(shop.timezone)).dow;
  shop.barbers.filter(b => b.hours).forEach(b => {
    const status = openStatus({ ...shop, hours: b.hours });
    const dot = $(`[data-status-dot="${b.id}"]`);
    if (!dot) return;
    dot.classList.toggle('open', status.state === 'open');
    dot.classList.toggle('soon', status.state === 'soon');
    $(`[data-status-text="${b.id}"]`).textContent = status.label.replace('Open now', 'In the shop now');

    // Compact form for the small day tiles, e.g. "8:30a–6p"
    const short = t => formatTime(t).replace(':00', '').replace(' AM', 'a').replace(' PM', 'p');
    $(`[data-hours="${b.id}"]`).innerHTML = [1, 2, 3, 4, 5, 6, 0].map(dow => {
      const h = b.hours[DAYS[dow]];
      const name = DAYS[dow][0].toUpperCase() + DAYS[dow].slice(1, 3);
      return `<li class="${h ? '' : 'off'} ${dow === todayDow ? 'today' : ''}"><span>${name}</span><span>${h ? `${short(h[0])}–${short(h[1])}` : 'Off'}</span></li>`;
    }).join('');
  });
}

// ---------- Cuts gallery ----------

const CUTS_PAGE = 12;
let cutFilter = 'all';
let cutLimit = CUTS_PAGE;

function allCuts(shop) {
  // Interleave barbers so "All" shows a mix instead of one barber's whole set first
  const lists = shop.barbers.filter(b => b.cuts.length).map(b => b.cuts.map(c => ({ ...c, barber: b })));
  const mixed = [];
  for (let i = 0; lists.some(l => i < l.length); i++) lists.forEach(l => l[i] && mixed.push(l[i]));
  return mixed;
}

function renderCuts(shop) {
  const withCuts = shop.barbers.filter(b => b.cuts.length);
  $('#cutTabs').innerHTML = [`<button role="tab" data-cuts="all" aria-selected="${cutFilter === 'all'}">All</button>`]
    .concat(withCuts.map(b => `<button role="tab" data-cuts="${b.id}" aria-selected="${cutFilter === b.id}">${esc(firstName(b))}</button>`))
    .join('');
  $$('#cutTabs button').forEach(btn => btn.addEventListener('click', () => selectCuts(btn.dataset.cuts)));

  const cuts = cutFilter === 'all' ? allCuts(shop) : barber(shop, cutFilter).cuts.map(c => ({ ...c, barber: barber(shop, cutFilter) }));
  $('#cutGrid').innerHTML = cuts.slice(0, cutLimit).map(c => `
    <figure class="cut">
      <img src="${c.src}" alt="${esc(c.alt || `Haircut by ${c.barber.name}`)}" loading="lazy">
      <figcaption><strong>${esc(c.barber.name)}</strong><span>${esc(c.alt || 'Made2Fade')}</span></figcaption>
    </figure>`).join('');
  const more = $('#moreCuts');
  more.hidden = cuts.length <= cutLimit;
}

function selectCuts(id) {
  cutFilter = id;
  cutLimit = CUTS_PAGE;
  if (shop) renderCuts(shop);
}

$('#moreCuts').addEventListener('click', () => {
  cutLimit += CUTS_PAGE;
  if (shop) renderCuts(shop);
});

// ---------- Prices ----------

let priceFilter = 'tony';

function renderPrices(shop) {
  $('#priceTabs').innerHTML = shop.barbers.map(b =>
    `<button role="tab" data-barber="${b.id}" aria-selected="${priceFilter === b.id}">${esc(firstName(b))}</button>`).join('');
  $$('#priceTabs button').forEach(btn => btn.addEventListener('click', () => selectPrices(btn.dataset.barber)));

  const b = barber(shop, priceFilter);
  $('#priceList').innerHTML = b.services.map(s => {
    const time = s.minutes >= 60
      ? `${+(s.minutes / 60).toFixed(1)} hr${s.minutes > 60 ? 's' : ''}`
      : `${s.minutes} min`;
    return `<li>
      <div class="price-row"><span class="name">${esc(s.name)}</span><span class="dots"></span><span class="price">$${s.price}</span></div>
      <div class="price-meta">${time}${s.note ? ' · ' + esc(s.note) : ''}</div>
    </li>`;
  }).join('');
  const book = $('#priceBook');
  book.href = b.booking;
  book.textContent = `Book with ${firstName(b)}`;
}

function selectPrices(id) {
  priceFilter = id;
  if (shop) renderPrices(shop);
}

// ---------- Data-driven sections ----------

function renderStatic(shop) {
  const rated = shop.barbers.filter(b => b.reviewCount);
  const total = rated.reduce((n, b) => n + b.reviewCount, 0);
  const avg = rated.reduce((n, b) => n + b.rating * b.reviewCount, 0) / total;
  $$('[data-team-rating]').forEach(el => { el.textContent = avg.toFixed(1); });
  $$('[data-team-count]').forEach(el => { el.textContent = total.toLocaleString('en-US'); });
  $$('[data-barber-rating]').forEach(el => { el.textContent = barber(shop, el.dataset.barberRating).rating.toFixed(1); });
  $$('[data-barber-count]').forEach(el => { el.textContent = barber(shop, el.dataset.barberCount).reviewCount; });

  $$('[data-phone]').forEach(el => {
    el.textContent = shop.phone;
    if (el.tagName === 'A') el.href = tel(shop.phone);
  });
  $$('[data-tel]').forEach(el => { el.href = tel(shop.phone); });
  $$('[data-link]').forEach(el => {
    const url = shop.links[el.dataset.link];
    if (url) el.href = url;
  });

  // Highlight the store button for the visitor's phone
  const p = platform();
  if (p !== 'other') $(`.store-btn[data-store="${p}"]`)?.classList.add('highlight');

  renderTeam(shop);
  renderCuts(shop);
  renderPrices(shop);
  renderQr(shop);
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

  const reviews = [...shop.reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  $('#reviewGrid').innerHTML = reviews.map(r => {
    const b = barber(shop, r.barber);
    return `<article class="review">
      <div class="avatar">${esc(initials(r.name))}</div>
      <div>
        <strong>${esc(r.name)}</strong><div class="stars">${stars(r.stars)}</div>
        ${r.text ? `<q>${esc(r.text)}</q>` : ''}
        <time datetime="${r.date}">${timeAgo(r.date, shop.timezone)}${b ? ` · for ${esc(firstName(b))}` : ''}</time>
      </div>
    </article>`;
  }).join('');

  renderBarberHours(shop);

  $('#year').textContent = now.y;
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
