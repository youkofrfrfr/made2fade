// /app: theCut download buttons (visitor's store first) and a QR code that opens this page on a phone.
import { loadShop, platform } from './shop.js';
import { $, fillShopLinks } from './ui.js';
import { mountLayout } from './layout.js';

mountLayout();

const p = platform();
if (p !== 'other') $(`.store-btn[data-store="${p}"]`)?.classList.add('highlight');

// QR points at this page, so scanning from a computer opens it on a phone
function renderQr() {
  const box = $('#qr');
  if (!box || typeof qrcode !== 'function') return;
  const target = new URL('/app', location.origin).href;
  const qr = qrcode(0, 'M');
  qr.addData(target);
  qr.make();
  box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: `QR code: ${target}` });
  box.dataset.target = target;
}

// The QR library loads with defer, so wait for it before drawing
if (document.readyState === 'complete') renderQr();
else window.addEventListener('load', renderQr);

try {
  fillShopLinks(await loadShop());
} catch (err) {
  console.warn(err);
}
