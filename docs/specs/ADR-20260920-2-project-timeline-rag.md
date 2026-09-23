# ADR-20260920-2 — Project-timeline RAG

**Status:** accepted  
**Date:** 2026-09-20

## Context

Retrieval for proposals and display must preserve program history, not a flat document bag.

## Decision

- Human **project catalog** ([`src/config/projects.ts`](../../src/config/projects.ts)); LLM must not invent slugs.
- **News classification and ingest gate** use Workers AI **TypeSafe Jev** (`typesafe/jev` via `runJevJudgment`): typed `noul` questions over item state (ingest gate + one question per catalog project except `unassigned`). A slug / `ingestAsSource` counts when `noul >= 0.55`; none → `unassigned`. No free-form JSON from the classifier.
- **FactCheck and ProposeWiki** stay on chat Workers AI (`runJudgment` / Llama-class models) because they need generated text.
- News enters Vectorize / R2 corpus **only** when `ingestAsSource` is true. All news still appear in KV UI and D1 `events` (kind `news`).
- D1 `projects`, `events`, `documents`; R2 for chunk text; Vectorize with indexed metadata `project`, `occurred_at`, `kind`.
- Embeddings: `@cf/qwen/qwen3-embedding-0.6b` (1024 dims).
- Retrieval for a news item: classified project(s) **plus 1-hop relation expansion** ([ADR-20260922-3](./ADR-20260922-3-graph-rag.md)), `occurred_at` on or before the news date, prefer `official` / `paper` (and gated `news`) for proposal grounding; prefer same-project matches when sorting.
- UI: `/projects/{slug}/` mixes official milestones and news; news cards show project badges and 「根拠候補」 when gated in; each item also has SSR detail at `/news/{id}/`.
- Unassigned news keeps an `unassigned` event.
- **Every LLM judgment** (news gate via Jev, fact-check, wiki proposals) is traced and structurally scored in **Opik** (`shared/opik/`).
- ProposeWiki retrieves Vectorize chunks for the classified project(s) and their 1-hop expansion with `occurred_at` on or before the news date (prefer `official` / `paper`), then writes proposal JSON to KV only — never wiki Markdown.

## Consequences

- Corpus seeds, wiki `sources`, NTRS **abstracts** only (no bulk PDF full text); gated news summaries/pages may join the corpus.
- Public chat over the corpus is forbidden.
- Production must set Opik Worker secrets; judgments fail-open without them but operators treat that as degraded.

## Alternatives considered

- Semantic search across all programs without project filter — rejected; breaks chronological meaning.
- Auto-growing the catalog from LLM labels — rejected; humans own the catalog.
- Keyword-only project tagging — rejected; replaced by LLM + catalog filter.
- Free-form Llama JSON for news gate + project tags — rejected for classify; replaced by Jev `noul` questions (FactCheck / ProposeWiki still use chat).
- Embedding all fetched news without a gate — rejected; noise and non-evidence posts must stay UI-only.

## Related

- [DOMAIN.md](../DOMAIN.md)
- [ADR-20260920-3-source-policy.md](./ADR-20260920-3-source-policy.md)
- [ADR-20260922-1-news-detail-and-jev.md](./ADR-20260922-1-news-detail-and-jev.md)
- [ADR-20260922-3-graph-rag.md](./ADR-20260922-3-graph-rag.md)
- [REQ-20260920-1-four-stage-loop.md](./REQ-20260920-1-four-stage-loop.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
