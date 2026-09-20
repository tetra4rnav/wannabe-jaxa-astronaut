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
| `npm run fetch:news` | RSS / HTML / X → `src/data/news.json` |
| `npm run wiki:audit` | Official-domain audit of wiki Markdown |
| `npm run corpus:build` | `/corpus/*.jsonl` generation |
| `npm run fact-check` | Append LLM fact-check history (needs Cloudflare AI secrets) |
| `npm run deploy` | Optional local build + Pages Direct Upload; normal path is Git push |

`fetch:feeds` and `fetch:x` alias `fetch:news`.

### Pages Git deploy

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output | `dist` |
| Production branch | `main` |

Emergency: `npx wrangler pages deploy ./dist --project-name=wannabe-jaxa-astronaut`.

Do **not** enable Bot Fight Mode or AI crawler blocking; [`public/robots.txt`](../../public/robots.txt) is allow-all.

## Secrets & env

| Name | Use |
| --- | --- |
| `X_BEARER_TOKEN` | Official X fetch (skipped if unset) |
| `DEEPL_API_KEY` | Optional DeepL translation |
| `CF_ACCOUNT_ID` | Workers AI fact-check |
| `CF_API_TOKEN` | Workers AI token |
| `CF_AI_MODEL` | Optional; default `@cf/meta/llama-3.1-8b-instruct` |

## Current schedules (GitHub Actions)

| Workflow | Cron | Commits |
| --- | --- | --- |
| `.github/workflows/fetch-news.yml` | `0 */6 * * *` | `src/data/news.json`, corpus if changed |
| `.github/workflows/fact-check.yml` | `0 3 * * 1` | fact-checks + corpus if AI secrets set |
| `.github/workflows/ci.yml` | push/PR | audit + build |

Intended Worker replacements (not shipped): FetchNews `0 */6 * * *`, FactCheck `0 3 * * 1`, later IngestCorpus `0 */12 * * *`. Update this VER when they ship.

## Related

- [AGENTS.md](../../AGENTS.md)
- [ADR-20260920-1-pages-and-worker.md](./ADR-20260920-1-pages-and-worker.md)
