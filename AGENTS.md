# AGENTS.md

## Project

Unofficial study wiki for JAXA astronaut applicants. Humans write wiki pages from official primary sources. Automation collects news; an LLM proposes wiki work and fact-checks; it does **not** write or rewrite wiki bodies. See the four-stage loop in [`README.md`](./README.md).

## Important docs

| Path | Use |
| --- | --- |
| [`docs/DOMAIN.md`](./docs/DOMAIN.md) | Domain model |
| [`docs/GLOSSARY.md`](./docs/GLOSSARY.md) | Ubiquitous language — **use these terms** |
| [`docs/BOUNDED_CONTEXT.md`](./docs/BOUNDED_CONTEXT.md) | News vs Wiki vs Corpus vs Site |
| [`docs/specs/`](./docs/specs/) | Numbered REQ / ADR / VER (technical source of truth) |
| [`docs/specs/_templates/`](./docs/specs/_templates/) | Spec templates |

Visitor READMEs stay free of commands, secrets, and schemas. Put those in VER / ADR.

## Conventions

1. Domain wording follows [`docs/GLOSSARY.md`](./docs/GLOSSARY.md).
2. Wiki cites allowlisted official URLs only ([`ADR-20260920-3`](./docs/specs/ADR-20260920-3-source-policy.md)); lists live in `src/config/`.
3. LLMs propose and audit; humans write wiki Markdown.
4. **Commit messages stay short** (one or two sentences, why-focused). No long bullet lists of implementation detail.
5. Do not put operator tables back into README.

## Development

```
astro dev --background
```

Manage with `astro dev stop`, `astro dev status`, `astro dev logs`. Commands and deploy: [`docs/specs/VER-20260920-1-operations.md`](./docs/specs/VER-20260920-1-operations.md). Astro docs: https://docs.astro.build
