# Domain model

English overview of the core entities. Terms in [GLOSSARY.md](./GLOSSARY.md). Boundaries in [BOUNDED_CONTEXT.md](./BOUNDED_CONTEXT.md).

## Entities

| Entity | Role |
| --- | --- |
| **Project** | Human-owned crewed (or astronaut-adjacent) program in the catalog. Runtime SoT is D1 ([ADR-20260923-1](./specs/ADR-20260923-1-runtime-d1-sot.md)); TypeScript is seed / fallback. In-scope roles are `seed` / `related`; `retired` slugs remain for old links. Catalog is the only allowed project namespace for classifiers. Sole corpus / Vectorize owner. |
| **Relation** | Typed config edge between projects: `partner`, `depends_on`, `successor`. Stored with the catalog in D1. Displayed in UI and used for 1-hop Graph RAG slug expansion ([ADR-20260922-3](./specs/ADR-20260922-3-graph-rag.md)). |
| **Event** | Something that happened on a project at `occurred_at` (news item, official page milestone, paper abstract, wiki page). RAG / timeline rows in D1 `events` — not the same as the news feed table. |
| **News item** | Collected official feed / X post. Feed SoT is D1 `news_items` (KV transitional). Also appears on timelines when classified. LLM may mark `ingestAsSource` for knowledge-base eligibility. |
| **Ingest gate** | LLM judgment: news-like **and** trustworthy as official-adjacent RAG evidence. Fail → UI/events only; pass → D1/R2/Vectorize. |
| **Wiki page** | Human-written Markdown under `src/content/docs/` (deferred product surface). Official URLs only in `sources`. |
| **Proposal** | LLM suggestion to add or update a wiki page (deferred track). Runtime SoT is D1 `proposals` (KV transitional). Not committed as wiki body. |
| **Fact-check entry** | Append-only audit of a wiki page against its sources. Does not rewrite the page. |
| **Document (ingest)** | Queued official URL (or gated news) for corpus ingest (hash, status). Chunk text lives in object storage after ingest. |

## Relationships

```text
Project 1──* Event
Project ──(relations)──* Project
News item ──(classified as)──* Event (kind=news)
Official / paper URL ──* Event (kind=official|paper)
Wiki page ──(optional)── Project via wiki_docs_id
News item ──may trigger── Proposal ──targets── Wiki page (deferred)
Wiki page ──has──* Fact-check entry
```

## Display-only catalog fields (Site)

Optional catalog fields `countries` and `kindJa` are **Site display only** (project table / detail). They are not graph nodes, not expand inputs, and must not enter classify / corpus / Vectorize / ingest gate. Agency, vehicle, and budget line are likewise **not** first-class catalog entities.

## Invariants

1. A proposal may only cite allowlisted official URLs that appear in retrieved chunks for the **classified project(s) or their relation-expanded set** (maxHops = 1) with `occurred_at` on or before the news date.
2. The LLM must not invent project slugs outside the catalog; new classifications are filtered to **in-scope** (`seed` / `related`) slugs (empty → `unassigned`).
3. News text is never copied into wiki Markdown as the authoritative body.
4. Fact-check jobs append history only; they never overwrite wiki files.
5. Every Workers AI **judgment** (ingest gate, fact-check, later proposals) must go through the shared Opik-traced helper; raw `AI.run` for judgments is forbidden.
6. Catalog nodes are programs with official proper names, not theme bundles.
7. `unassigned` is never retained or walked by Graph RAG expansion.
8. Runtime catalog / news feed / proposals prefer D1 over TypeScript or KV blobs ([ADR-20260923-1](./specs/ADR-20260923-1-runtime-d1-sot.md)); Vectorize `project` keys remain catalog slugs only.
