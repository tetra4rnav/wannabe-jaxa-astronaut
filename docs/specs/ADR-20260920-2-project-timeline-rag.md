# ADR-20260920-2 — Project-timeline RAG

**Status:** accepted  
**Date:** 2026-09-20

## Context

Retrieval for proposals and display must preserve program history, not a flat document bag.

## Decision

- Human **project catalog** (intended `src/config/projects.ts`); LLM must not invent slugs.
- D1 `projects`, `events`, `documents`; R2 for chunk text; Vectorize with indexed metadata `project`, `occurred_at`, `kind`.
- Embeddings: `@cf/qwen/qwen3-embedding-0.6b` (1024 dims).
- Retrieval for a news item: same project(s), `occurred_at` on or before the news date, prefer `official` / `paper` for proposal grounding.
- UI: `/projects/{slug}/` (or timeline query) mixes official milestones and news; news cards show project badges and a short “around this time” strip.
- Unassigned news keeps an `unassigned` event.

## Consequences

- Ingest slice tags corpus seeds, wiki `sources`, NTRS/JAXA **abstracts** only (no bulk PDF full text).
- Public chat over the corpus is forbidden.

## Alternatives considered

- Semantic search across all programs without project filter — rejected; breaks chronological meaning.
- Auto-growing the catalog from LLM labels — rejected; humans own the catalog.

## Related

- [DOMAIN.md](../DOMAIN.md)
- [ADR-20260920-3-source-policy.md](./ADR-20260920-3-source-policy.md)
- [REQ-20260920-1-four-stage-loop.md](./REQ-20260920-1-four-stage-loop.md)
