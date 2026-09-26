# VER-20260923-1 — Admin auth and D1 catalog / feed stores

**Status:** current  
**Date:** 2026-09-23

## Scope

Operator checklist for Better Auth on `/admin`, D1 catalog bootstrap, and KV → D1 cutover for news and proposals. Complements [VER-20260920-1-operations.md](./VER-20260920-1-operations.md). No secret values in this file. Auth decision: [ADR-20260925-1](./ADR-20260925-1-better-auth.md).

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

### Better Auth (`/admin`)

Public pages stay open. `/login` is the operator sign-in page. There is no public registration page.

1. On the **public** Worker only, set secrets `BETTER_AUTH_SECRET` and `BOOTSTRAP_SECRET` (`wrangler secret put`). Set variables `BETTER_AUTH_URL` (canonical origin) and `ADMIN_EMAILS` (comma-separated operator emails). Do not set these on the jobs Worker.
2. Local: put the same names in gitignored `.dev.vars`. `astro dev` does not skip the session check.
3. Create or reset an operator (email must be in `ADMIN_EMAILS`):

```bash
curl -sS -X POST "$ORIGIN/api/operator/accounts" \
  -H "Authorization: Bearer $BOOTSTRAP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@example.com","password":"...","name":"Operator"}'
```

4. Sign in at `/login`, then open `/admin/?section=catalog`. Jobs `/run` stays `RUN_SECRET`.
5. Optional bypass: `ADMIN_OPEN=1` on the public Worker (never in production).
6. After this build is deployed and `/login` works, delete the Cloudflare Access application `wannabe-jaxa-astronaut` (id `73ca6ca5-7a57-4beb-9ed8-07ec64e568a6`, destination `wannabe-jaxa-astronaut.diaphana.io/admin*`). Do not delete the reusable email policy or any other Access application. Confirm `/admin` no longer shows the Access login screen.

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
| `BETTER_AUTH_SECRET` | Public Worker session signing |
| `BETTER_AUTH_URL` | Canonical origin for auth cookies |
| `ADMIN_EMAILS` | Comma-separated operator emails allowed into `/admin` |
| `BOOTSTRAP_SECRET` | Bearer token for `POST /api/operator/accounts` |
| `ADMIN_OPEN` | Explicit admin bypass (`1` / `true`); never in production |
| `RUN_SECRET` | Jobs Worker `/run` |
| D1 `DB` | Catalog + news_items + proposals + timeline + auth tables (`wannabe-jaxa-db` production; `wannabe-jaxa-db_preview` for Previews) |
| KV `STORE` | Fact-check blobs only (after cutover); Preview uses `preview_id` namespace |

## Related

- [ADR-20260925-1-better-auth.md](./ADR-20260925-1-better-auth.md)
- [REQ-20260923-1-admin-runtime-sot.md](./REQ-20260923-1-admin-runtime-sot.md)
- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
