# REQ-20260922-1 — Crewed timelines and knowledge base

**Status:** accepted  
**Date:** 2026-09-22

## Context

Visitors need an unofficial site that places current and planned national and commercial **crewed** spaceflight programs on timelines from official sources only, and accumulates those sources into a project-scoped knowledge base (RAG). Wiki authoring is a future track.

## Requirements

1. **Knowledge base** — Official feed / X items that pass the ingest gate, plus human-curated official HTML seeds (including budget pages attached to the nearest seed project), enter R2 / Vectorize under catalog projects.
2. **Timelines** — Visitors read events chronologically per in-scope project, with typed relations (`partner` / `depends_on` / `successor`) shown between catalog projects.
3. **Catalog rules** — Only ongoing or planned programs with official proper names; crewed flight or astronaut-adjacent support programs; related nodes follow Japan participation **or** seed dependency / partnership / succession ([ADR-20260922-2](./ADR-20260922-2-crewed-project-relations.md)).
4. **Fresh collection** — Existing FetchNews cadence (every 6 hours) continues; gated items join the knowledge base.
5. **Historical presses** — Product requirement: official past press / news archives belong in the knowledge base. **Implementation of year-by-year archive crawlers is out of this REQ’s delivery**; current list scrapers cover recent items only.
6. **Surfaces** — Home and nav lead with news and project timelines. Wiki pages may remain at existing URLs but are not the primary product.

## Out of scope

- Ontology / catalog admin UI and D1 runtime SoT ([REQ-20260923-1](./REQ-20260923-1-admin-runtime-sot.md), specs [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11), impl [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12); Graph RAG walk is [REQ-20260922-2](./REQ-20260922-2-graph-rag.md))
- Public in-site chat over the corpus
- Automatic wiki generation or rewrite
- Bulk PDF full-text extraction
- Custom budget aggregation tables
- Theme-only catalog nodes

## Related

- [ADR-20260922-2-crewed-project-relations.md](./ADR-20260922-2-crewed-project-relations.md)
- [ADR-20260922-3-graph-rag.md](./ADR-20260922-3-graph-rag.md)
- [REQ-20260922-2-graph-rag.md](./REQ-20260922-2-graph-rag.md)
- [ADR-20260920-2-project-timeline-rag.md](./ADR-20260920-2-project-timeline-rag.md)
- [ADR-20260920-3-source-policy.md](./ADR-20260920-3-source-policy.md)
- [DOMAIN.md](../DOMAIN.md)
