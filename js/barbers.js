// /barbers page: every barber with Details and Book, plus an even mix of cuts.
import { loadShop } from './shop.js';
import { $, initChrome, observeReveals, fillShopLinks, barberCard, updateStatuses, cutHtml, mixedCuts } from './ui.js';

initChrome();

try {
  const shop = await loadShop();
  fillShopLinks(shop);
  $('#teamGrid').innerHTML = shop.barbers.map(b => barberCard(shop, b)).join('');
  $('#cutGrid').innerHTML = mixedCuts(shop, 3).map(({ c, b }) => cutHtml(c, b)).join('');
  observeReveals();
  setInterval(() => updateStatuses(shop), 30 * 1000);
} catch (err) {
  console.warn(err);
}
