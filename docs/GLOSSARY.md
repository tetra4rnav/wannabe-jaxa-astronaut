# Glossary (ubiquitous language)

Use these terms in code comments, specs, commits, and UI copy. Prefer the English key in identifiers; Japanese gloss is for reader-facing text.

| Term | Japanese | Meaning |
| --- | --- | --- |
| **News** | ニュース | Official feed / official X items collected for display and (when gated) the knowledge base. |
| **Knowledge base** | 知識ベース | Project-scoped RAG corpus (R2 chunks + Vectorize) of official HTML and gated news. |
| **Wiki** | Wiki | Human-written study pages under `src/content/docs/` (deferred surface). |
| **Project** | プロジェクト / 計画・事業 | Named entry in the human project catalog. |
| **Seed** | 種 | In-scope project where Japan participates. |
| **Related** | 関係先 | In-scope international / commercial project linked by Japan participation or seed dependency / partnership / succession. |
| **Retired** | 引退 | Catalog slug kept for pages and old events; not newly classified. |
| **Relation** | 関係 | Config edge: `partner` / `depends_on` / `successor`. Used for UI and 1-hop Graph RAG expansion. |
| **Graph RAG** | Graph RAG | Retrieve path that expands classified project slugs via Relations (maxHops = 1) before Vectorize filter. |
| **Event** | 出来事 | Dated row on a project timeline (`occurred_at`). |
| **Proposal** | Wiki の案 | LLM suggestion for a new or updated wiki page (deferred). |
| **Fact-check** | ファクトチェック / 監査 | LLM audit of wiki claims; append-only history. |
| **Allowlist** | 許可リスト | Domains / feeds / X handles permitted for wiki or news. |
| **Corpus** | コーパス | Synonym for the ingested official chunks (knowledge base). |
| **Timeline** | 時系列 | Chronological mix of events for one project. |
| **Unassigned** | 未分類 | News that could not be tagged to an in-scope project. |
| **Ingest gate** | 取り込みゲート | LLM decision that news is news-like and trustworthy enough for RAG evidence. |
| **countries / kindJa** | 国 / 種別（表示用） | Site-only catalog display fields. Not graph nodes; must not enter RAG. |
| **Runtime SoT** | 実行時の正 | D1 for catalog, news feed, and proposals ([ADR-20260923-1](./specs/ADR-20260923-1-runtime-d1-sot.md)); TypeScript / KV are seed or migration fallback. |
| **Admin** | 管理画面 | Cloudflare Access–protected `/admin` for catalog CRUD (impl [#12](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/issues/12)). |

Do not use “article brief” for LLM news essays—the product has **proposals**, not auto-written news articles. Agency, vehicle, and budget line are not catalog entity types.
