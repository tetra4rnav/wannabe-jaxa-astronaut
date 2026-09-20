# Bounded contexts

## Contexts

| Context | Owns | Does not own |
| --- | --- | --- |
| **News** | Fetch, translate titles/summaries, classify to projects, news UI | Wiki Markdown, wiki citations |
| **Wiki** | Human Markdown, frontmatter `sources`, site navigation | Automatic body generation |
| **Corpus / RAG** | Ingest queue, chunks, vector index, retrieval for proposals and audits | Public chat answers |
| **Site (Pages)** | Static HTML, robots, public dumps until live APIs exist | Cron schedules, AI secrets |

## What may cross the boundary

| From → To | Allowed payload |
| --- | --- |
| News → Corpus | News as `kind=news` events (metadata + display text) |
| News → Wiki (via Proposal) | Proposal JSON: target page, headings, grounding URLs—not news body paste |
| Corpus → Proposal / Fact-check | Retrieved official/paper chunks with project + date filters |
| Wiki → Corpus | Page body and `sources` as seed chunks (`kind=wiki`) for audit support |
| Fact-check → Wiki | History display only; humans edit Markdown |

## Hard walls

- Journalism and Wikipedia stay out of **Wiki** and **Corpus** (except as a human lead to find an official URL).
- LLM output never becomes wiki Markdown without a human author.
- Project catalog grows only by human edit of the seed config.
