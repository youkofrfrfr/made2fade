# Made2Fade Barbershop

Website for Made2Fade Barbershop, 60 Susa Dr., Suite 111, Stafford, VA 22554.

Static site, no build step.

```
index.html          Home: hero, team row, a few mixed cuts, quick links
barbers.html        /barbers: every barber with Details and Book (all Book Now buttons land here)
barber.html         /barber?b=<id>: one barber's profile with Cuts / Prices / Hours / Reviews tabs
cuts.html           /cuts: all cuts, filter by barber (?b=<id>)
services.html       /services: services and each barber's price menu (?b=<id>)
reviews.html        /reviews: team rating, each barber's rating, latest reviews
visit.html          /visit: live hours, holiday notices, contact, map
app.html            /app: theCut download buttons + QR code (what the QR points to)
css/styles.css      All styles
js/layout.js        Header, full-screen phone menu, footer and phone bottom bar (shared by every page)
js/shop.js          Load data, shop-time math, open/closed status
js/ui.js            Shared pieces: barber cards, cut tiles, price lists, hours lists
js/<page>.js        One script per page (main.js is the home page)
js/live-reviews.js  Fetches /api/reviews and refreshes it every 5 minutes
api/reviews.js      Vercel function: live Google rating + latest reviews (Places API)
js/vendor/          QR code generator (qrcode-generator 1.4.4)
data/shop.json      Hours, closures, phone, links, barbers (photos, prices, cuts) and reviews
assets/barbers/     Each barber's profile photo
assets/cuts/        Each barber's cut photos
```

## Updating the site

Everything that changes lives in `data/shop.json`. Edit it on GitHub, commit, and Vercel redeploys in about a minute.

- **Hours:** `"hours"` uses 24-hour times, e.g. `"saturday": ["07:00", "16:00"]`. Use `null` for closed.
- **Holidays / days off:** add to `"closures"`:
  ```json
  "closures": [
    { "date": "2026-11-26", "note": "Thanksgiving" },
    { "date": "2026-12-24", "hours": ["08:00", "14:00"], "note": "Christmas Eve" }
  ]
  ```
  The site shows a notice two weeks ahead and the open/closed status follows it on the day.
- **theCut ratings and reviews:** updated automatically every hour (see below). The site adds the ratings up for the team total.
- **Barbers:** everyone is in `"barbers"`: name, title, bio, rating, review count, booking link, social links, services (prices) and cuts (photos). Add `"hours"` to a barber to show his weekly schedule and live in-shop status on his card.
- **Braiders and other roles:** add `"role": "Braider"` to show a gold tag next to their name. They stay on the Barbers page with everyone else. Add `"phone"` to show a Call button on their profile.
- **Hiding a barber:** set `"hidden": true` on their entry. They stay in the file but disappear from every page.
- **Adding a barber:** copy an entry in `"barbers"`, give it a new `"id"`, and put their photo in `assets/barbers/` and cuts in `assets/cuts/<id>/`. The Barbers page, their profile page and the home page mix pick it up automatically.
- **Reviews:** the recent reviews list in `"reviews"` takes a `"barber"` id so each one shows who it was for.

The open/closed status, today's highlighted hours and review ages are calculated in Eastern time and refresh every 30 seconds while the page is open.

## Live Google reviews

The Reviews page and the home page show the shop's Google rating, review count and latest reviews live. The page refreshes them every 5 minutes, and the server asks Google at most once an hour (cached at Vercel's edge). Until it's set up, the Google section simply stays hidden.

Setup (one time, about 10 minutes):

1. Go to https://console.cloud.google.com, create a project, and enable **Places API (New)**. Google asks for a billing account; this usage (about 24 calls a day) stays within the monthly free allowance.
2. Under **APIs & Services → Credentials**, create an **API key**. Restrict it to **Places API (New)**.
3. In Vercel → this project → **Settings → Environment Variables**, add `GOOGLE_PLACES_API_KEY` with that key, then redeploy.
4. Optional: add `GOOGLE_PLACE_ID` if the wrong business shows up. Without it, the function searches for "Made2Fade Barbershop, 60 Susa Dr, Stafford, VA 22554".

Check it by opening `https://<your-site>/api/reviews`: it should return the rating and reviews as JSON.

## theCut ratings and reviews (automatic)

`.github/workflows/update-reviews.yml` runs every hour on GitHub Actions. It opens each barber's public theCut page (the `"thecut"` handle on their entry in `data/shop.json`), reads their rating, review count and 5 newest reviews, and commits any changes to `data/shop.json`. Vercel redeploys on that commit, so the site is never more than about an hour behind theCut.

- Run it now: GitHub → **Actions** → **Update theCut reviews** → **Run workflow**.
- Each run's log shows one line per barber, e.g. `tony: 5/234 -> 5/239, 239 reviews on page`.
- If theCut changes its page layout and every barber fails, the run fails and GitHub emails you; the site keeps showing the last good numbers.
- Reviewer names are shortened to first name + last initial.
- Cera books on Booksy, so her rating and reviews come from Booksy and are updated by hand in `data/shop.json`. The hourly job leaves them alone while her theCut page has no reviews.

## QR code

The QR code is generated in the browser and points to `https://<your-domain>/app`, so it stays correct on whatever domain the site is deployed to. That page puts the App Store or Google Play button first depending on the phone, plus a button to the Barbers page. On localhost the code still points at /app, so test it after deploying.

## Deploy on Vercel

1. Import this repo at https://vercel.com/new
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 (use `/app.html` locally; Vercel serves it as `/app`).
