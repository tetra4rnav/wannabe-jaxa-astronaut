# VER-20260923-1 — Admin Access and D1 catalog / feed stores

**Status:** current  
**Date:** 2026-09-23

## Scope

Operator checklist for Cloudflare Access on `/admin`, D1 catalog bootstrap, and KV → D1 cutover for news and proposals. Complements [VER-20260920-1-operations.md](./VER-20260920-1-operations.md). No secret values in this file.

Implementation lands in [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12); this VER is written ahead so implementers and operators share one checklist.

## Steps / checklist

### Cloudflare Access (`/admin`)

1. In Zero Trust, create an Access application covering the public app hostname path `/admin*`.
2. Allow only operator IdPs / emails; deny anonymous.
3. Confirm public routes (`/`, `/news/`, `/projects/`, `/proposals/`, JSON dumps) remain **without** Access.
4. Confirm jobs Worker `/run` still uses Bearer `RUN_SECRET` only (not Access).

### D1 catalog bootstrap

1. Apply migrations that widen `projects` and add `project_relations` (and `news_items` / `proposals` when shipping [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12)).
2. Run one-time seed from TypeScript catalog into D1 when the catalog tables are empty.
3. **Do not** re-seed production from TypeScript if D1 already has operator edits (overwrite forbidden by default).
4. After seed, verify Site project table and Graph expand read D1 (empty D1 → documented TS fallback only in local / unbound environments).

### News / proposals cutover

1. Prefer a short dual-read window: D1 primary, KV fallback if row missing / table empty.
2. Point FetchNews and ProposeWiki writes at D1; keep KV write only if dual-write is explicitly enabled for rollback.
3. Migrate existing KV blobs into D1 rows once; spot-check counts (feed cap ~200).
4. After confidence, disable KV fallback writes; leave read fallback until the next release, then remove.
5. Confirm gated news still creates `documents` / `events` independently of `news_items`.

### Slug / RAG safety

1. Prefer setting `role = retired` over DELETE of a project slug.
2. Block or gate slug renames in admin until a documented rewrite of `events`, `documents`, and Vectorize metadata exists.
3. Never use `countries` / `kindJa` as Vectorize filters or classify targets.

## Secrets & env

Names only (no values).

| Name | Use |
| --- | --- |
| Cloudflare Access (Zero Trust) | Protect `/admin*` on the public app |
| `RUN_SECRET` | Jobs Worker manual `/run` (unchanged) |
| D1 `DB` / `wannabe-jaxa-db` | Catalog + feed + proposals (+ existing timeline) |
| KV `STORE` | Transitional news / proposals / fact-check blobs |

## Related

- [REQ-20260923-1-admin-runtime-sot.md](./REQ-20260923-1-admin-runtime-sot.md)
- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
- Issues [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11), [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12)
