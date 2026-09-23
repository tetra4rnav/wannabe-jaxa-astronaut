# ADR-20260922-1 — News detail pages and Jev classification

**Status:** accepted  
**Date:** 2026-09-22

## Context

Feed cards alone made deep links and shareable URLs awkward. News project tagging previously asked a chat model for free-form JSON, which is brittle for a closed catalog of yes/no decisions.

## Decision

- Public SSR route **`/news/[id]/`** ([`src/pages/news/[id].astro`](../../src/pages/news/[id].astro)): load news from KV / bundled JSON, render one item (404 if missing). Cards link to the detail URL.
- FetchNews **ingest gate + project assignment** use Workers AI **`typesafe/jev`** through `runJevJudgment` ([`shared/opik/run-judgment.ts`](../../shared/opik/run-judgment.ts), [`shared/timeline/llm-classify-news.ts`](../../shared/timeline/llm-classify-news.ts)). Map `noul >= 0.55` to true / assigned; Opik tag `judgment:news-ingest-gate`.
- Optional Worker env **`CF_JEV_MODEL`** overrides the Jev model id; default remains `typesafe/jev`. Chat judgments keep **`CF_AI_MODEL`**.
- FactCheck and ProposeWiki remain on `runJudgment` (chat / Llama-class).

## Consequences

- Offline Opik eval fixtures include `mapJevNewsAnswers` cases under [`scripts/opik/fixtures/jev-news-map.json`](../../scripts/opik/fixtures/jev-news-map.json).
- Timeline RAG policy for gated corpus membership is unchanged; only the classify engine changes. See [ADR-20260920-2](./ADR-20260920-2-project-timeline-rag.md).

## Alternatives considered

- Client-only detail drawers without a stable URL — rejected; need shareable `/news/{id}/`.
- Keep Llama JSON for news classify — rejected; Jev fits structured noul questions better.

## Related

- [ADR-20260920-2-project-timeline-rag.md](./ADR-20260920-2-project-timeline-rag.md)
- [ADR-20260920-5-astro-ssr-pages.md](./ADR-20260920-5-astro-ssr-pages.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
