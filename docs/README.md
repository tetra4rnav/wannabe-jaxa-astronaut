# Developer docs

English spec and operations for [wannabe-jaxa-astronaut](https://github.com/tetra4rnav/wannabe-jaxa-astronaut). This folder is **not** the Starlight wiki (`src/content/docs/`).

| Audience | Where |
| --- | --- |
| Site visitors and wiki authors | Japanese [`README.md`](../README.md), English [`README.en.md`](../README.en.md), on-site [About](https://wannabe-jaxa-astronaut.pages.dev/about/) |
| Implementers | This `docs/` folder |

## Contents

| Doc | Decision it records |
| --- | --- |
| [loop.md](./loop.md) | Four-stage news → propose → write → audit loop; what the LLM may and must not write |
| [architecture.md](./architecture.md) | Pages vs Worker, bindings, paid Workers |
| [rag-and-timeline.md](./rag-and-timeline.md) | Project catalog, events schema, retrieval |
| [sources.md](./sources.md) | Wiki allowlist, news sources, NTRS/JAXA ingest, exclusions |
| [operations.md](./operations.md) | Commands, Pages Git deploy, secrets, current schedules |

User-facing README files must not grow command tables, deploy steps, secret names, or schemas. Put those here.
