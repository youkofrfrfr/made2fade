// /barbers page: every barber with Details and Book buttons.
import { loadShop } from './shop.js';
import { $, observeReveals, fillShopLinks, barberCard, updateStatuses} from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

try {
  const shop = await loadShop();
  fillShopLinks(shop);
  $('#teamGrid').innerHTML = shop.barbers.map(b => barberCard(shop, b)).join('');
  observeReveals();
  setInterval(() => updateStatuses(shop), 30 * 1000);
} catch (err) {
  console.warn(err);
}
