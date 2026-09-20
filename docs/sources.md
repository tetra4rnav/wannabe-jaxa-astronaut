# Sources

Wiki citations and RAG ingest are stricter than the news column.

## Wiki allowlist

Canonical check: [`src/config/official-domains.ts`](../src/config/official-domains.ts) (`isOfficialUrl`). Host must equal a listed domain or be a subdomain of one.

Current allowlist (agencies and official program sites): JAXA properties, Cabinet Office / MEXT, NASA, ESA, Roscosmos, CMSE / CNSA, SpaceX, UNOOSA, U.S. State Department.

Wiki rules:

- Body, summaries, and figures cite **only** allowlisted official primary URLs.
- Interviews: official profiles, press briefings, official channels of those domains.
- No full-text republication; summarize and link.
- Wikipedia, journalism, blogs, social posts, and secondary explainers are **not** wiki sources. They may be a lead to find an official URL.

`npm run wiki:audit` fails the build path if wiki Markdown cites a non-allowlisted URL (see [operations.md](./operations.md)).

## News column (not wiki RAG)

News ingest is official RSS/HTML lists and official X handles:

- Feeds: [`src/config/feeds.ts`](../src/config/feeds.ts) — JAXA press, NASA, ESA, SpaceX updates, Roscosmos, CMSE, CNSA.
- X: [`src/config/x-accounts.ts`](../src/config/x-accounts.ts) — JAXA, NASA, ISS, ESA, SpaceX, Roscosmos.

Non-Japanese titles/summaries are machine-translated for display (DeepL if `DEEPL_API_KEY` is set). The same URL is not re-translated.

Journalism outlets (for example SpaceNews or TASS) must **not** be mixed into wiki pages or into wiki/official RAG. If a news-only outlet is ever listed for the news UI, it stays news-only.

## NTRS / JAXA ingest (target)

Later ingest may pull **abstracts and bibliographic records** from NASA NTRS and JAXA repositories, tagged to catalog projects. **Bulk PDF full-text extraction is forbidden.** Each URL still has to pass `isOfficialUrl` before it becomes a `documents` / `events` row of kind `paper` or `official`.

## Exclusions

| Keep out | Why |
| --- | --- |
| Wikipedia, news media, blogs, unofficial SNS | Not primary official sources for wiki or RAG |
| Catalog names invented by the LLM | Humans extend `projects` |
| Public in-site chat | Retrieval is for timeline UI, proposals, and audit |
| Wiki body written by the model | Humans write; model proposes and audits |
