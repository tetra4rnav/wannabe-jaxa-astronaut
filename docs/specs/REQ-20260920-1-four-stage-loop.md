# REQ-20260920-1 — Four-stage loop

**Status:** accepted  
**Date:** 2026-09-20

## Context

The site must stay trustworthy for astronaut applicants: humans own wiki prose; automation and LLMs handle collection, proposals, and audits.

## Requirements

1. **Auto: collect news** from official feeds and official X only.
2. **LLM: propose wiki pages** grounded in earlier official material on the same project; never write wiki Markdown.
3. **Human: write the wiki** with allowlisted official URLs in `sources`.
4. **LLM: check the facts** and append audit history only; never rewrite wiki bodies.
5. Unclassified news remains visible as `unassigned`; it is not dropped silently.

## Out of scope

- Public in-site chat
- Automatic wiki generation or rewrite
- Finished “news article briefs” as a product surface

## Related

- [REQ-20260920-2-news-and-wiki.md](./REQ-20260920-2-news-and-wiki.md)
- [DOMAIN.md](../DOMAIN.md)
- Template: [_templates/REQ.md](./_templates/REQ.md)
