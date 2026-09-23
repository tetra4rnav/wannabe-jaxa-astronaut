# ADR-20260922-2 — Crewed project catalog and relations

**Status:** accepted  
**Date:** 2026-09-22

## Context

The product focus moves from a study wiki loop to an official-only crewed spaceflight knowledge base and project timelines. Catalog membership and cross-project links must be reproducible. Graph traversal search and ontology tooling are deferred ([issue #10](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/10)).

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

### Relations (config only this branch)

Typed edges on [`src/config/projects.ts`](../../src/config/projects.ts): `partner`, `depends_on`, `successor`. Displayed in UI. Not used for retrieval yet.

### Knowledge base

R2 chunks + Vectorize remain the corpus ([ADR-20260920-2](./ADR-20260920-2-project-timeline-rag.md)). Source policy stays official-only ([ADR-20260920-3](./ADR-20260920-3-source-policy.md)). Budget figures enter only as official HTML page text attached to the nearest seed project (`documents.url` is unique). No custom budget tables. No public chat. No bulk PDF full text.

### Vocabulary now vs later

- **Now:** Project, phase (`ongoing` / `planned`), role (`seed` / `related` / `retired`), relation types, event kinds.
- **Later (issue #10):** Whether agency, vehicle, and budget line become first-class; Graph RAG that walks relations before retrieving chunks.

### Ontology tooling

No admin UI, OWL, or reasoner in this branch.

## Consequences

- Classifiers ask Jev questions only for in-scope (seed + related) slugs.
- Historical news tagged to retired slugs still resolve; new items do not receive those tags.
- Wiki Markdown and ProposeWiki jobs remain; visitor nav no longer centers Wiki.

## Alternatives considered

- Cap related-node count — rejected; membership is rule-based, not quota-based.
- Theme nodes for “lunar society” — rejected; project-unit only.
- Implement Graph RAG in the same branch — deferred to issue #10 after catalog rules stabilize.

## Related

- [REQ-20260922-1-crewed-timelines.md](./REQ-20260922-1-crewed-timelines.md)
- [DOMAIN.md](../DOMAIN.md)
- [GLOSSARY.md](../GLOSSARY.md)
