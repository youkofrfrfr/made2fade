// /cuts: every barber's cuts, mixed by default, with a filter per barber.
import { loadShop } from './shop.js';
import { $, $$, esc, shortName, findBarber, profileUrl, fillShopLinks, cutHtml, cutsFor } from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

const PAGE = 12;
let filter = new URLSearchParams(location.search).get('b') || 'all';
let limit = PAGE;
let shop;

function render() {
  const withCuts = shop.barbers.filter(b => b.cuts.length);
  if (filter !== 'all' && !findBarber(shop, filter)) filter = 'all';

  $('#cutTabs').innerHTML = [{ id: 'all', label: 'Everyone' }]
    .concat(withCuts.map(b => ({ id: b.id, label: shortName(b) })))
    .map(t => `<button role="tab" data-cuts="${t.id}" aria-selected="${filter === t.id}">${esc(t.label)}</button>`)
    .join('');
  $$('#cutTabs button').forEach(btn => btn.addEventListener('click', () => {
    filter = btn.dataset.cuts;
    limit = PAGE;
    history.replaceState(null, '', filter === 'all' ? location.pathname : `?b=${filter}`);
    render();
  }));

  const cuts = cutsFor(shop, filter);
  $('#cutGrid').innerHTML = cuts.slice(0, limit).map(({ c, b }) => cutHtml(c, b)).join('');
  $('#moreCuts').hidden = cuts.length <= limit;

  // When one barber is picked, offer their details page
  const b = filter !== 'all' && findBarber(shop, filter);
  const book = $('#cutBook');
  book.hidden = !b;
  if (b) {
    book.href = profileUrl(b);
    book.textContent = `${shortName(b)}'s Details & Booking`;
  }
}

$('#moreCuts').addEventListener('click', () => {
  limit += PAGE;
  render();
});

try {
  shop = await loadShop();
  fillShopLinks(shop);
  render();
} catch (err) {
  console.warn(err);
}
