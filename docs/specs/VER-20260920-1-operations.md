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
| `npm run fetch:news` | RSS / HTML / X → `src/data/news.json` (local / CI fallback) |
| `npm run wiki:audit` | Official-domain audit of wiki Markdown |
| `npm run corpus:build` | `/corpus/*.jsonl` generation |
| `npm run fact-check` | Local append of LLM fact-check history under `src/data/fact-checks/` (optional) |
| `npm run deploy` | Optional local build + Pages Direct Upload; normal path is Git push |
| `npm run deploy:jobs` | Deploy Worker + Workflows (`worker/wrangler.jsonc`) |

`fetch:feeds` and `fetch:x` alias `fetch:news`.

### Pages Git deploy

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output | `dist` |
| Production branch | `main` |

Emergency: `npx wrangler pages deploy ./dist --project-name=wannabe-jaxa-astronaut`.

Do **not** enable Bot Fight Mode or AI crawler blocking; [`public/robots.txt`](../../public/robots.txt) is allow-all.

Pages Functions (`functions/`) serve live `/news.json`, `/news.md`, and `/fact-checks/:id.json` from KV binding `STORE`. Project timelines use D1 binding `DB` via `/projects/catalog.json` and `/projects/:slug/timeline.json`. When KV is empty, news falls back to GitHub raw `src/data/news.json`.

Bind on the Pages project: KV `STORE` → `wannabe-jaxa-store`, D1 `DB` → `wannabe-jaxa-db`.

### Jobs Worker

| Item | Value |
| --- | --- |
| Config | [`worker/wrangler.jsonc`](../../worker/wrangler.jsonc) |
| Name | `wannabe-jaxa-jobs` |
| Deploy | `npm run deploy:jobs` |
| Manual run | `POST /run` with `Authorization: Bearer $RUN_SECRET` and JSON `{"job":"fetch-news"|"fact-check"|"ingest-corpus"}` |
| D1 migrate | `npx wrangler d1 migrations apply wannabe-jaxa-db --remote -c worker/wrangler.jsonc` |

Shared pipeline: [`shared/news/`](../../shared/news/) (no filesystem). Timeline ingest: [`shared/timeline/`](../../shared/timeline/). Production news / fact-check JSON live in KV (`news:file`, `news:md`, `fact-check:{docsId}`). D1 holds projects / documents / events; R2 `wannabe-jaxa-chunks` + Vectorize `wannabe-jaxa-vectors` hold embeddings.

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
| `CF_AI_MODEL` | Optional FactCheck model override |
| `RUN_SECRET` | Bearer token for `POST /run` |

Workers AI uses the `AI` binding (no account REST token required on the Worker).

## Schedules (Cloudflare Workflows)

| Workflow | Cron (UTC) | Writes |
| --- | --- | --- |
| `FetchNewsWorkflow` | `0 */6 * * *` | KV `news:file`, `news:md`; D1 `events` (tagged projects) |
| `FactCheckWorkflow` | `0 3 * * 1` | KV `fact-check:{docsId}` |
| `IngestCorpusWorkflow` | `0 */12 * * *` | D1 documents/events; R2 chunks; Vectorize upserts |

CI (`.github/workflows/ci.yml`) still runs audit + build on push/PR. Scheduled GitHub Actions for news / fact-check were removed.

Human-owned project catalog: [`src/config/projects.ts`](../../src/config/projects.ts). Official seed URLs: [`src/config/corpus-seeds.ts`](../../src/config/corpus-seeds.ts).

## Related

- [AGENTS.md](../../AGENTS.md)
- [ADR-20260920-1-pages-and-worker.md](./ADR-20260920-1-pages-and-worker.md)
