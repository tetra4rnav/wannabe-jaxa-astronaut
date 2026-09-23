# Developer docs

English domain model and numbered specs for [wannabe-jaxa-astronaut](https://github.com/tetra4rnav/wannabe-jaxa-astronaut). This folder is **not** the visitor wiki (`src/content/docs/`).

| Audience | Where |
| --- | --- |
| Visitors and wiki authors | [`README.md`](../README.md), [`README.en.md`](../README.en.md), on-site About |
| Implementers | This `docs/` folder |

## Domain

| Doc | Content |
| --- | --- |
| [DOMAIN.md](./DOMAIN.md) | Entities and invariants |
| [GLOSSARY.md](./GLOSSARY.md) | Ubiquitous language |
| [BOUNDED_CONTEXT.md](./BOUNDED_CONTEXT.md) | News vs Knowledge base vs Catalog vs Wiki vs Site |

## Specs

Filename: `{REQ|ADR|VER}-{YYYYMMDD}-{N}-{slug}.md`. Templates: [`specs/_templates/`](./specs/_templates/).

| ID | Title |
| --- | --- |
| [REQ-20260922-1](./specs/REQ-20260922-1-crewed-timelines.md) | Crewed timelines and knowledge base (**current product**) |
| [REQ-20260922-2](./specs/REQ-20260922-2-graph-rag.md) | Graph RAG relation expansion |
| [REQ-20260920-1](./specs/REQ-20260920-1-four-stage-loop.md) | Four-stage wiki loop (superseded as primary product) |
| [REQ-20260920-2](./specs/REQ-20260920-2-news-and-wiki.md) | News and wiki relationship |
| [ADR-20260922-2](./specs/ADR-20260922-2-crewed-project-relations.md) | Crewed catalog and relations |
| [ADR-20260922-3](./specs/ADR-20260922-3-graph-rag.md) | Graph RAG (relation expansion) |
| [ADR-20260920-1](./specs/ADR-20260920-1-pages-and-worker.md) | Pages and Worker |
| [ADR-20260920-2](./specs/ADR-20260920-2-project-timeline-rag.md) | Project-timeline RAG |
| [ADR-20260920-3](./specs/ADR-20260920-3-source-policy.md) | Source policy (lists in `src/config/`) |
| [ADR-20260920-4](./specs/ADR-20260920-4-astro-shadcn-ui.md) | Astro + shadcn UI |
| [ADR-20260922-1](./specs/ADR-20260922-1-news-detail-and-jev.md) | News detail and TypeSafe Jev |
| [VER-20260920-1](./specs/VER-20260920-1-operations.md) | Operations runbook |

**REQ** = behavior. **ADR** = architecture decision. **VER** = verification / operations.

Visitor READMEs must not grow command tables, deploy steps, secret names, or schemas.
