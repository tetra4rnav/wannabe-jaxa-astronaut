# ADR-20260920-1 — Pages and Worker

**Status:** accepted  
**Date:** 2026-09-20

## Context

Need a public wiki with live news and separate scheduled AI / fetch work without mixing deploy surfaces.

## Decision

- Public site: Astro SSR via `@astrojs/cloudflare` (Worker entry + static assets). Details: [ADR-20260920-5](./ADR-20260920-5-astro-ssr-pages.md). UI stack: [ADR-20260920-4](./ADR-20260920-4-astro-shadcn-ui.md).
- Jobs: **Worker + Workflows** (FetchNews, tagging, ingest, ProposeWiki, FactCheck) in `worker/wrangler.jsonc` — separate from the public app Worker.
- Do **not** merge the jobs Worker into the public app, and do **not** treat a static-only Workers Static Assets site as a substitute for the former Pages wiki without SSR.
- **Workers paid plan** is required for cron / Workflows / AI / Vectorize.
- Target bindings: KV (transitional news / fact-check / proposals JSON until D1 cutover), D1 (projects, relations, news feed, proposals, documents, events), R2 (chunks), Vectorize, Workers AI. Runtime SoT for catalog + news feed + proposals: [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md).
- Root `wrangler.jsonc` configures the public Astro app (bindings + assets); jobs stay under `worker/wrangler.jsonc`.

## Consequences

- GitHub Action schedules for news / fact-check moved to Worker Workflows; see [VER-20260920-1-operations.md](./VER-20260920-1-operations.md).
- Local `npm run fetch:news` may still write `src/data/news.json` for development fallback when KV is empty.

## Alternatives considered

- One Worker for both public UI and cron jobs — rejected; keep deploy and blast radius separate.
- Keeping all schedules on GitHub Actions forever — rejected; product direction is Cloudflare-owned jobs.

## Related

- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
- [ADR-20260920-2-project-timeline-rag.md](./ADR-20260920-2-project-timeline-rag.md)
- [ADR-20260920-5-astro-ssr-pages.md](./ADR-20260920-5-astro-ssr-pages.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
