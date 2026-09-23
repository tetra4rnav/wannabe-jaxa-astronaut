# Domain model

English overview of the core entities. Terms in [GLOSSARY.md](./GLOSSARY.md). Boundaries in [BOUNDED_CONTEXT.md](./BOUNDED_CONTEXT.md).

## Entities

| Entity | Role |
| --- | --- |
| **Project** | Human-seeded crewed (or astronaut-adjacent) program in the catalog. In-scope roles are `seed` / `related`; `retired` slugs remain for old links. Catalog is the only allowed project namespace for classifiers. |
| **Relation** | Typed config edge between projects: `partner`, `depends_on`, `successor`. Displayed in UI; Graph RAG walk deferred. |
| **Event** | Something that happened on a project at `occurred_at` (news item, official page milestone, paper abstract, wiki page). |
| **News item** | Collected official feed / X post. Displayed in project timelines. LLM may mark `ingestAsSource` for knowledge-base eligibility. |
| **Ingest gate** | LLM judgment: news-like **and** trustworthy as official-adjacent RAG evidence. Fail → UI/events only; pass → D1/R2/Vectorize. |
| **Wiki page** | Human-written Markdown under `src/content/docs/` (deferred product surface). Official URLs only in `sources`. |
| **Proposal** | LLM suggestion to add or update a wiki page (deferred track). Not committed as wiki body. |
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

## Invariants

1. A proposal may only cite allowlisted official URLs that appear in retrieved chunks for the **same** project with `occurred_at` on or before the news date.
2. The LLM must not invent project slugs outside the catalog; new classifications are filtered to **in-scope** (`seed` / `related`) slugs (empty → `unassigned`).
3. News text is never copied into wiki Markdown as the authoritative body.
4. Fact-check jobs append history only; they never overwrite wiki files.
5. Every Workers AI **judgment** (ingest gate, fact-check, later proposals) must go through the shared Opik-traced helper; raw `AI.run` for judgments is forbidden.
6. Catalog nodes are programs with official proper names, not theme bundles.
