// Header, footer and the phone bottom bar, shared by every page.
// Each page sets <body data-page="..."> so the matching nav link is highlighted.

const PAGES = [
  { id: 'barbers', href: '/barbers.html', label: 'Barbers' },
  { id: 'cuts', href: '/cuts.html', label: 'Cuts' },
  { id: 'services', href: '/services.html', label: 'Prices' },
  { id: 'reviews', href: '/reviews.html', label: 'Reviews' },
  { id: 'visit', href: '/visit.html', label: 'Visit' },
  { id: 'merch', href: '/merch.html', label: 'Merch' },
  { id: 'app', href: '/app.html', label: 'Get the App' },
];

const PHONE = '(540) 602-8192';
const TEL = 'tel:+15406028192';
const DIRECTIONS = 'https://www.google.com/maps/dir/?api=1&destination=60+Susa+Drive%2C+Stafford%2C+VA+22554';

const icon = {
  menu: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  call: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  cuts: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>',
  instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
};

export function mountLayout() {
  const page = document.body.dataset.page;
  const link = p => `<a href="${p.href}"${p.id === page ? ' aria-current="page"' : ''}>${p.label}</a>`;

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="nav${page === 'home' ? '' : ' scrolled'}" id="nav">
      <div class="wrap">
        <a href="/" class="brand"><img src="/assets/logo.jpg" alt=""><span class="gold-text">MADE2FADE</span></a>
        <nav class="nav-links" id="navLinks" aria-label="Main">
          ${PAGES.map(link).join('')}
          <a href="/barbers.html" class="btn btn-gold nav-book">Book Now</a>
        </nav>
        <button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">${icon.menu}</button>
      </div>
    </header>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <a href="/" class="brand"><img src="/assets/logo.jpg" alt=""><span class="gold-text">MADE2FADE</span></a>
          <p>60 Susa Dr., Suite 111<br>Stafford, VA 22554</p>
          <p><a href="${TEL}">${PHONE}</a></p>
        </div>
        <nav class="footer-links" aria-label="Footer">${PAGES.map(link).join('')}</nav>
        <div class="footer-social">
          <a href="https://www.instagram.com/made2fade_llc" target="_blank" rel="noopener" aria-label="Instagram">${icon.instagram}</a>
        </div>
      </div>
      <p class="wrap footer-copy">© ${new Date().getFullYear()} Made2Fade Barbershop LLC · Stafford, VA</p>
    </footer>
    <nav class="bottom-bar" aria-label="Quick actions">
      <a href="/barbers.html" class="bb-main">${icon.book}<span>Book</span></a>
      <a href="/cuts.html">${icon.cuts}<span>Cuts</span></a>
      <a href="${TEL}">${icon.call}<span>Call</span></a>
      <a href="${DIRECTIONS}" target="_blank" rel="noopener">${icon.pin}<span>Directions</span></a>
    </nav>`);

  // Header turns solid once the page scrolls (home starts transparent over the hero)
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', page !== 'home' || window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Full-screen menu on phones
  const btn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  const setOpen = open => {
    links.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.innerHTML = open ? icon.close : icon.menu;
  };
  btn.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
}
