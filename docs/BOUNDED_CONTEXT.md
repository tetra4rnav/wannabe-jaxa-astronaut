# Bounded contexts

## Contexts

| Context | Owns | Does not own |
| --- | --- | --- |
| **News** | Fetch, translate titles/summaries, classify to in-scope projects, news UI | Wiki Markdown, wiki citations |
| **Knowledge base / RAG** | Ingest queue, chunks, vector index, retrieval for proposals and audits | Public chat answers; Graph RAG walk (deferred) |
| **Catalog** | Human project list, phases, roles, typed relations | Auto-growing nodes from LLM labels |
| **Wiki** | Human Markdown, frontmatter `sources` (deferred product) | Automatic body generation |
| **Site (Pages)** | Public HTML, robots, dumps | Cron schedules, AI secrets |

## What may cross the boundary

| From → To | Allowed payload |
| --- | --- |
| News → Knowledge base | Gated news as `kind=news` events + corpus chunks |
| News → Wiki (via Proposal) | Proposal JSON: target page, headings, grounding URLs—not news body paste |
| Knowledge base → Proposal / Fact-check | Retrieved official/paper chunks with project + date filters |
| Wiki → Knowledge base | Page body and `sources` as seed chunks (`kind=wiki`) for audit support |
| Fact-check → Wiki | History display only; humans edit Markdown |
| Catalog → Site | Project list, relations, timeline pages |

## Hard walls

- Journalism and Wikipedia stay out of **Wiki** and **Knowledge base** (except as a human lead to find an official URL).
- LLM output never becomes wiki Markdown without a human author.
- Project catalog grows only by human edit of the seed config.
- Theme titles are not catalog slugs.
