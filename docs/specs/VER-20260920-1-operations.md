# VER-20260920-1 — Operations

**Status:** current  
**Date:** 2026-09-20

## Scope

Operator runbook for local commands, Pages deploy, secrets, and schedules. Visitor READMEs must not grow these tables.

## Steps / checklist

### Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server (`astro dev`; agents: `astro dev --background`) |
| `npm run build` | Corpus generation + production build → `dist/` |
| `npm run fetch:news` | RSS / HTML / X → `src/data/news.json` (local fallback) |
| `npm run wiki:audit` | Official-domain audit of wiki Markdown (also runs in `prebuild`) |
| `npm run corpus:build` | `/corpus/*.jsonl` generation |
| `npm run fact-check` | Local append of LLM fact-check history under `src/data/fact-checks/` (optional) |
| `npm run deploy` | Optional local build + Pages Direct Upload; normal path is Git push |
| `npm run deploy:jobs` | Deploy Worker + Workflows (`worker/wrangler.jsonc`) |
| `npm run opik:eval` | Offline fixture contracts for LLM judgments (+ optional Opik Cloud suite trace) |

`fetch:feeds` and `fetch:x` alias `fetch:news`.

### Pages Git deploy

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (runs `prebuild`: `wiki:audit` then `corpus:build`) |
| Build output | `dist` |
| Production branch | `main` |

Emergency: `npx wrangler pages deploy ./dist --project-name=wannabe-jaxa-astronaut`.

### Custom domain

| Item | Value |
| --- | --- |
| Canonical host | `https://wannabe-jaxa-astronaut.diaphana.io` |
| Pages project | `wannabe-jaxa-astronaut` |
| Alias | `wannabe-jaxa-astronaut.pages.dev` (kept; no forced redirect) |
| Zone | `diaphana.io` (same Cloudflare account) |
| DNS | Proxied CNAME `wannabe-jaxa-astronaut` → `wannabe-jaxa-astronaut.pages.dev` (required if Pages reports “CNAME record not set”) |

Attach via Pages Custom domains (or `POST .../pages/projects/wannabe-jaxa-astronaut/domains`). Wait until domain status is **Active**. Astro `site`, visitor READMEs, and corpus `SITE` use the canonical host. Jobs Worker remains on `*.workers.dev`.

Source-domain audit runs on every Pages / local build via `prebuild`. There is no GitHub Actions CI workflow; PR / production deploy gates on the Cloudflare Pages build check. Scheduled news / fact-check jobs live on the Worker (not GitHub Actions).

Do **not** enable Bot Fight Mode or AI crawler blocking; [`public/robots.txt`](../../public/robots.txt) is allow-all.

Pages Functions (`functions/`) serve live `/news.json`, `/news.md`, `/fact-checks/:id.json`, and `/proposals.json` (plus `/proposals/:id.json`) from KV binding `STORE`. Project timelines use D1 binding `DB` via `/projects/catalog.json` and `/projects/:slug/timeline.json`. When KV is empty, news falls back to GitHub raw `src/data/news.json`.

Bind on the Pages project: KV `STORE` → `wannabe-jaxa-store`, D1 `DB` → `wannabe-jaxa-db`.

### Jobs Worker

| Item | Value |
| --- | --- |
| Config | [`worker/wrangler.jsonc`](../../worker/wrangler.jsonc) |
| Name | `wannabe-jaxa-jobs` |
| Deploy | `npm run deploy:jobs` |
| Manual run | `POST /run` with `Authorization: Bearer $RUN_SECRET` and JSON `{"job":"fetch-news"|"fact-check"|"ingest-corpus"|"propose-wiki"}` |
| D1 migrate | `npx wrangler d1 migrations apply wannabe-jaxa-db --remote -c worker/wrangler.jsonc` |

Shared pipeline: [`shared/news/`](../../shared/news/) (no filesystem). Timeline ingest / retrieve: [`shared/timeline/`](../../shared/timeline/). Wiki proposals: [`shared/proposals/`](../../shared/proposals/). LLM judgments: [`shared/opik/`](../../shared/opik/). Production news / fact-check / proposals JSON live in KV (`news:file`, `news:md`, `fact-check:{docsId}`, `proposals:file`). D1 holds projects / documents / events; R2 `wannabe-jaxa-chunks` + Vectorize `wannabe-jaxa-vectors` hold embeddings. FetchNews uses Workers AI for project tags + ingest gate, then enqueues ProposeWiki for newly classified items.

## Secrets & env

### Local / optional GitHub

| Name | Use |
| --- | --- |
| `X_BEARER_TOKEN` | Official X fetch (skipped if unset) |
| `DEEPL_API_KEY` | Optional DeepL translation |
| `CF_ACCOUNT_ID` | Local `npm run fact-check` REST AI (optional) |
| `CF_API_TOKEN` | Local fact-check REST AI (optional) |
| `CF_AI_MODEL` | Optional; default `@cf/meta/llama-3.1-8b-instruct` |

### Worker secrets (`wrangler secret put -c worker/wrangler.jsonc`)

| Name | Use |
| --- | --- |
| `X_BEARER_TOKEN` | FetchNews X API |
| `DEEPL_API_KEY` | Optional translation |
| `CF_AI_MODEL` | Optional Workers AI model override (FetchNews gate + FactCheck + ProposeWiki) |
| `RUN_SECRET` | Bearer token for `POST /run` |
| `OPIK_API_KEY` | Opik Cloud API key (`authorization` header, no `Bearer ` prefix). **Required in production.** |
| `OPIK_WORKSPACE` | Opik / Comet workspace name (`Comet-Workspace` header). **Required in production.** |
| `OPIK_PROJECT_NAME` | Optional; default `wannabe-jaxa-astronaut` |

Workers AI uses the `AI` binding (no account REST token required on the Worker). If Opik secrets are unset, judgments still run (fail-open) but emit a warn — treat as degraded observability.

### Opik evaluation

| Layer | How |
| --- | --- |
| Production traces | Every judgment via `runJudgment` → Opik REST traces/spans; tags `judgment:news-ingest-gate`, `judgment:fact-check`, `judgment:propose-wiki` |
| Structural scores | Feedback scores `json_valid`, `schema_ok`, `slugs_in_catalog` / `verdict_enum_ok` / `evidence_allowlisted` |
| Online rules | Opik UI → Project → Evaluation Rules: Custom LLM-as-Judge filtered by those tags; map `input` / `output`; sample 100% until cost requires throttling |
| Offline | `npm run opik:eval` validates fixtures under [`scripts/opik/fixtures/`](../../scripts/opik/fixtures/); with Opik env set, logs a suite summary trace |

## Schedules (Cloudflare Workflows)

| Workflow | Cron (UTC) | Writes |
| --- | --- | --- |
| `FetchNewsWorkflow` | `0 */6 * * *` | KV `news:file`, `news:md`; D1 `events`; LLM classify + gate; Vectorize for `ingestAsSource`; enqueues ProposeWiki |
| `FactCheckWorkflow` | `0 3 * * 1` | KV `fact-check:{docsId}` (Opik-traced) |
| `IngestCorpusWorkflow` | `0 */12 * * *` | D1 documents/events; R2 chunks; Vectorize upserts |
| `ProposeWikiWorkflow` | `15 */6 * * *` | KV `proposals:file` (same-project prior chunks; Opik-traced) |

Human-owned project catalog: [`src/config/projects.ts`](../../src/config/projects.ts). Official seed URLs: [`src/config/corpus-seeds.ts`](../../src/config/corpus-seeds.ts).

## Related

- [AGENTS.md](../../AGENTS.md)
- [ADR-20260920-1-pages-and-worker.md](./ADR-20260920-1-pages-and-worker.md)
