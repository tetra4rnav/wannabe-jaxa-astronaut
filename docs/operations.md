# Operations

User README files stay free of commands and secrets. This page is the operator runbook **as of this docs slice**. GitHub Action crons move to a Worker in a later slice; when they do, update this file, not README.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server (`astro dev`; agents should use `astro dev --background`) |
| `npm run build` | Corpus generation + production build → `dist/` |
| `npm run fetch:news` | RSS / HTML / X fetch → `src/data/news.json` |
| `npm run wiki:audit` | Official-domain audit of wiki Markdown |
| `npm run corpus:build` | `/corpus/*.jsonl` generation |
| `npm run fact-check` | Append LLM fact-check history (needs Cloudflare AI secrets) |
| `npm run deploy` | Optional local build + Pages Direct Upload. Normal path is Git push |

`npm run fetch:feeds` and `npm run fetch:x` are aliases of `fetch:news`.

## Live URLs

- Site: https://wannabe-jaxa-astronaut.pages.dev
- GitHub: https://github.com/tetra4rnav/wannabe-jaxa-astronaut

The old `*.workers.dev` Worker is gone. Deploy is Pages Git integration only.

## Pages Git deploy

Production is Cloudflare Pages Git (`tetra4rnav/wannabe-jaxa-astronaut` → `main`).

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output | `dist` |
| Production branch | `main` |

Push to `main` and pull requests get automatic production/preview builds. Manual Direct Upload is not the usual path.

```bash
# Emergency only (usual path is Git push)
npx wrangler pages deploy ./dist --project-name=wannabe-jaxa-astronaut
```

Local deploy needs `wrangler login` (or a Cloudflare API token).

## Cloudflare bot settings

The site is published for OAI-SearchBot, GPTBot, ClaudeBot, Googlebot, and other AI/search crawlers. **Do not** enable Bot Fight Mode, AI Crawl Control / AI crawler blocking, or WAF rules that 403 bots. [`public/robots.txt`](../public/robots.txt) is allow-all.

## GitHub secrets

| Secret | Use |
| --- | --- |
| `X_BEARER_TOKEN` | Official X fetch (X is skipped if unset) |
| `DEEPL_API_KEY` | Optional. DeepL translation |
| `CF_ACCOUNT_ID` | Weekly fact-check (Workers AI) |
| `CF_API_TOKEN` | Workers AI API token |
| `CF_AI_MODEL` | Optional. Default `@cf/meta/llama-3.1-8b-instruct` |

## Current schedules (GitHub Actions)

| Workflow | Cron | What it commits |
| --- | --- | --- |
| [`.github/workflows/fetch-news.yml`](../.github/workflows/fetch-news.yml) | `0 */6 * * *` | `src/data/news.json`, `public/corpus` if changed |
| [`.github/workflows/fact-check.yml`](../.github/workflows/fact-check.yml) | `0 3 * * 1` | `src/data/fact-checks`, `public/corpus` if Workers AI secrets are set |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | on push/PR | `wiki:audit` + `build` (no commit) |

Intended Worker replacements (not shipped): FetchNews `0 */6 * * *`, FactCheck `0 3 * * 1`, later IngestCorpus `0 */12 * * *`. Those schedules and any new secrets stay documented here.

## Agents and corpus

Wiki agent contract: [AGENTS.md](../AGENTS.md). External RAG dump: `/corpus/chunks.jsonl` (no in-site chat API). After wiki or news changes, `npm run corpus:build` (also runs as `prebuild`).
