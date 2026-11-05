// Shared helpers: load shop data and work out times in the shop's timezone.

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function loadShop() {
  // no-cache so edits to shop.json show up as soon as they are deployed
  const res = await fetch('/data/shop.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Could not load shop data');
  return res.json();
}

// Current date/time at the shop, independent of the visitor's timezone.
export function shopNow(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = t => +parts.find(p => p.type === t).value;
  const y = get('year'), m = get('month'), d = get('day');
  return { y, m, d, minutes: (get('hour') % 24) * 60 + get('minute') };
}

// Calendar day `offset` days after the shop's today, as { iso, dow }.
export function shopDay(now, offset = 0) {
  const date = new Date(Date.UTC(now.y, now.m - 1, now.d + offset));
  return { iso: date.toISOString().slice(0, 10), dow: date.getUTCDay() };
}

const toMinutes = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Hours for a given day, taking special closures / holiday hours into account.
// closures: [{ "date": "2026-12-25", "note": "Christmas" }]
//       or  [{ "date": "2026-12-24", "hours": ["08:00", "14:00"], "note": "Christmas Eve" }]
export function hoursFor(shop, day) {
  const special = (shop.closures || []).find(c => c.date === day.iso);
  if (special) return { hours: special.hours || null, note: special.note || 'Closed today', special: true };
  return { hours: shop.hours[DAYS[day.dow]] || null, special: false };
}

// Open/closed status, e.g. { state: 'open', label: 'Open now · until 6:00 PM' }
export function openStatus(shop) {
  const now = shopNow(shop.timezone);
  const today = hoursFor(shop, shopDay(now));

  if (today.hours) {
    const open = toMinutes(today.hours[0]);
    const close = toMinutes(today.hours[1]);
    if (now.minutes >= open && now.minutes < close) {
      const soon = close - now.minutes <= 60;
      return {
        state: soon ? 'soon' : 'open',
        label: `${soon ? 'Closing soon' : 'Open now'} · until ${formatTime(today.hours[1])}`,
      };
    }
    if (now.minutes < open) {
      return { state: 'closed', label: `Closed · opens today ${formatTime(today.hours[0])}` };
    }
  }

  for (let i = 1; i <= 14; i++) {
    const day = shopDay(now, i);
    const next = hoursFor(shop, day);
    if (next.hours) {
      const when = i === 1 ? 'tomorrow' : SHORT[day.dow];
      return { state: 'closed', label: `Closed · opens ${when} ${formatTime(next.hours[0])}` };
    }
  }
  return { state: 'closed', label: 'Closed' };
}

// "Today", "3 days ago", "2 weeks ago" relative to the shop's today.
export function timeAgo(iso, timezone) {
  const now = shopNow(timezone);
  const [y, m, d] = iso.split('-').map(Number);
  const days = Math.round((Date.UTC(now.y, now.m - 1, now.d) - Date.UTC(y, m - 1, d)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) { const w = Math.floor(days / 7); return `${w} week${w > 1 ? 's' : ''} ago`; }
  if (days < 365) { const mo = Math.floor(days / 30); return `${mo} month${mo > 1 ? 's' : ''} ago`; }
  const yr = Math.floor(days / 365);
  return `${yr} year${yr > 1 ? 's' : ''} ago`;
}

export function stars(n) {
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// 'ios' | 'android' | 'other'
export function platform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

export { DAYS };
