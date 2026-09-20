# Architecture

The public site is a **static Astro Starlight wiki on Cloudflare Pages**. Collection, project linking, embeddings, proposals, and audits run on a **Worker** (Workflows where a multi-step job is needed). Do **not** migrate Pages to Workers Static Assets.

**Workers paid plan is required** for scheduled jobs, Workflows, and the AI / Vectorize path.

## Split of duties

| Surface | Owns |
| --- | --- |
| Cloudflare Pages | Wiki HTML, `/news/` UI, static `/corpus/*.jsonl` until jobs stop committing git, `robots.txt` |
| Worker + Workflows | FetchNews, project tagging, IngestCorpus, ProposeWiki, FactCheck |
| Git | Wiki Markdown (`src/content/docs/`), project catalog seed, allowlists |

Root [`wrangler.jsonc`](../wrangler.jsonc) is the Pages project (`pages_build_output_dir: ./dist`). Worker job config will live separately (intended: `worker/wrangler.jsonc`) so Pages and jobs do not share one accidental binding set.

## Bindings (target)

| Binding | Role |
| --- | --- |
| KV | News payload and fact-check JSON served without a git commit (`/news.json`, `/news.md`, `/fact-checks/{id}.json`) |
| D1 | `projects`, `events`, ingest `documents` queue |
| R2 | Chunk bodies |
| Vectorize | Embeddings; metadata `project`, `occurred_at`, `kind` must be indexed |
| Workers AI | Classify, propose, fact-check; embeddings `@cf/qwen/qwen3-embedding-0.6b` (1024 dims) |

`nodejs_compat` and observability belong on the jobs Worker.

## Current vs next

Today, GitHub Actions still fetch news (`0 */6 * * *`) and fact-check (`0 3 * * 1`), then commit JSON into this repo. Slice 2 moves those crons to the Worker and deletes the GitHub `schedule` workflows. Local `npm run fetch:news` keeps writing `src/data/news.json` for development.

There is **no public in-site chat**. `/corpus/*.jsonl` remains a dump for external indexers until Vectorize ingest replaces that role for internal retrieval.

## Site URL

Production: https://wannabe-jaxa-astronaut.pages.dev  
GitHub: https://github.com/tetra4rnav/wannabe-jaxa-astronaut

The old `*.workers.dev` Worker was removed. Deploy is Pages Git integration only (see [operations.md](./operations.md)).
