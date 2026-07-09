# Web Scraping by K.AI Labs

AI-first SEO checker & (future) web scraper, delivered as a Chrome extension backed by a hosted
web app. Users log into the K.AI Labs web app, connect the extension, bring their own AI API key
(OpenAI, Anthropic, or Google AI), and type natural-language requests that the AI turns into an
on-page SEO check (Phase 1) run directly in the browser.

## Structure

- `backend/` — Node.js + TypeScript + Express + Prisma + PostgreSQL API and web UI (auth, BYOK
  API key storage, AI classification endpoint, results history).
- `extension/` — Manifest V3 Chrome extension (Vite + TypeScript): side panel UI, background
  service worker, content scripts for SEO scanning and web->extension auth handoff.

See `backend/README.md` and `extension/README.md` for setup instructions specific to each piece.

## Phase 1 scope

End-to-end **SEO check** flow only: on-page basics, structured data, link analysis, and Core Web
Vitals. Data scraping, PageSpeed Insights, and GEO/AI-search-visibility checks are planned for
later phases.
