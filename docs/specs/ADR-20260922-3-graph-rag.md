# ADR-20260922-3 — Graph RAG (relation expansion)

**Status:** accepted  
**Date:** 2026-09-22

## Context

Retrieval was same-project only ([ADR-20260920-2](./ADR-20260920-2-project-timeline-rag.md)). Catalog relations (`partner` / `depends_on` / `successor`) existed for UI ([ADR-20260922-2](./ADR-20260922-2-crewed-project-relations.md)) but did not widen the Vectorize filter. Issue [#10](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/10) asked whether Agency / Vehicle / Budget should be first-class and how to walk relations before retrieve.

## Decision

### Ontology (first-class vs not)

| Concept | Status |
| --- | --- |
| **Project** | Sole corpus owner and Vectorize `project` key |
| **Relation** | Catalog edges used for **1-hop slug expansion** before retrieve |
| **Agency / Vehicle / Budget line** | **Not** first-class nodes (classification explosion; budget text already attaches to the nearest seed) |
| **`countries` / `kindJa`** | **Planned display-only** Site table fields — not graph nodes, not Vectorize keys, not expand inputs (must not enter RAG) |

No OWL, no reasoner, no ontology admin UI in this decision. Future first-class overlays (if any) keep chunk ownership on Project and land under issue [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11).

### Retrieval walk (`expandRetrievalSlugs`)

```text
classified project slugs
  → expandViaRelations (maxHops=1)
  → retrievePriorChunks(project: $in expanded, occurred_at ≤ date, kind prefer official/paper)
```

Rules (asymmetric, hop depth 1):

1. Always include the classified slug itself (except `unassigned`, which is never expanded or retained).
2. Outbound `depends_on` → include the target (parent).
3. Outbound `successor` → include the target (predecessor).
4. `partner` is undirected (outbound and inbound partner edges).
5. Do **not** follow inbound `depends_on` or inbound `successor` at hop 1.
6. Targets may be `retired` (history). Never walk into or emit `unassigned`.

Ingest, classify prompts, and Vectorize schema stay unchanged. Same-project matches are sorted slightly ahead of relation-expanded matches after retrieve.

## Consequences

- Proposal / audit grounding may cite chunks from the **classified set or its 1-hop expansion**, still date-filtered.
- Parents do not automatically pull dependent children; successors do not pull later programs.
- Display fields (`countries` / `kindJa`) can ship on the Site without changing RAG behavior.

## Alternatives considered

- Agency / Vehicle / Budget as graph nodes — rejected for now; revisit only with a separate ADR and admin track (#11).
- maxHops ≥ 2 or learned edge weights — deferred; noise risk.
- Symmetric walk of all relation types — rejected; would flood parents with every child and flood ISS with every commercial LEO successor.

## Related

- [REQ-20260922-2-graph-rag.md](./REQ-20260922-2-graph-rag.md)
- [ADR-20260922-2-crewed-project-relations.md](./ADR-20260922-2-crewed-project-relations.md)
- [ADR-20260920-2-project-timeline-rag.md](./ADR-20260920-2-project-timeline-rag.md)
- [DOMAIN.md](../DOMAIN.md)
- [GLOSSARY.md](../GLOSSARY.md)
