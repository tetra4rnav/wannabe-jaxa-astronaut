# REQ-20260922-2 — Graph RAG relation expansion

**Status:** accepted  
**Date:** 2026-09-22

## Context

Crewed timelines already store typed catalog relations and retrieve same-project chunks ([REQ-20260922-1](./REQ-20260922-1-crewed-timelines.md), [ADR-20260920-2](./ADR-20260920-2-project-timeline-rag.md)). Related programs (e.g. pressurized rover ↔ Artemis, commercial LEO → ISS) need one-hop corpus access without inventing Agency / Vehicle / Budget nodes or changing ingest.

## Requirements

1. **Expand before retrieve** — `retrievePriorChunks` must expand classified project slugs via `expandRetrievalSlugs` (maxHops = 1) before the Vectorize `project: $in` filter ([ADR-20260922-3](./ADR-20260922-3-graph-rag.md)).
2. **Walk rules** — Include self; outbound `depends_on` and outbound `successor`; undirected `partner`; do not follow inbound `depends_on` / `successor`; allow `retired` targets; never expand `unassigned`.
3. **Sort preference** — Prefer chunks whose `project` is in the original classified set over relation-only expansions (stable secondary order by score).
4. **No schema churn** — Do not change ingest, classify prompts, or Vectorize metadata keys for this REQ.
5. **Display-only fields** — Site fields `countries` / `kindJa` on catalog config must not be graph nodes, expand inputs, or Vectorize keys.

## Out of scope

- Ontology / catalog admin UI and D1 runtime cutover ([REQ-20260923-1](./REQ-20260923-1-admin-runtime-sot.md), [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11), [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12))
- Agency / Vehicle / Budget as first-class catalog nodes
- maxHops ≥ 2, edge weights, OWL reasoners
- Public chat over the corpus
- Embedding or classifying by `countries` / `kindJa`

## Related

- [ADR-20260922-3-graph-rag.md](./ADR-20260922-3-graph-rag.md)
- [ADR-20260922-2-crewed-project-relations.md](./ADR-20260922-2-crewed-project-relations.md)
- [ADR-20260920-2-project-timeline-rag.md](./ADR-20260920-2-project-timeline-rag.md)
- [DOMAIN.md](../DOMAIN.md)
- [GLOSSARY.md](../GLOSSARY.md)
