# Made2Fade Barbershop

Website for Made2Fade Barbershop, 60 Susa Dr., Suite 111, Stafford, VA 22554.

Static site, no build step.

```
index.html          Home page
barbers.html        /barbers: every barber with Details and Book buttons (all Book Now buttons land here)
barber.html         /barber?b=<id>: one barber's hours, prices, booking links, cuts and reviews
app.html            /app page the QR code points to (app store + barbers page)
css/styles.css      All styles
js/shop.js          Shared helpers: load data, shop-time math, open/closed status
js/ui.js            Shared page pieces: nav, barber cards, cut tiles, price lists
js/main.js          Home page: hours, status, team preview, mixed cuts, reviews, QR code
js/barbers.js       Barbers page
js/barber.js        Barber profile page
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
- **Ratings:** update each barber's `"rating"` and `"reviewCount"` from theCut. The site adds them up for the team total. Add new entries to `"reviews"` with the date they were left. "Today / 2 weeks ago" labels are worked out automatically.
- **Barbers:** everyone is in `"barbers"`: name, title, bio, rating, review count, booking link, social links, services (prices) and cuts (photos). Tony stays first since he has the owner section. Add `"hours"` to a barber to show his weekly schedule and live in-shop status on his card.
- **Hiding a barber:** set `"hidden": true` on their entry. They stay in the file but disappear from every page (Cera Addi is hidden until she's confirmed).
- **Adding a barber:** copy an entry in `"barbers"`, give it a new `"id"`, and put photos in `assets/cuts/<id>/`. The Barbers page, their profile page and the home page mix pick it up automatically.
- **Reviews:** the recent reviews list in `"reviews"` takes a `"barber"` id so each one shows who it was for.

The open/closed status, today's highlighted hours and review ages are calculated in Eastern time and refresh every 30 seconds while the page is open.

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
