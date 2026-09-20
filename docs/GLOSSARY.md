# Glossary (ubiquitous language)

Use these terms in code comments, specs, commits, and UI copy. Prefer the English key in identifiers; Japanese gloss is for reader-facing text.

| Term | Japanese | Meaning |
| --- | --- | --- |
| **News** | ニュース | Official feed / official X items collected for display. Not a wiki source. |
| **Wiki** | Wiki | Human-written study pages under `src/content/docs/`. |
| **Project** | プロジェクト / 計画・事業 | Named entry in the human project catalog. |
| **Event** | 出来事 | Dated row on a project timeline (`occurred_at`). |
| **Proposal** | Wiki の案 | LLM suggestion for a new or updated wiki page. |
| **Fact-check** | ファクトチェック / 監査 | LLM audit of wiki claims; append-only history. |
| **Allowlist** | 許可リスト | Domains / feeds / X handles permitted for wiki or news. |
| **Corpus** | コーパス | Ingested official chunks for retrieval (timeline RAG). |
| **Timeline** | 時系列 | Chronological mix of events for one project. |
| **Unassigned** | 未分類 | News that could not be tagged to a catalog project. |
| **Ingest gate** | 取り込みゲート | LLM decision that news is news-like and trustworthy enough for RAG evidence. |

Do not use “article brief” for LLM news essays—the product has **proposals**, not auto-written news articles.
