# ADR-20260920-3 — Source policy

**Status:** accepted  
**Date:** 2026-09-20

## Context

Wiki trust and news coverage need different rules. Lists must not drift between docs and code.

## Decision

### Wiki allowlist

- Canonical check: [`src/config/official-domains.ts`](../../src/config/official-domains.ts) (`isOfficialUrl`).
- Body, summaries, and figures cite **only** allowlisted official primary URLs.
- Wikipedia, journalism, blogs, social posts, and secondary explainers are **not** wiki sources (they may lead a human to an official URL).
- No full-text republication; summarize and link.
- `npm run wiki:audit` enforces wiki Markdown against the allowlist.

### News sources (not wiki RAG)

- **Policy:** official RSS/HTML lists and official X handles only.
- **Canonical lists (do not duplicate URLs here):**
  - Feeds: [`src/config/feeds.ts`](../../src/config/feeds.ts)
  - X: [`src/config/x-accounts.ts`](../../src/config/x-accounts.ts)
- Machine translation of non-Japanese titles/summaries for display is allowed.
- Journalism outlets must never enter wiki pages or wiki/official RAG. If a news-only outlet is ever added to the news UI, it stays news-only.

### Papers (target ingest)

- NTRS / JAXA repository **abstracts and bibliographic records** only, after `isOfficialUrl`.
- Bulk PDF full-text extraction is forbidden.

## Consequences

- README states “official only”; operators and agents follow this ADR + config files.
- Changing feeds or X accounts is a code change to the config modules, not a README edit.

## Alternatives considered

- Copying full feed URL tables into docs — rejected; double maintenance.
- Allowing Wikipedia in RAG “for background” — rejected; product rule is official-only for wiki and corpus.

## Related

- [REQ-20260920-2-news-and-wiki.md](./REQ-20260920-2-news-and-wiki.md)
- [BOUNDED_CONTEXT.md](../BOUNDED_CONTEXT.md)
- [VER-20260920-1-operations.md](./VER-20260920-1-operations.md)
