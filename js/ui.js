// Shared page pieces: nav, scroll reveal, and HTML builders for barbers, cuts and prices.
import { shopNow, shopDay, openStatus, formatTime, DAYS } from './shop.js';

export const $ = sel => document.querySelector(sel);
export const $$ = sel => document.querySelectorAll(sel);

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
export const initials = name => name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
// Short label for tabs and buttons, e.g. "Tony", "DaeCutz", "D The Barber"
export const shortName = b => b.short || b.nickname || b.name.split(' ')[0];
export const findBarber = (shop, id) => shop.barbers.find(b => b.id === id);
export const profileUrl = b => `/barber.html?b=${encodeURIComponent(b.id)}`;
export const tel = phone => 'tel:+1' + phone.replace(/\D/g, '');

export const ICONS = {
  instagram: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  tiktok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z"/></svg>',
};

// ---------- Page chrome ----------

export function initChrome() {
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
}

const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12 });
export const observeReveals = () => $$('.reveal:not(.in)').forEach(el => io.observe(el));

// Shop-wide bits that appear in every footer
export function fillShopLinks(shop) {
  $$('[data-phone]').forEach(el => {
    el.textContent = shop.phone;
    if (el.tagName === 'A') el.href = tel(shop.phone);
  });
  $$('[data-tel]').forEach(el => { el.href = tel(shop.phone); });
  $$('[data-link]').forEach(el => {
    const url = shop.links[el.dataset.link];
    if (url) el.href = url;
  });
  const year = $('#year');
  if (year) year.textContent = shopNow(shop.timezone).y;
}

// ---------- Barbers ----------

export const barberHours = (shop, b) => b.hours || shop.hours;

export function barberStatus(shop, b) {
  const status = openStatus({ ...shop, hours: barberHours(shop, b) });
  // Only barbers with their own published hours get a personal "in the shop" status
  if (!b.hours) return { ...status, label: 'Shop ' + status.label.replace('Open now', 'open').replace(/^C/, 'c') };
  return { ...status, label: status.label.replace('Open now', 'In the shop now') };
}

export function ratingHtml(b) {
  return b.reviewCount
    ? `<span class="team-rating"><b>★ ${b.rating.toFixed(1)}</b> (${b.reviewCount} reviews)</span>`
    : '<span class="team-rating new">New on theCut</span>';
}

export function socialHtml(b) {
  return Object.entries(b.social || {}).map(([k, url]) =>
    `<a class="icon-link" href="${url}" target="_blank" rel="noopener" aria-label="${esc(b.name)} on ${k}">${ICONS[k] || ''}</a>`).join('');
}

export function mediaHtml(b) {
  const img = b.photo || b.cuts[0]?.src;
  return img
    ? `<img src="${img}" alt="${esc(b.name)}" loading="lazy">`
    : `<div class="team-initials">${initials(b.name)}</div>`;
}

export function barberCard(shop, b) {
  const status = barberStatus(shop, b);
  return `<article class="team-card reveal">
    <a class="team-media" href="${profileUrl(b)}" aria-label="${esc(b.name)} details">${mediaHtml(b)}</a>
    <div class="team-body">
      <h3>${esc(b.name)}</h3>
      ${b.nickname ? `<div class="team-nick">"${esc(b.nickname)}"</div>` : ''}
      <div class="team-title">${esc(b.title)}</div>
      ${ratingHtml(b)}
      <div class="barber-status"><i class="status-dot ${status.state}" data-status-dot="${b.id}"></i><b data-status-text="${b.id}">${esc(status.label)}</b></div>
      <p>${esc(b.bio)}</p>
      <div class="team-actions">
        <a class="btn btn-gold btn-sm" href="${profileUrl(b)}">Details</a>
        <a class="btn btn-ghost btn-sm" href="${b.booking}" target="_blank" rel="noopener">Book</a>
        ${socialHtml(b)}
      </div>
    </div>
  </article>`;
}

// Refresh the live status line on any barber cards on the page
export function updateStatuses(shop) {
  shop.barbers.forEach(b => {
    const dot = $(`[data-status-dot="${b.id}"]`);
    if (!dot) return;
    const status = barberStatus(shop, b);
    dot.classList.toggle('open', status.state === 'open');
    dot.classList.toggle('soon', status.state === 'soon');
    $(`[data-status-text="${b.id}"]`).textContent = status.label;
  });
}

// Weekly hours list, Monday first, with today highlighted
export function hoursListHtml(shop, hours) {
  const today = shopDay(shopNow(shop.timezone)).dow;
  return [1, 2, 3, 4, 5, 6, 0].map(dow => {
    const h = hours[DAYS[dow]];
    const name = DAYS[dow][0].toUpperCase() + DAYS[dow].slice(1);
    return `<li class="${dow === today ? 'today' : ''}"><span>${name}</span><span>${h ? `${formatTime(h[0])} – ${formatTime(h[1])}` : 'Closed'}</span></li>`;
  }).join('');
}

// ---------- Cuts ----------

export function cutHtml(c, b) {
  return `<figure class="cut">
    <img src="${c.src}" alt="${esc(c.alt || `Haircut by ${b.name}`)}" loading="lazy">
    <figcaption><strong>${esc(b.name)}</strong><span>${esc(c.alt || 'Made2Fade')}</span></figcaption>
  </figure>`;
}

// An even mix: up to `each` cuts per barber, interleaved so nobody dominates
export function mixedCuts(shop, each) {
  const lists = shop.barbers.filter(b => b.cuts.length).map(b => b.cuts.slice(0, each).map(c => ({ c, b })));
  const mixed = [];
  for (let i = 0; i < each; i++) lists.forEach(l => l[i] && mixed.push(l[i]));
  return mixed;
}

// ---------- Prices ----------

export function priceListHtml(services) {
  return services.map(s => {
    const time = s.minutes >= 60
      ? `${+(s.minutes / 60).toFixed(1)} hr${s.minutes > 60 ? 's' : ''}`
      : `${s.minutes} min`;
    return `<li>
      <div class="price-row"><span class="name">${esc(s.name)}</span><span class="dots"></span><span class="price">$${s.price}</span></div>
      <div class="price-meta">${time}${s.note ? ' · ' + esc(s.note) : ''}</div>
    </li>`;
  }).join('');
}
