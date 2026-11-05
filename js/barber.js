// /barber?b=<id>: one barber's details (hours, prices, booking, cuts, reviews).
import { loadShop, timeAgo, stars } from './shop.js';
import {
  $, esc, initials, shortName, findBarber, initChrome, observeReveals, fillShopLinks,
  barberHours, barberStatus, ratingHtml, socialHtml, mediaHtml, hoursListHtml, cutHtml, priceListHtml,
} from './ui.js';

initChrome();

const id = new URLSearchParams(location.search).get('b');

function render(shop, b) {
  document.title = `${b.name} | Made2Fade Barbershop`;
  $('#pMedia').innerHTML = mediaHtml(b);
  $('#pName').textContent = b.name;
  $('#pNick').textContent = b.nickname ? `"${b.nickname}"` : '';
  $('#pTitle').textContent = b.title;
  $('#pRating').innerHTML = ratingHtml(b);
  $('#pBio').textContent = b.bio;

  const book = `<a class="btn btn-gold" href="${b.booking}" target="_blank" rel="noopener">Book on ${esc(b.bookingLabel)}</a>`;
  const alt = b.altBooking ? `<a class="btn btn-ghost" href="${b.altBooking}" target="_blank" rel="noopener">Book on ${esc(b.altBookingLabel)}</a>` : '';
  $('#pActions').innerHTML = book + alt + socialHtml(b);
  $('#pCta').innerHTML = book + alt;
  $('#pCtaTitle').textContent = `Book with ${shortName(b)}`;

  $('#pHoursNote').textContent = b.hours
    ? (b.hoursNote || '')
    : `${shortName(b)} works during shop hours. Open times can vary, so check the booking page for exact availability.`;
  $('#pPrices').innerHTML = priceListHtml(b.services);

  $('#pCutsName').textContent = `${shortName(b)}'s`;
  $('#pCuts').innerHTML = b.cuts.map(c => cutHtml(c, b)).join('');
  $('#pNoCuts').hidden = b.cuts.length > 0;

  const reviews = shop.reviews.filter(r => r.barber === b.id).sort((x, y) => y.date.localeCompare(x.date));
  $('#pReviewsSection').hidden = !reviews.length;
  $('#pReviews').innerHTML = reviews.map(r => `<article class="review">
    <div class="avatar">${esc(initials(r.name))}</div>
    <div><strong>${esc(r.name)}</strong><div class="stars">${stars(r.stars)}</div>
    ${r.text ? `<q>${esc(r.text)}</q>` : ''}
    <time datetime="${r.date}">${timeAgo(r.date, shop.timezone)}</time></div>
  </article>`).join('');

  renderLive(shop, b);
  observeReveals();
}

// Status and today's highlighted hours depend on the time
function renderLive(shop, b) {
  const status = barberStatus(shop, b);
  const dot = $('#pDot');
  dot.classList.toggle('open', status.state === 'open');
  dot.classList.toggle('soon', status.state === 'soon');
  $('#pStatus').textContent = status.label;
  $('#pHours').innerHTML = hoursListHtml(shop, barberHours(shop, b));
}

try {
  const shop = await loadShop();
  fillShopLinks(shop);
  const b = findBarber(shop, id);
  if (!b) {
    location.replace('/barbers.html');
  } else {
    render(shop, b);
    setInterval(() => renderLive(shop, b), 30 * 1000);
  }
} catch (err) {
  console.warn(err);
}
