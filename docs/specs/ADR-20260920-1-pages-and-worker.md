# ADR-20260920-1 — Pages and Worker

**Status:** accepted  
**Date:** 2026-09-20

## Context

Need a static public wiki and separate scheduled AI / fetch work without mixing deploy surfaces.

## Decision

- Public site: **Cloudflare Pages** + Astro Starlight (static).
- Jobs: **Worker + Workflows** (FetchNews, tagging, ingest, ProposeWiki, FactCheck).
- Do **not** migrate Pages to Workers Static Assets.
- **Workers paid plan** is required for cron / Workflows / AI / Vectorize.
- Target bindings: KV (live news & fact-check JSON), D1 (projects, events, documents), R2 (chunks), Vectorize, Workers AI.
- Root `wrangler.jsonc` stays Pages-only; jobs config intended at `worker/wrangler.jsonc`.

## Consequences

- GitHub Action schedules for news / fact-check moved to Worker Workflows; see [VER-20260920-1-operations.md](./VER-20260920-1-operations.md).
- Local `npm run fetch:news` may still write `src/data/news.json` for development.

## Alternatives considered

- Workers Static Assets for the whole site — rejected; Pages Git deploy already works; jobs stay separate.
- Keeping all schedules on GitHub Actions forever — rejected; product direction is Cloudflare-owned jobs.

## Related

- [ADR-20260920-2-project-timeline-rag.md](./ADR-20260920-2-project-timeline-rag.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
