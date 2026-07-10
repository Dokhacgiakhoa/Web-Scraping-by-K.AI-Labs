# Browser review task: Web Scraping by K.AI Labs (Phase 1 — SEO check)

You are reviewing a Chrome extension + backend web app by driving a real Chrome browser
(clicking, typing, opening the extension side panel, reading console logs). This project is a
fresh Phase 1 MVP — no automated browser test has run against it yet. Your job is to actually use
it end-to-end and report every bug, broken flow, or confusing UX you hit, not just confirm it
"looks fine."

## What this project is

- `backend/` — Node.js + Express + Prisma/PostgreSQL API and a minimal server-rendered web app
  (EJS): signup, login, dashboard, BYOK AI API key storage, an `/extension/connect` handoff page,
  and results history.
- `extension/` — a Manifest V3 Chrome extension (plain TypeScript, no bundler — built with `tsc`):
  a side panel UI, a background service worker, and content scripts for SEO scanning and for
  relaying the login token from the web app into the extension.
- The product flow: user signs up on the web app → adds their own AI API key (OpenAI, Anthropic,
  or Google — their choice) → connects the extension from the dashboard → in the extension side
  panel, types a natural-language request (e.g. "check this page's SEO") → the backend asks the
  AI to turn that into a checklist of SEO checks → the extension runs those checks against the
  currently open page (on-page basics, structured data / JSON-LD, link analysis, Core Web Vitals)
  → results show in the side panel, are exportable as JSON/CSV, and are saved to history on the
  dashboard.

Full architecture/plan context (if useful): none of that is required reading to do this task —
everything you need is below.

## Environment setup (do this first)

1. **Postgres**: a local Postgres must be reachable at the connection string in
   `backend/.env` (already created). If it's not running, start it — check whether a Docker
   container named `kailabs-postgres` exists (`docker ps -a`) and start it
   (`docker start kailabs-postgres`) rather than creating a new one. It listens on host port
   `5433` (not the default 5432, to avoid clashing with other local Postgres instances).
2. **Backend**: from `backend/`, run `npm run dev` if it isn't already running. Confirm with
   `curl http://localhost:3000/health` → should return `{"ok":true}`.
3. **Extension**: it should already be built at `extension/dist`. If you change any extension
   source, rebuild with `npm run build` from `extension/` before reloading it in Chrome.
4. **Load the extension in Chrome** (you must do this yourself via the browser, no shortcut):
   - Go to `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked" → select `extension/dist`
   - Note the extension's ID and pin it to the toolbar if useful
5. **You need a real AI API key** (OpenAI, Anthropic, or Google AI Studio) to test the Analyze
   flow end-to-end — the "AI classify" step genuinely calls that provider. If you don't have one,
   test everything up to that point and clearly report that the Analyze step is untested, rather
   than faking a pass.

## Test plan — work through each step and record pass/fail + evidence

### A. Signup & dashboard
1. Navigate to `http://localhost:3000` — should redirect to `/login`.
2. Go to `/signup`, create an account with a throwaway email + password (8+ chars).
3. Confirm you land on `/dashboard` and it shows your email.
4. Reload `/dashboard` — confirm the session persists (cookie-based auth working).

### B. API key settings
1. On the dashboard, pick a provider and paste a real API key, click "Save key".
2. Confirm the page shows the provider as configured after reload.
3. Try saving an obviously-too-short key (e.g. "abc") — confirm it's rejected with a clear error,
   not a silent failure or a crash.

### C. Extension connect handoff
1. From the dashboard, click "Open connect page" (`/extension/connect`).
2. Open the extension's side panel (click its toolbar icon).
3. In the side panel's "disconnected" view, confirm the Web app URL field defaults to
   `http://localhost:3000`, then click "Open connect page" inside the panel.
4. Verify the side panel transitions to the "connected" view showing your email — this should
   happen automatically (no manual "I'm connected" button) via a content script relaying the
   token. Time how long this takes; if it doesn't happen within a few seconds, that's a bug —
   check the connect tab's DOM for `#kai-connect-token` and check the extension's service worker
   console (`chrome://extensions` → "service worker" link under the extension) for errors.

### D. SEO analyze flow (requires a real API key from step B)
1. Navigate a normal tab to a real page (e.g. `https://example.com`, or better, a page with more
   content/structured data like a blog post or product page, to exercise more of the checks).
2. Open the side panel, type a natural-language request (try a few variants across runs:
   "check SEO", "check this page's structured data", "how are the Core Web Vitals here").
3. Click "Analyze this page". Confirm:
   - A status message appears while it runs.
   - It completes within a reasonable time (report how long).
   - Results render as a list of checks, each with a PASS/WARN/FAIL badge and a details string.
   - The results roughly match what you'd expect for that specific page (e.g. if the page has no
     JSON-LD, structured data should show WARN "No JSON-LD structured data found").
4. Try it again with a request that should only need one check (e.g. "just check the headings and
   meta tags") — confirm the AI plan actually narrows the checks run (fewer result cards), not
   just always running all four.
5. Deliberately test a page you don't have an AI key configured for by temporarily removing the
   key (or use a fresh account) — confirm the error message is the friendly
   "No AI API key configured..." message, not a raw stack trace.

### E. Export & history
1. After a successful analyze, click "Export JSON" — confirm a valid JSON file downloads with the
   page URL and results.
2. Click "Export CSV" — confirm a valid CSV downloads and opens correctly (check for comma/quote
   escaping issues if any check's `details` text contains commas or quotes).
3. Go back to `/dashboard`, reload — confirm the check you just ran shows up under "Recent
   results" with the correct type/URL/timestamp.

### F. Disconnect / logout
1. In the side panel, click "Log out" — confirm it returns to the "disconnected" view.
2. On the web dashboard, click "Log out" — confirm it redirects to `/login` and `/dashboard`
   redirects back to `/login` when visited while logged out.

## What to report back

For each lettered section (A–F), report:
- Pass / Fail / Blocked (and why, if blocked — e.g. "no API key available")
- Any console errors (background service worker console, side panel console, page console) —
  quote the exact error text
- Any UX rough edges even if not a hard bug (confusing copy, missing loading state, a button that
  does nothing when clicked twice, etc.)
- Screenshots for anything visually broken

Do not fix anything yourself — this is a review pass. List findings so they can be triaged and
fixed afterward.
