---
title: このサイトについて
description: 非公式であること、収集方法、Wikiの出典方針、エージェント向け情報。
---

## 非公式であることの明示

本サイト（JAXA宇宙飛行士志望Wiki）は **JAXA・NASA・ESA 等の公式サイトではありません**。個人・コミュニティ向けの学習用静的サイトです。選抜応募や公式手続きは各機関の公式ページを参照してください。

## Wiki の方針

- 本文・要約・数字は **許可リスト上の公式一次資料** のみを根拠にします。
- Wikipedia、報道、ブログ、SNS、二次解説は Wiki の出典にしません（手がかりにはしてよいが引用しない）。
- インタビューは JAXA / NASA 等の公式プロフィール、記者会見、公式チャンネルに限ります。
- 全文転載はしません。要約と公式 URL を示します。
- 必須 frontmatter: `title`、`description`、`sources`（公式 URL 配列）、`reviewed`。
- ファクトチェック履歴は `src/data/fact-checks/<docs-id>.json` に追記のみ（本文と分離）。

許可ドメインは [`src/config/official-domains.ts`](https://github.com/jh1cid/wannabe-jaxa-astronaut/blob/main/src/config/official-domains.ts) を参照。

## テーマ（フォルダ）の足し方

1. `src/content/docs/<slug>/` を作る（スラッグは英数字）。
2. `index.md` に日本語の `title` を書く。
3. 記事 Markdown を置く（テンプレート: `src/content/docs/_template/`）。
4. サイドバーとトップの案内はフォルダ走査で自動更新されます（`astro.config` への手書き追加は不要）。

## ニュースの収集方法

- GitHub Actions が **6 時間ごと** に RSS / HTML 一覧と公式 X（API）を取得し、差分があれば `src/data/news.json` をコミットします。
- 日本語以外はタイトルと短文のみ機械翻訳します（同一 URL は再翻訳しません）。`DEEPL_API_KEY` があれば DeepL、無ければキーなし API を使います。
- X は公式アカウントのみ。`X_BEARER_TOKEN` が無いときは X をスキップし、本ページとニュースページに未設定と表示します。
- SpaceNews / TASS などの報道はニュース欄専用で、Wiki には混ぜません。

## LLM / エージェント向け

- 契約: リポジトリ直下の [AGENTS.md](https://github.com/jh1cid/wannabe-jaxa-astronaut/blob/main/AGENTS.md)
- 正本: `src/content/docs/**/*.md`
- 各ページの `.md` 鏡像、`/llms.txt`、`/news.md`、`/news.json`
- 外部 RAG: `/corpus/*.jsonl`（サイト内 Vectorize / チャット API はありません）
- `npm run wiki:audit` で出典ドメインを検査

### RAG コーパスの取り込み

1. `/corpus/manifest.json` でスキーマ版と件数を確認
2. `/corpus/chunks.jsonl`（または `wiki.jsonl` / `news.jsonl`）を埋め込みインデックスへ流す
3. Wiki 変更・ニュース更新後は `npm run corpus:build`（`astro build` の前にも実行）
