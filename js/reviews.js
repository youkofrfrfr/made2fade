// /reviews: team rating, each barber's rating, and the latest reviews.
import { loadShop, timeAgo, stars } from './shop.js';
import { $, $$, esc, initials, shortName, findBarber, profileUrl, fillShopLinks } from './ui.js';
import { mountLayout } from './layout.js';
import { watchLiveReviews } from './live-reviews.js';

mountLayout();

function render(shop) {
  const rated = shop.barbers.filter(b => b.reviewCount);
  const total = rated.reduce((n, b) => n + b.reviewCount, 0);
  const avg = rated.reduce((n, b) => n + b.rating * b.reviewCount, 0) / total;
  $$('[data-team-rating]').forEach(el => { el.textContent = avg.toFixed(1); });
  $$('[data-team-count]').forEach(el => { el.textContent = total.toLocaleString('en-US'); });

  $('#ratingList').innerHTML = shop.barbers.map(b => `
    <a class="rating-row" href="${profileUrl(b)}">
      <span class="rr-photo">${b.photo ? `<img src="${b.photo}" alt="" loading="lazy">` : initials(b.name)}</span>
      <span class="rr-name">${esc(b.name)}</span>
      <span class="rr-score">${b.reviewCount ? `★ ${b.rating.toFixed(1)} <small>(${b.reviewCount})</small>` : '<small>New</small>'}</span>
    </a>`).join('');

  const reviews = shop.reviews
    .filter(r => findBarber(shop, r.barber))
    .sort((a, b) => b.date.localeCompare(a.date));
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

// Live Google reviews (only shows once the API key is set up on Vercel)
function renderGoogle(g) {
  $('#googleSection').hidden = false;
  $('#googleRating').textContent = g.rating.toFixed(1);
  $('#googleStars').textContent = stars(g.rating);
  $('#googleCount').textContent = g.reviewCount.toLocaleString('en-US');
  $('#googleLink').href = g.url || '#';
  $('#googleMore').href = g.url || '#';
  $('#googleReviews').innerHTML = g.reviews.map(r => {
    const name = r.authorUrl ? `<a href="${esc(r.authorUrl)}" target="_blank" rel="noopener">${esc(r.author)}</a>` : esc(r.author);
    const avatar = r.authorPhoto
      ? `<img class="avatar" src="${esc(r.authorPhoto)}" alt="" referrerpolicy="no-referrer" loading="lazy">`
      : `<div class="avatar">${esc(initials(r.author))}</div>`;
    const text = r.text.length > 220 ? r.text.slice(0, 217).trimEnd() + '…' : r.text;
    return `<article class="review">
      ${avatar}
      <div>
        <strong>${name}</strong><div class="stars">${stars(r.stars)}</div>
        ${text ? `<q>${esc(text)}</q>` : ''}
        <time datetime="${esc(r.date || '')}">${esc(r.when || '')} · Google</time>
      </div>
    </article>`;
  }).join('');
  const t = new Date(g.fetchedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  $('#googleUpdated').textContent = `Updated ${t} · refreshes automatically`;
}

watchLiveReviews(renderGoogle);

try {
  const shop = await loadShop();
  fillShopLinks(shop);
  render(shop);
} catch (err) {
  console.warn(err);
}
