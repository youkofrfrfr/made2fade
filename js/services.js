// /services: each barber's price menu, one tab per barber.
import { loadShop } from './shop.js';
import { $, $$, esc, shortName, findBarber, profileUrl, fillShopLinks, priceListHtml } from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

let shop;
let selected = new URLSearchParams(location.search).get('b');

function render() {
  if (!findBarber(shop, selected)) selected = shop.barbers[0].id;
  $('#priceTabs').innerHTML = shop.barbers.map(b =>
    `<button role="tab" data-barber="${b.id}" aria-selected="${b.id === selected}">${esc(shortName(b))}</button>`).join('');
  $$('#priceTabs button').forEach(btn => btn.addEventListener('click', () => {
    selected = btn.dataset.barber;
    history.replaceState(null, '', `?b=${selected}`);
    render();
  }));

  const b = findBarber(shop, selected);
  $('#priceList').innerHTML = priceListHtml(b.services);
  const book = $('#priceBook');
  book.href = b.booking;
  book.target = '_blank';
  book.rel = 'noopener';
  book.textContent = `Book with ${shortName(b)}`;
  const details = $('#priceDetails');
  details.href = profileUrl(b);
  details.textContent = `${shortName(b)}'s Details`;
}

try {
  shop = await loadShop();
  fillShopLinks(shop);
  render();
} catch (err) {
  console.warn(err);
}
