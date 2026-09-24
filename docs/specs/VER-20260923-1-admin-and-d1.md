# VER-20260923-1 — Admin Access and D1 catalog / feed stores

**Status:** current  
**Date:** 2026-09-23

## Scope

Operator checklist for Cloudflare Access on `/admin`, D1 catalog bootstrap, and KV → D1 cutover for news and proposals. Complements [VER-20260920-1-operations.md](./VER-20260920-1-operations.md). No secret values in this file.

Implementation: [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12).

## Steps / checklist

### Apply schema

```bash
npx wrangler d1 migrations apply wannabe-jaxa-db --remote -c worker/wrangler.jsonc
npx wrangler d1 migrations apply wannabe-jaxa-db --local -c worker/wrangler.jsonc
```

Migration `0002_runtime_sot.sql` adds catalog columns, `project_relations`, `news_items`, `proposals`.

### Preview D1 (`wannabe-jaxa-db_preview`)

Shared staging DB for Workers Previews (all non-`main` branches). Production `wannabe-jaxa-db` and jobs Worker stay on the production database only.

1. Create once: `npx wrangler d1 create wannabe-jaxa-db_preview` (already provisioned; id in root [`wrangler.jsonc`](../../wrangler.jsonc) `previews.d1_databases` / `preview_database_id`).
2. Apply schema (uses [`wrangler.preview-migrations.jsonc`](../../wrangler.preview-migrations.jsonc) so jobs/prod config is not used):

```bash
npx wrangler d1 migrations apply wannabe-jaxa-db_preview --remote -c wrangler.preview-migrations.jsonc
```

3. Dashboard → public Worker → **Previews Base** bindings: `DB` → `wannabe-jaxa-db_preview`, `STORE` → preview KV (`preview_id` in `wrangler.jsonc`).
4. Optional Preview variable: `ADMIN_OPEN=1` (never on Production).

### Cloudflare Access (`/admin`)

1. Zero Trust Access application covering public app path `/admin*`.
2. Allow only operator IdPs / emails.
3. Public routes stay open. Jobs `/run` stays `RUN_SECRET`.
4. Optional local bypass: `ADMIN_OPEN=1` on the public Worker env (never in production).

### D1 catalog bootstrap

1. First FetchNews / IngestCorpus / admin GET catalog calls `ensureCatalogSeeded` (seeds **only if** `projects` is empty).
2. Do **not** re-seed production from TypeScript after operators edit D1.
3. Admin: `/admin/?section=catalog` (CRUD), `/admin/?section=rag-audit` (read-only).

### News / proposals cutover (no KV fallback in code)

1. Export KV `news:file` and `proposals:file` if production has data.
2. Import into D1 `news_items` / `proposals` (operator one-shot; see `scripts/migrate-kv-to-d1-hint.ts`).
3. Deploy code that reads/writes D1 only for news and proposals.
4. Delete obsolete KV keys `news:file`, `news:md`, `proposals:file` after verification.
5. Keep KV for `fact-check:*` only.

### Slug / RAG safety

1. Prefer **引退** (`role=retired`) in admin; no hard delete / rename in UI.
2. Never use `countries` / `kindJa` as Vectorize filters.

## Secrets & env

| Name | Use |
| --- | --- |
| Cloudflare Access | Protect `/admin*` |
| `ADMIN_OPEN` | Dev-only admin bypass (`1` / `true`) |
| `RUN_SECRET` | Jobs Worker `/run` |
| D1 `DB` | Catalog + news_items + proposals + timeline (`wannabe-jaxa-db` production; `wannabe-jaxa-db_preview` for Previews) |
| KV `STORE` | Fact-check blobs only (after cutover); Preview uses `preview_id` namespace |

## Related

- [REQ-20260923-1-admin-runtime-sot.md](./REQ-20260923-1-admin-runtime-sot.md)
- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
