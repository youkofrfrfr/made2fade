# Made2Fade Barbershop

Website for Made2Fade Barbershop, 60 Susa Dr., Suite 111, Stafford, VA 22554.

Static site, no build step.

```
index.html          Home page
app.html            /app page the QR code points to (app store + booking links)
css/styles.css      All styles
js/shop.js          Shared helpers: load data, shop-time math, open/closed status
js/main.js          Home page: renders hours, status, reviews, prices, QR code
js/app.js           /app page: shows the visitor's app store first
js/vendor/          QR code generator (qrcode-generator 1.4.4)
data/shop.json      Hours, closures, phone, links, rating, reviews and prices
assets/             Logo, photos and video
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
- **Reviews:** update `"rating"` and `"reviewCount"` from theCut, and add new entries to the top of `"reviews"` with the date they were left. "Today / 2 weeks ago" labels are worked out automatically.
- **Prices:** edit `"services"`.

The open/closed status, today's highlighted hours and review ages are calculated in Eastern time and refresh every 30 seconds while the page is open.

## QR code

The QR code is generated in the browser and points to `https://<your-domain>/app`, so it stays correct on whatever domain the site is deployed to. That page puts the App Store or Google Play button first depending on the phone, plus a Book Online button. On localhost the QR points straight to the booking page instead.

## Deploy on Vercel

1. Import this repo at https://vercel.com/new
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 (use `/app.html` locally; Vercel serves it as `/app`).
