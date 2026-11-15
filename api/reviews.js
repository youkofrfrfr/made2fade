// GET /api/reviews: live Google rating and latest reviews for Made2Fade.
//
// Uses the official Google Places API (New). Set these in Vercel → Project → Settings → Environment Variables:
//   GOOGLE_PLACES_API_KEY  (required) an API key with "Places API (New)" enabled
//   GOOGLE_PLACE_ID        (optional) the shop's place ID; if missing it is looked up by name and address
//
// Responses are cached at Vercel's edge for an hour so Google is called at most ~24 times a day.

const SEARCH_QUERY = 'Made2Fade Barbershop, 60 Susa Dr, Stafford, VA 22554';
const PLACES = 'https://places.googleapis.com/v1';
const CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

async function places(path, key, fieldMask, init = {}) {
  const res = await fetch(`${PLACES}${path}`, {
    ...init,
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function findPlaceId(key) {
  const data = await places('/places:searchText', key, 'places.id', {
    method: 'POST',
    body: JSON.stringify({ textQuery: SEARCH_QUERY, maxResultCount: 1 }),
  });
  return data.places?.[0]?.id;
}

function shape(place) {
  return {
    source: 'google',
    name: place.displayName?.text,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    url: place.googleMapsUri,
    fetchedAt: new Date().toISOString(),
    reviews: (place.reviews || []).map(r => ({
      author: r.authorAttribution?.displayName || 'Google user',
      authorUrl: r.authorAttribution?.uri || null,
      authorPhoto: r.authorAttribution?.photoUri || null,
      stars: r.rating,
      text: r.originalText?.text || r.text?.text || '',
      date: r.publishTime,
      when: r.relativePublishTimeDescription,
      url: r.googleMapsUri || null,
    })),
  };
}

module.exports = async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ configured: false, error: 'GOOGLE_PLACES_API_KEY is not set' });
  }
  try {
    const id = process.env.GOOGLE_PLACE_ID || await findPlaceId(key);
    if (!id) throw new Error('Shop not found on Google');
    const place = await places(`/places/${encodeURIComponent(id)}`, key,
      'id,displayName,rating,userRatingCount,googleMapsUri,reviews');
    res.setHeader('Cache-Control', CACHE);
    return res.status(200).json({ configured: true, ...shape(place) });
  } catch (err) {
    console.error(err);
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(502).json({ configured: true, error: 'Could not load Google reviews' });
  }
};

module.exports.shape = shape;
