// /merch: shop hoodies and tees. Nothing is sold online; each item has one "Get This"
// button that opens a small sheet with an Instagram DM, a text (with the item filled in) or a call.
import { loadShop } from './shop.js';
import { $, $$, esc, tel, fillShopLinks } from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

const icon = {
  dm: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  text: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  call: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
};

// "sms:+1...?&body=" opens a prefilled text on both iPhone and Android
function smsLink(shop, message) {
  return `${tel(shop.phone).replace('tel:', 'sms:')}?&body=${encodeURIComponent(message)}`;
}

function actionsHtml(shop, message) {
  const dm = shop.links.instagramDm || shop.links.instagram;
  return `
    <a class="btn btn-gold" href="${dm}" target="_blank" rel="noopener">${icon.dm}<span>DM</span></a>
    <a class="btn btn-ghost" href="${smsLink(shop, message)}">${icon.text}<span>Text</span></a>
    <a class="btn btn-ghost" href="${tel(shop.phone)}">${icon.call}<span>Call</span></a>`;
}

const labelFor = m => `${m.name} (${m.color.replace(' · ', '/')})`;
const askFor = m => `Hi Made2Fade! I'm interested in the ${labelFor(m)}. What sizes and prices do you have?`;

function itemHtml(m) {
  const label = labelFor(m);
  const thumbs = m.images.length > 1
    ? `<div class="merch-thumbs">${m.images.map((src, i) => `
        <button type="button" data-src="${src}" aria-label="Photo ${i + 1}"${i ? '' : ' aria-current="true"'}><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>`
    : '';
  return `
    <article class="merch-card reveal">
      <div class="merch-photo"><img src="${m.images[0]}" alt="${esc(label)}" loading="lazy"></div>
      ${thumbs}
      <div class="merch-info">
        <span class="merch-type">${esc(m.type)}</span>
        <h3>${esc(m.name)}</h3>
        <p class="merch-color">${esc(m.color)}</p>
        <p class="merch-price">Price &amp; sizes: message us</p>
        <button type="button" class="btn btn-gold merch-get" data-id="${m.id}">Get This</button>
      </div>
    </article>`;
}

try {
  const shop = await loadShop();
  fillShopLinks(shop);
  const merch = shop.merch || [];
  $('#merchGrid').innerHTML = merch.map(itemHtml).join('');
  $('#merchContact').innerHTML = actionsHtml(shop, "Hi Made2Fade! I have a question about your merch.");

  // Swap the big photo when a thumbnail is tapped
  $$('.merch-thumbs button').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.merch-card');
    card.querySelector('.merch-photo img').src = btn.dataset.src;
    card.querySelectorAll('.merch-thumbs button').forEach(b => b.removeAttribute('aria-current'));
    btn.setAttribute('aria-current', 'true');
  }));

  // "Get This" opens the order sheet for that item
  const sheet = $('#orderSheet');
  $$('.merch-get').forEach(btn => btn.addEventListener('click', () => {
    const m = merch.find(x => x.id === btn.dataset.id);
    $('#orderImg').src = m.images[0];
    $('#orderName').textContent = m.name;
    $('#orderColor').textContent = m.color;
    $('#orderActions').innerHTML = actionsHtml(shop, askFor(m));
    sheet.showModal();
  }));
  $('#orderClose').addEventListener('click', () => sheet.close());
  // Tapping the dark area outside the sheet closes it
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  // Reveal right away; these cards are the whole page
  requestAnimationFrame(() => $$('.merch-card').forEach(el => el.classList.add('in')));
} catch (err) {
  console.warn(err);
}
