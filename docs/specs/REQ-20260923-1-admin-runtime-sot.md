# REQ-20260923-1 — Admin catalog and D1 runtime stores

**Status:** accepted  
**Date:** 2026-09-23

## Context

Operators need to maintain the crewed project catalog without redeploying, and news / proposals should stop relying on whole-file KV blobs as the runtime source of truth. Product requirements for timelines and Graph RAG remain ([REQ-20260922-1](./REQ-20260922-1-crewed-timelines.md), [REQ-20260922-2](./REQ-20260922-2-graph-rag.md)). Storage and admin architecture: [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md). Implementation: [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12). Specs-only tracking: [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11).

## Requirements

1. **Catalog SoT** — Runtime catalog (projects, roles, phases, relations, display `countries` / `kindJa`) is read from **D1**, with TypeScript config as seed / empty-D1 fallback only.
2. **Admin catalog** — An `/admin` surface protected by Cloudflare Access lets humans create / update / retire catalog projects and typed relations without a code deploy. Changes are visible to Site and to classify / Graph expand after write.
3. **Slug safety** — Admin must not casually rename or hard-delete slugs that may own Vectorize chunks; prefer `retired`. Any rename requires an explicit migration path documented in VER.
4. **News feed SoT** — FetchNews and Site / Functions treat **D1 `news_items`** as the runtime feed store. KV `news:file` may remain only as migration fallback.
5. **Proposals SoT** — ProposeWiki and proposals JSON endpoints treat **D1 `proposals`** as the runtime store. KV `proposals:file` may remain only as migration fallback.
6. **Feed ≠ RAG** — Gated ingest continues to write `documents` / `events` (+ R2 / Vectorize). Feed rows and timeline events stay separate tables / concerns.
7. **Display-only fields** — `countries` / `kindJa` remain editable for Site display and must not enter classify, corpus ingest, Vectorize filters, or Graph expand inputs.
8. **Ontology limit** — Do not introduce Agency / Vehicle / Budget as first-class catalog nodes or Vectorize keys in this REQ.

## Acceptance (implementation [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12))

- [ ] D1 migration: widened `projects`, `project_relations`, `news_items`, `proposals`
- [ ] Catalog seed bootstrap from TypeScript; loader used by Site / classify / `expandRetrievalSlugs`
- [ ] Cloudflare Access on `/admin/*` + catalog CRUD API
- [ ] FetchNews writes `news_items`; Site news UI reads D1 (KV fallback only if documented)
- [ ] ProposeWiki writes `proposals`; `/proposals` reads D1
- [ ] `events` / Vectorize path for gated news unchanged in semantics
- [ ] VER runbook for Access, bootstrap, and KV→D1 cutover

## Out of scope

- Public visitor chat over the corpus
- OWL / ontology reasoners
- Agency / Vehicle / Budget first-class catalogization
- Mandatory fact-check migration to D1 (allowed later)
- Applying Cloudflare Access policies in production (procedure only in VER; operators apply)
- This REQ’s documentation work itself (done under [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11))

## Related

- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
- [VER-20260923-1-admin-and-d1.md](./VER-20260923-1-admin-and-d1.md)
- [ADR-20260922-2-crewed-project-relations.md](./ADR-20260922-2-crewed-project-relations.md)
- [ADR-20260922-3-graph-rag.md](./ADR-20260922-3-graph-rag.md)
- [DOMAIN.md](../DOMAIN.md)
- [BOUNDED_CONTEXT.md](../BOUNDED_CONTEXT.md)
