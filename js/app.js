// /app landing page (where the QR code points): put the visitor's own app store first.
import { loadShop, platform } from './shop.js';

const stack = document.getElementById('stack');
const ios = stack.querySelector('[data-store="ios"]');
const android = stack.querySelector('[data-store="android"]');
const booking = stack.querySelector('[data-booking]');

const p = platform();
if (p === 'ios') {
  ios.classList.add('highlight');
  android.remove();
} else if (p === 'android') {
  android.classList.add('highlight');
  stack.prepend(android);
  ios.remove();
}

try {
  const shop = await loadShop();
  ios.href = shop.links.appStore;
  android.href = shop.links.googlePlay;
  booking.href = shop.links.booking;
} catch (err) {
  console.warn(err);
}
