# JAXA宇宙飛行士志望Wiki（非公式）

Astro Starlight の日本語静的サイト。Wiki は公式一次資料のみ。ニュースは各国公式フィード / 公式 X の原語＋日本語対照。Cloudflare Workers Static Assets にデプロイします。

## コマンド

| Command | Action |
| --- | --- |
| `npm install` | 依存関係 |
| `npm run dev` | 開発サーバ |
| `npm run build` | コーパス生成 + 本番ビルド → `dist/` |
| `npm run fetch:news` | RSS/HTML/X 取得 → `src/data/news.json` |
| `npm run wiki:audit` | 公式ドメイン監査 |
| `npm run corpus:build` | `/corpus/*.jsonl` 生成 |
| `npm run deploy` | build + `wrangler deploy` |

## ライブ URL

- サイト: https://wannabe-jaxa-astronaut.jh1cid.workers.dev
- GitHub: https://github.com/tetra4rnav/wannabe-jaxa-astronaut

## デプロイ

- Build: `npm run build`
- Deploy: `npx wrangler deploy`（`wrangler.jsonc` の `assets.directory` = `./dist`）
- Workers Builds を使う場合は GitHub リポを Cloudflare に接続

### 必要な Secrets（GitHub）

| Secret | 用途 |
| --- | --- |
| `X_BEARER_TOKEN` | 公式 X 取得（無いと X スキップ） |
| `DEEPL_API_KEY` | 任意。DeepL 翻訳 |
| `CF_ACCOUNT_ID` | 週次ファクトチェック（Workers AI） |
| `CF_API_TOKEN` | Workers AI 呼び出し用 API トークン |
| `CF_AI_MODEL` | 任意。既定 `@cf/meta/llama-3.1-8b-instruct` |

ローカルデプロイには `wrangler login`（または Cloudflare API トークン）が必要です。

## エージェント向け

契約は [AGENTS.md](./AGENTS.md)。RAG は `/corpus/chunks.jsonl`（サイト内チャット API なし）。
