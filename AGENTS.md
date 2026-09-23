# AGENTS.md

## Project

Unofficial site that places **current and planned crewed** (and astronaut-adjacent) spaceflight programs on official-source timelines and builds a project-scoped knowledge base (RAG). Humans own the project catalog and relations. Automation collects official news; an LLM gates ingest and may propose wiki work later. It does **not** write or rewrite wiki bodies. See [README.md](./README.md) and [REQ-20260922-1](./docs/specs/REQ-20260922-1-crewed-timelines.md).

## Important docs

| Path | Use |
| --- | --- |
| [`docs/DOMAIN.md`](./docs/DOMAIN.md) | Domain model |
| [`docs/GLOSSARY.md`](./docs/GLOSSARY.md) | Ubiquitous language — **use these terms** |
| [`docs/BOUNDED_CONTEXT.md`](./docs/BOUNDED_CONTEXT.md) | News vs Knowledge base vs Catalog vs Wiki vs Site |
| [`docs/specs/`](./docs/specs/) | Numbered REQ / ADR / VER (technical source of truth) |
| [`docs/specs/_templates/`](./docs/specs/_templates/) | Spec templates |

Visitor READMEs stay free of commands, secrets, and schemas. Put those in VER / ADR.

## Conventions

1. Domain wording follows [`docs/GLOSSARY.md`](./docs/GLOSSARY.md).
2. Corpus and wiki cite allowlisted official URLs only ([`ADR-20260920-3`](./docs/specs/ADR-20260920-3-source-policy.md)); lists live in `src/config/`.
3. Catalog rules and relations: [`ADR-20260922-2`](./docs/specs/ADR-20260922-2-crewed-project-relations.md). Classifiers emit **in-scope** slugs only.
4. LLMs propose and audit; humans write wiki Markdown when that track resumes.
5. **Commit messages stay short** (one or two sentences, why-focused). No long bullet lists of implementation detail.
6. Do not put operator tables back into README.

## Development

```
astro dev --background
```

Manage with `astro dev stop`, `astro dev status`, `astro dev logs`. Commands and deploy: [`docs/specs/VER-20260920-1-operations.md`](./docs/specs/VER-20260920-1-operations.md). Astro docs: https://docs.astro.build
