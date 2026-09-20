# Project-timeline RAG

RAG is **not a bag of documents**. Every retrieved chunk is an event on a **named project**, with a date. News is shown and proposed against **earlier official material on that same project**.

Public chat is out of scope. PDF full text is out of scope.

## Project catalog (human seed)

LLM classifiers must not invent program names. If a story needs a project that is missing, the proposal says “catalog needs a new project”; a person adds it.

Intended config: [`src/config/projects.ts`](../src/config/projects.ts) (not landed yet). Seed examples:

- ISS / きぼう
- HTV / HTV-X
- Artemis
- Gateway
- Pressurized rover (有人与圧ローバ)
- Astronaut selection (宇宙飛行士選抜)
- Basic Plan on Space Policy (宇宙基本計画)
- H3
- Commercial LEO

Optional `wiki_docs_id` links a catalog row to a Starlight page.

## D1

`projects`

| Column | Notes |
| --- | --- |
| slug | Catalog key |
| name_ja | Display name |
| start_date | Inclusive |
| end_date | `null` while ongoing |
| wiki_docs_id | Optional Starlight id |

`events`

| Column | Notes |
| --- | --- |
| project_id | FK |
| kind | `news` / `official` / `paper` / `wiki` |
| occurred_at | News: item `publishedAt`. Official/paper: page or bibliographic date |
| url, title | Required |
| news_id / doc_id | Whichever applies |

`documents` — ingest queue: `url`, `content_hash`, `status`.

An item may belong to **multiple** projects (multiple `events` rows). Unclassifiable news still gets an event with project `unassigned`.

## R2 and Vectorize

- R2 stores chunk text.
- Vectorize metadata (indexed): `project`, `occurred_at`, `kind`.
- Embedding model: `@cf/qwen/qwen3-embedding-0.6b`, 1024 dimensions.

## Retrieval rule

For a news item, prefer chunks where:

1. `project` matches (or is in the item’s project set)
2. `occurred_at` is **on or before** the news date
3. `kind` is `official` or `paper` (wiki chunks may support audit, not proposal grounding)

Do not retrieve “whatever is semantically close” across unrelated programs. Timeline UI lists official milestones and news mixed, oldest or newest first, for one slug: `/projects/{slug}/` (or `/timeline/?project=`). News listing keeps region filters and adds a project filter.

News cards show project badges and a short “around this time” strip for nearby official events on that project.

## Ingest (later slice)

`IngestCorpus` (intended `0 */12 * * *`): corpus seeds tagged with projects, wiki `sources`, NTRS and JAXA **abstracts**. Reject URLs that fail [`isOfficialUrl`](../src/config/official-domains.ts) before write. See [sources.md](./sources.md).
