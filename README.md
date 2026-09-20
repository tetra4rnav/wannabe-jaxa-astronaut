# JAXA宇宙飛行士志望Wiki（非公式）

Astro Starlight の日本語静的サイト。Wiki は公式一次資料のみ。ニュースは各国公式フィード / 公式 X の原語＋日本語対照。**Cloudflare Pages** にデプロイします。

## コマンド

| Command | Action |
| --- | --- |
| `npm install` | 依存関係 |
| `npm run dev` | 開発サーバ |
| `npm run build` | コーパス生成 + 本番ビルド → `dist/` |
| `npm run fetch:news` | RSS/HTML/X 取得 → `src/data/news.json` |
| `npm run wiki:audit` | 公式ドメイン監査 |
| `npm run corpus:build` | `/corpus/*.jsonl` 生成 |
| `npm run deploy` | （任意）ローカル build + Pages Direct Upload。通常は Git push |

## ライブ URL

- サイト: https://wannabe-jaxa-astronaut.pages.dev
- GitHub: https://github.com/tetra4rnav/wannabe-jaxa-astronaut

旧 `*.workers.dev` Worker は削除済み。デプロイは Pages Git 連携のみです。

## デプロイ

**本番は Cloudflare Pages の Git 連携**（`tetra4rnav/wannabe-jaxa-astronaut` → `main`）。

| 項目 | 値 |
| --- | --- |
| Build command | `npm run build` |
| Build output | `dist` |
| Production branch | `main` |

`main` への push と PR で自動ビルド・プレビューされます。手動 Direct Upload は通常不要です。

```bash
# 緊急時のみ（通常は Git push）
npx wrangler pages deploy ./dist --project-name=wannabe-jaxa-astronaut
```

### Cloudflare ボット設定（重要）

このサイトは OAI-SearchBot / GPTBot / ClaudeBot / Googlebot など AI・検索クローラ向けに公開しています。**Bot Fight Mode** や **AI Crawl Control / AI クローラ遮断**、WAF でボットを 403 にするルールは有効にしないでください。`public/robots.txt` は全面 `Allow` です。

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
