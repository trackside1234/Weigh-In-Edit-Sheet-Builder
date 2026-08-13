# Weigh In Review Builder

A browser-based production tool for creating Weigh In replay edit worksheets from the TAB NZ Affiliate Racing API.

## What is included

- `public/index.html` — the browser interface.
- `src/index.js` — a Cloudflare Worker that proxies only the required TAB API routes.
- `wrangler.toml` — Cloudflare Workers Static Assets configuration.
- `package.json` — optional local deployment tooling.

The Worker and webpage deploy together on one `*.workers.dev` URL. Because the browser talks to `/api/...` on the same origin, the TAB API's CORS restriction is no longer a problem.

## API routes used by the app

- `/api/meetings?date=YYYY-MM-DD`
  - forwards to TAB meetings with `category=T`, `country=NZ`, and the selected date.
- `/api/event/<TAB-event-UUID>`
  - forwards to one TAB race event.
- `/api/health`
  - simple deployment health check.

The proxy deliberately does **not** accept arbitrary upstream URLs.

## Deploy option A — GitHub + Cloudflare dashboard (easiest if you don't want local tooling)

1. Put this project folder into a GitHub repository.
2. In Cloudflare, go to **Workers & Pages** and create/import a Worker project from that GitHub repository.
3. Use the repository root as the project root.
4. Cloudflare should detect `wrangler.toml`.
5. Deploy.
6. Open the resulting `https://<project>.workers.dev` URL.
7. Test `https://<project>.workers.dev/api/health`.
8. In the app, choose **12 August 2026** and fetch meetings. Rotorua should appear.

If Cloudflare's Git integration asks for a deploy command, use:

    npx wrangler deploy

## Deploy option B — Wrangler from a personal/home computer

Requires Node only on the machine used to deploy. It is **not** required on the work PC.

From the project folder:

    npm install
    npx wrangler login
    npm run deploy

Cloudflare will return a `*.workers.dev` URL. Bookmark that URL on the work computer.

## First-use test

1. Open the deployed app.
2. Select 12 August 2026.
3. Click **Find NZ Thoroughbred Meetings**.
4. Select Rotorua.
5. The app should load all eight races through `/api/event/...`.
6. Each runner should show:
   - silk
   - official placing
   - horse
   - jockey
   - trainer
7. Tick the horses needed under **ARROWS**.
8. Choose the **KEY** runner.
9. Edit the race media code or export filename if needed.
10. Copy or download the generated edit worksheet.

## Race media codes

The prototype includes a small starter mapping, including:

- Rotorua → ROTU
- Ellerslie → AUCK
- Riverton → RIVR
- Te Rapa → TE R
- Riccarton → RICC
- Awapuni → AWAP
- Trentham → TREN
- Tauranga → TAUR

The meeting-code field is always editable. Once the full internal code list is supplied, put it into the `known` object inside `public/index.html`.

## Notes

- The TAB event response can be very large. The UI only uses the fields needed for the edit workflow.
- Results are matched to runners by `runner_number`.
- Scratched runners are hidden.
- Top 3 is selected by default for each race.
- Silks use `silk_url_128x128`, falling back to 64x64.
- Project saves are stored in that browser's `localStorage`.
- The current Word export is an HTML-based `.doc` that Word can open. A true `.docx` can be added later if needed.

## Security

The Worker accepts only:
- validated `YYYY-MM-DD` meeting dates
- UUID-shaped TAB event IDs

It cannot be used as a generic CORS proxy.

## Suggested next refinements

- full internal meeting-code dictionary
- race inclusion toggle
- reorder races/segments
- configurable replay instruction presets
- actual `.docx` template output matching the existing Weigh In worksheet formatting
- save named projects rather than one local save slot
- optional beaten-jockey / OLAY / weight-watcher block generators

## KEY race name

The generated KEY descriptor now defaults to the full TAB race description/name, not the race class. The field remains editable.


## v3 workflow
- Build a race, then click **Add to Edit Sheet**.
- Added races show a checkmark on the tab and can be removed again.
- The visual preview shows TAB silk images next to every selected ARROWS runner.
- **Copy Rich Edit Sheet** copies HTML + plain text, so Word/Google Docs can preserve the silk images where supported.
- KEY defaults to the full TAB race name/description.


## v4 changes
- Added races now persist across meeting changes, so one edit sheet can contain races from Te Rapa, Riccarton, etc.
- Edit sheet race basket is keyed by TAB event ID and survives switching meetings.
- Added full supplied production club-code list as a datalist on the Meeting media code field.
- Common unambiguous venue aliases auto-fill (for example Te Rapa -> WAIK, Ellerslie -> AUCK); shared/special club venues remain editable.
- Silks in rich-copy/export output are now approximately text-height (12px) instead of thumbnail size.
- Added edit-sheet race/meeting count and Clear Edit Sheet.

- Unknown/shared venues now leave the meeting code blank rather than inventing a four-letter code; select the correct club from the supplied code list.
