# REQ-20260920-2 — News and wiki

**Status:** accepted  
**Date:** 2026-09-20

## Context

Visitors must understand that news and wiki are different surfaces with a one-way spark relationship.

## Requirements

1. **News** shows official feed / X events in a **project timeline**, not only by recency.
2. **Wiki** is the durable study canon; citations are allowlisted official URLs only.
3. News text must not be copied into wiki bodies as the authoritative content.
4. Journalism may appear only in a news-only path if ever added; it must never enter wiki `sources` or corpus RAG.
5. README and About explain the difference and relationship in visitor language (including the bilingual actor-labeled loop diagram).

## Out of scope

- Full news-source URL tables in README (policy + config pointers live in ADR-20260920-3)

## Related

- [REQ-20260920-1-four-stage-loop.md](./REQ-20260920-1-four-stage-loop.md)
- [ADR-20260920-3-source-policy.md](./ADR-20260920-3-source-policy.md)
- [BOUNDED_CONTEXT.md](../BOUNDED_CONTEXT.md)
