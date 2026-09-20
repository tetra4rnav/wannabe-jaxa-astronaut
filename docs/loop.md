# Four-stage loop (implementer spec)

The product loop is **news → propose → write → audit**. Static wiki pages stay on Cloudflare Pages. Collection, project tagging, embeddings, proposals, and audits belong on a Worker (see [architecture.md](./architecture.md)).

```text
AutoNews → TagProjectAndDate → ProjectTimeline
OfficialDocs / papers ─────────────┘
ProjectTimeline → chronological UI
ProjectTimeline → LLM wiki proposals → human writes wiki → LLM fact-check
```

## 1. Collect and display news

- Ingest official feeds and official X only (`src/config/feeds.ts`, `src/config/x-accounts.ts`).
- After fetch, classify each item against the **human-maintained project catalog**. Attach `occurred_at` (usually `publishedAt`). Items that cannot be classified stay `unassigned`; do not drop them silently.
- Display is not recency-only. News cards and project timelines mix the item with nearby official events on the **same** project.

Current code still writes `src/data/news.json` from GitHub Actions. Project tagging and timeline UI are not shipped yet.

## 2. LLM proposes wiki work

The model may emit **proposal records** (target docs id or “new page”, heading sketch, grounding URLs, position on the project timeline). Grounding must be **official chunks from the same project that occurred before the news**.

The model must **not**:

- Write or patch wiki Markdown
- Produce a finished news-article brief
- Invent a project name outside the catalog (it may propose “catalog needs a new project”)
- Cite a URL that fails `isOfficialUrl`

Proposals are not committed to git. Serving them is a later slice (`/proposals/`).

## 3. Humans write the wiki

Canonical pages are Markdown under `src/content/docs/`. Required frontmatter: `title`, `description`, `sources` (official URL array), `reviewed`. Full-text republication is forbidden. Authoring steps for people are on the on-site About page, not in this folder.

## 4. LLM audits; it does not rewrite

Fact-check output is **append-only history** (`src/data/fact-checks/<docs-id>.json` today). Verdicts: `pass` | `needs-update` | `failed`. The job must never overwrite wiki bodies. Humans apply fixes.

Current code runs this weekly via GitHub Actions and Cloudflare Workers AI. The same rule holds after the job moves to a Worker cron.

## Hard bans (all slices)

- Automatic wiki generation or rewrite
- Public chat over the corpus
- Wikipedia or journalism in the wiki RAG
- Auto-growing the project catalog
- Bulk NTRS PDF full-text extraction
