# ADR-20260920-5 — Public site Astro SSR

**Status:** accepted  
**Date:** 2026-09-20

## Context

Live news lives in KV (`STORE`). A static Pages build could only serve bundled `src/data/news.json` or a separate Pages Function for `/news.json`, so the HTML shell still depended on a client `fetch`. Homepages and filters needed the first paint to include current news without a second hop. `@astrojs/cloudflare` (Astro 7) emits a Worker entry plus `dist/client` assets, which is the supported path for bindings + SSR.

## Decision

- Public site: **Astro `output: 'server'`** with `@astrojs/cloudflare`. Deploy with `wrangler deploy` (`main` → `dist/server/entry.mjs`, `assets.directory` → `dist/client`). Same project name / KV `STORE` / D1 `DB` / custom domain surface as before.
- News routes (`/`, `/news/`, `/news.json`) read KV at request time (fallback: bundled `src/data/news.json`).
- Wiki under `src/content/docs/` stays Git-canon and uses `prerender = true`.
- Jobs remain on the separate Worker (`worker/wrangler.jsonc`). Do **not** merge jobs into the public Worker.
- `/news.json` is an Astro endpoint only (no duplicate `functions/news.json.ts`).
- Classic static-only Pages (`pages_build_output_dir` without a server entry) is superseded for this app; this is not a “fold everything into Workers Static Assets” migration — it is the Astro SSR adapter’s required shape.

## Consequences

- Local/dev without KV still renders news from the repo JSON.
- Remaining `functions/` handlers (`/news.md`, proposals, fact-checks, project timelines) stay until migrated to Astro routes; prefer not to add new Pages Functions for news.
- Operator docs: [VER-20260920-1-operations.md](./VER-20260920-1-operations.md).

## Alternatives considered

- Keep static HTML + client fetch only — rejected; first paint lagged and duplicated the Function path.
- Merge jobs Worker into the public app Worker — rejected; cron / Workflows stay isolated.

## Related

- [ADR-20260920-1-pages-and-worker.md](./ADR-20260920-1-pages-and-worker.md)
- [ADR-20260920-4-astro-shadcn-ui.md](./ADR-20260920-4-astro-shadcn-ui.md)
