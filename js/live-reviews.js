// Live Google reviews from /api/reviews (see api/reviews.js).
// Pages call watchLiveReviews(onUpdate); it fetches now, then every few minutes while the tab is open.
// If the API isn't set up (or the site runs without it, e.g. locally) onUpdate is simply never called.

const REFRESH_MS = 5 * 60 * 1000;

export async function fetchLiveReviews() {
  try {
    const res = await fetch('/api/reviews', { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.configured && data.rating != null ? data : null;
  } catch {
    return null;
  }
}

export function watchLiveReviews(onUpdate) {
  let timer;
  const tick = async () => {
    const data = await fetchLiveReviews();
    if (data) onUpdate(data);
  };
  tick();
  timer = setInterval(tick, REFRESH_MS);
  // Refresh right away when someone comes back to the tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });
  return () => clearInterval(timer);
}
