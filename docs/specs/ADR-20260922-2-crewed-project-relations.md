# ADR-20260922-2 — Crewed project catalog and relations

**Status:** accepted  
**Date:** 2026-09-22

## Context

The product focus moves from a study wiki loop to an official-only crewed spaceflight knowledge base and project timelines. Catalog membership and cross-project links must be reproducible. Graph traversal for retrieval is specified in [ADR-20260922-3](./ADR-20260922-3-graph-rag.md) (issue [#10](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/10)); ontology admin UI remains deferred ([#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11)).

## Decision

### Catalog membership

A catalog node must be **ongoing or planned**, named as a **specific program** in allowlisted official sources, and one of:

1. **Crewed flight** itself (ISS / Kibo, Artemis, …), or
2. An **astronaut-adjacent program** that supports crew activity (stay, mobility, habitation) under an official program name — never a theme slug such as “lunar society”.

### Roles

- **seed** — Japan participates (hardware, crew, agreement).
- **related** — Official Japan participation **or** a seed program depends on / partners with / is succeeded by it.
- **retired** — Kept for slug resolution and `/projects/{slug}/` pages; not listed on home or project index; not offered as a new classification target.

Company, vehicle, or station splits happen only when the same class of official source names that proper noun for Japan’s role or a seed dependency.

### Relations (config)

Typed edges `partner`, `depends_on`, `successor`. Membership and edge **types** are owned here. Runtime storage moves to D1 under [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md) (TypeScript remains seed / fallback). Displayed in UI. Retrieval walks these edges via [ADR-20260922-3](./ADR-20260922-3-graph-rag.md) (`expandRetrievalSlugs`).

### Knowledge base

R2 chunks + Vectorize remain the corpus ([ADR-20260920-2](./ADR-20260920-2-project-timeline-rag.md)). Source policy stays official-only ([ADR-20260920-3](./ADR-20260920-3-source-policy.md)). Budget figures enter only as official HTML page text attached to the nearest seed project (`documents.url` is unique). No custom budget tables. No public chat. No bulk PDF full text.

### Vocabulary now vs later

- **Now:** Project, phase (`ongoing` / `planned`), role (`seed` / `related` / `retired`), relation types, event kinds; Graph RAG 1-hop expand ([ADR-20260922-3](./ADR-20260922-3-graph-rag.md)); display-only `countries` / `kindJa`.
- **Not first-class:** Agency, vehicle, budget line.
- **Admin / D1 SoT:** [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md), [REQ-20260923-1](./REQ-20260923-1-admin-runtime-sot.md); impl [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12). Specs [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11).

### Ontology tooling

No OWL or reasoner. Catalog admin UI is specified in [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md) / [REQ-20260923-1](./REQ-20260923-1-admin-runtime-sot.md) and implemented in [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12).

## Consequences

- Classifiers ask Jev questions only for in-scope (seed + related) slugs.
- Historical news tagged to retired slugs still resolve; new items do not receive those tags.
- Wiki Markdown and ProposeWiki jobs remain; visitor nav no longer centers Wiki.

## Alternatives considered

- Cap related-node count — rejected; membership is rule-based, not quota-based.
- Theme nodes for “lunar society” — rejected; project-unit only.
- Implement Graph RAG in the same decision as catalog rules — split: catalog here, retrieve walk in ADR-20260922-3.

## Related

- [REQ-20260922-1-crewed-timelines.md](./REQ-20260922-1-crewed-timelines.md)
- [ADR-20260922-3-graph-rag.md](./ADR-20260922-3-graph-rag.md)
- [REQ-20260922-2-graph-rag.md](./REQ-20260922-2-graph-rag.md)
- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
- [DOMAIN.md](../DOMAIN.md)
- [GLOSSARY.md](../GLOSSARY.md)
