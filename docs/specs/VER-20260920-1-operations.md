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
| `npm run build` | Corpus generation + production build (Cloudflare adapter output under `dist/`) |
| `npm run preview` | `astro preview` (workerd; mirrors production SSR) |
| `npm run fetch:news` | RSS / HTML / X → `src/data/news.json` (local fallback) |
| `npm run wiki:audit` | Official-domain audit of wiki Markdown (also runs in `prebuild`) |
| `npm run corpus:build` | `/corpus/*.jsonl` generation |
| `npm run fact-check` | Local append of LLM fact-check history under `src/data/fact-checks/` (optional) |
| `npm run deploy` | Optional local build + `wrangler deploy` (public Astro SSR Worker + assets) |
| `npm run deploy:jobs` | Deploy jobs Worker + Workflows (`worker/wrangler.jsonc`) |
| `npm run opik:eval` | Offline fixture contracts for LLM judgments (+ optional Opik Cloud suite trace) |

`fetch:feeds` and `fetch:x` alias `fetch:news`.

### Public app deploy

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (runs `prebuild`: `wiki:audit` then `corpus:build`) |
| Output | `dist/client` (assets) + `dist/server/entry.mjs` (SSR); see [ADR-20260920-5](./ADR-20260920-5-astro-ssr-pages.md) |
| Deploy | `npm run deploy` → `wrangler deploy` (root `wrangler.jsonc`) |
| Production branch | `main` (Workers Builds / Git if configured) |

Emergency: `npx wrangler deploy` after a successful `astro build` (adapter fills `main` / `assets` in the generated worker config).

### Custom domain

| Item | Value |
| --- | --- |
| Canonical host | `https://wannabe-jaxa-astronaut.diaphana.io` |
| Pages project (legacy alias) | `wannabe-jaxa-astronaut` (public app may be the Worker of the same name after SSR) |
| Alias | `wannabe-jaxa-astronaut.pages.dev` (kept; no forced redirect) |
| Zone | `diaphana.io` (same Cloudflare account) |
| DNS | Proxied CNAME `wannabe-jaxa-astronaut` → `wannabe-jaxa-astronaut.pages.dev` (required if Pages reports “CNAME record not set”) |

Attach via Pages Custom domains (or `POST .../pages/projects/wannabe-jaxa-astronaut/domains`). Wait until domain status is **Active**. Astro `site`, visitor READMEs, and corpus `SITE` use the canonical host. Jobs Worker remains on `*.workers.dev`.

Source-domain audit runs on every local / CI build via `prebuild`. Scheduled news / fact-check jobs live on the jobs Worker (not GitHub Actions).

Do **not** enable Bot Fight Mode or AI crawler blocking; [`public/robots.txt`](../../public/robots.txt) is allow-all.

Remaining Pages Functions under `functions/` may still serve `/news.md`, `/fact-checks/:id.json`, `/proposals.json` (plus `/proposals/:id.json`), and project timeline JSON when that surface is active. **`/news.json` is served by the Astro SSR app** (KV with bundled `src/data/news.json` fallback). Home (`/`), `/news/`, and `/news/[id]/` render news on the server from the same loader.

Bind on the public app: KV `STORE` → `wannabe-jaxa-store`, D1 `DB` → `wannabe-jaxa-db`.

### Jobs Worker

| Item | Value |
| --- | --- |
| Config | [`worker/wrangler.jsonc`](../../worker/wrangler.jsonc) |
| Name | `wannabe-jaxa-jobs` |
| Deploy | `npm run deploy:jobs` |
| Manual run | `POST /run` with `Authorization: Bearer $RUN_SECRET` and JSON `{"job":"fetch-news"|"fact-check"|"ingest-corpus"|"propose-wiki"}` |
| D1 migrate | `npx wrangler d1 migrations apply wannabe-jaxa-db --remote -c worker/wrangler.jsonc` |

Shared pipeline: [`shared/news/`](../../shared/news/) (no filesystem). Timeline ingest / retrieve: [`shared/timeline/`](../../shared/timeline/). Wiki proposals: [`shared/proposals/`](../../shared/proposals/). LLM judgments: [`shared/opik/`](../../shared/opik/). **Today:** production news / fact-check / proposals JSON live in KV (`news:file`, `news:md`, `fact-check:{docsId}`, `proposals:file`); D1 holds projects / documents / events. **Target SoT** (catalog + news feed + proposals → D1): [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md), cutover checklist [VER-20260923-1](./VER-20260923-1-admin-and-d1.md), impl [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12). R2 `wannabe-jaxa-chunks` + Vectorize `wannabe-jaxa-vectors` hold embeddings. FetchNews uses TypeSafe Jev (`typesafe/jev`) for project tags + ingest gate, then enqueues ProposeWiki for newly classified items.

## Secrets & env

### Local / optional GitHub

| Name | Use |
| --- | --- |
| `X_BEARER_TOKEN` | Official X fetch (skipped if unset) |
| `DEEPL_API_KEY` | Optional DeepL translation |
| `CF_ACCOUNT_ID` | Local `npm run fact-check` REST AI (optional) |
| `CF_API_TOKEN` | Local fact-check REST AI (optional) |
| `CF_AI_MODEL` | Optional; default `@cf/meta/llama-3.1-8b-instruct` (chat judgments) |
| `CF_JEV_MODEL` | Optional; default `typesafe/jev` (news ingest gate / project tags) |

### Worker secrets (`wrangler secret put -c worker/wrangler.jsonc`)

| Name | Use |
| --- | --- |
| `X_BEARER_TOKEN` | FetchNews X API |
| `DEEPL_API_KEY` | Optional translation |
| `CF_AI_MODEL` | Optional Workers AI chat model override (FactCheck + ProposeWiki) |
| `CF_JEV_MODEL` | Optional TypeSafe Jev model override (FetchNews ingest gate + project tags; default `typesafe/jev`) |
| `RUN_SECRET` | Bearer token for `POST /run` |
| `OPIK_API_KEY` | Opik Cloud API key (`authorization` header, no `Bearer ` prefix). **Required in production.** |
| `OPIK_WORKSPACE` | Opik / Comet workspace name (`Comet-Workspace` header). **Required in production.** |
| `OPIK_PROJECT_NAME` | Optional; default `wannabe-jaxa-astronaut` |

Workers AI uses the `AI` binding (no account REST token required on the Worker). If Opik secrets are unset, judgments still run (fail-open) but emit a warn — treat as degraded observability.

### Opik evaluation

| Layer | How |
| --- | --- |
| Production traces | News gate via `runJevJudgment`; FactCheck / ProposeWiki via `runJudgment` → Opik REST traces/spans; tags `judgment:news-ingest-gate`, `judgment:fact-check`, `judgment:propose-wiki` |
| Structural scores | Jev: `jev_ok`, `schema_ok`, `slugs_in_catalog`; chat: `json_valid` plus job-specific scores |
| Online rules | Opik UI → Project → Evaluation Rules: Custom LLM-as-Judge filtered by those tags; map `input` / `output`; sample 100% until cost requires throttling |
| Offline | `npm run opik:eval` validates fixtures under [`scripts/opik/fixtures/`](../../scripts/opik/fixtures/) (includes `mapJevNewsAnswers` / `jev-news-map.json`); with Opik env set, logs a suite summary trace |

## Schedules (Cloudflare Workflows)

| Workflow | Cron (UTC) | Writes |
| --- | --- | --- |
| `FetchNewsWorkflow` | `0 */6 * * *` | KV `news:file`, `news:md`; D1 `events`; LLM classify + gate; Vectorize for `ingestAsSource`; enqueues ProposeWiki |
| `FactCheckWorkflow` | `0 3 * * 1` | KV `fact-check:{docsId}` (Opik-traced) |
| `IngestCorpusWorkflow` | `0 */12 * * *` | D1 documents/events; R2 chunks; Vectorize upserts |
| `ProposeWikiWorkflow` | `15 */6 * * *` | KV `proposals:file` (same-project prior chunks; Opik-traced) |

Human-owned project catalog seed: [`src/config/projects.ts`](../../src/config/projects.ts) (runtime SoT → D1 per [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md)). Official seed URLs: [`src/config/corpus-seeds.ts`](../../src/config/corpus-seeds.ts).

## Related

- [AGENTS.md](../../AGENTS.md)
- [ADR-20260920-1-pages-and-worker.md](./ADR-20260920-1-pages-and-worker.md)
- [VER-20260923-1-admin-and-d1.md](./VER-20260923-1-admin-and-d1.md)
- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
