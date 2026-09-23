# ADR-20260923-1 — Runtime D1 source of truth (catalog, news, proposals)

**Status:** accepted  
**Date:** 2026-09-23

## Context

Catalog membership and relations lived in checked-in TypeScript ([`src/config/projects.ts`](../../src/config/projects.ts)). News and wiki proposals lived as whole-file KV blobs (`news:file`, `proposals:file`). Operators cannot change catalog without redeploy, and KV whole-blob read-modify-write races under concurrent jobs. Issue [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11) asks for an admin / ontology surface and a clear single source of truth. Implementation is [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12).

Graph RAG already walks catalog relations ([ADR-20260922-3](./ADR-20260922-3-graph-rag.md)). Agency / Vehicle / Budget stay non-first-class.

## Decision

### Runtime source of truth

| Data | Runtime SoT | Seed / transition |
| --- | --- | --- |
| Catalog (Project, Relation, display `countries` / `kindJa`) | **D1** `projects` + `project_relations` | TypeScript seed / empty-D1 fallback |
| News feed (UI list) | **D1** `news_items` | KV `news:file` during migration; local `src/data/news.json` for offline dev |
| Wiki proposals | **D1** `proposals` | KV `proposals:file` during migration |
| RAG timeline / ingest | Existing D1 `events` / `documents` + R2 / Vectorize | Unchanged |
| Fact-check history | KV today; **D1 allowed later** | Not required in [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12) |

KV remains for transitional fallback and other blobs until news / proposals cut over. Catalog must not use KV as SoT.

### Feed vs RAG boundary

```text
FetchNews → upsert news_items (feed SoT)
         → if ingestAsSource → documents / events + R2 / Vectorize (unchanged)
ProposeWiki → upsert proposals (D1)
```

Do **not** conflate `news_items` (feed) with `events` (timeline / RAG).

### Admin and auth

- Admin UI and admin write APIs live under `/admin/*`, protected by **Cloudflare Access**.
- Catalog CRUD (Project, Relation, display fields) is the primary admin job. Manual edit of news / proposals in admin is not required; jobs write, Site reads D1.
- Jobs Worker `RUN_SECRET` stays separate (cron / manual workflow trigger only).

### RAG and slug safety

- Vectorize metadata key `project` remains a **catalog slug** only.
- Prefer **retire** (`role = retired`) over hard delete of slugs that may own chunks or events.
- **Rename** of an existing slug is forbidden in the admin UI unless an explicit migration procedure rewrites D1 events / documents and Vectorize metadata (document in VER when implemented).
- Display fields `countries` / `kindJa` stay Site-only ([ADR-20260922-3](./ADR-20260922-3-graph-rag.md)).

### Ontology (admin scope)

| Concept | Catalog / admin | RAG |
| --- | --- | --- |
| Project + Relation | Editable in admin (impl [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12)) | Slug owns corpus; relations feed Graph expand |
| `countries` / `kindJa` | Editable display fields | Not expand inputs or Vectorize keys |
| Agency / Vehicle / Budget line | **Not** first-class nodes; optional future overlay tables may FK to projects without owning chunks | Never Vectorize `project` keys |
| OWL / reasoner | Not introduced | — |

### Schema direction (for implementers)

Extend the existing D1 timeline database (do not invent a second DB):

- Widen `projects` with `role`, `phase`, `kind_ja`, `countries_json`, `keywords_json` (and related columns as needed).
- Add `project_relations (from_slug, type, to_slug)`.
- Add `news_items` and `proposals` row tables matching current TypeScript shapes.
- Bootstrap: load TypeScript catalog seed into D1 once; document re-seed rules (production overwrite forbidden by default).

Readers (Site, classify, `expandRetrievalSlugs`) use a **D1 catalog loader** with TypeScript fallback when D1 is empty or unbound.

## Consequences

- [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12) implements migrations, loaders, Access-backed admin, and news / proposals cutover.
- [ADR-20260920-1](./ADR-20260920-1-pages-and-worker.md) bindings: D1 becomes primary for catalog + feed + proposals; KV shrinks after cutover.
- [ADR-20260922-2](./ADR-20260922-2-crewed-project-relations.md) membership rules stay; storage of the catalog moves to D1.
- Dual-write or read-fallback windows are operator-visible in VER.

## Alternatives considered

- Keep TypeScript as catalog SoT and admin only opens PRs — rejected; operators need deploy-free updates.
- Put catalog in KV JSON — rejected; relations need structured queries and match D1 timeline already present.
- Merge feed news into `events` only — rejected; feed retention / UI shape differs from RAG timeline events.
- Cloudflare Access replaced by app-level passwords — rejected; Access fits Pages / Workers edge auth.

## Related

- [REQ-20260923-1-admin-runtime-sot.md](./REQ-20260923-1-admin-runtime-sot.md)
- [VER-20260923-1-admin-and-d1.md](./VER-20260923-1-admin-and-d1.md)
- [ADR-20260922-3-graph-rag.md](./ADR-20260922-3-graph-rag.md)
- [ADR-20260920-1-pages-and-worker.md](./ADR-20260920-1-pages-and-worker.md)
- Issues [#11](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/11), [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12)
