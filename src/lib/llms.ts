import { getCollection } from 'astro:content';
import { SITE_DESCRIPTION, SITE_TITLE } from './site';
import { docIdToSlug, slugToHref, slugToMdHref } from './docs';

const SITE = 'https://wannabe-jaxa-astronaut.diaphana.io';

async function wikiDocs() {
	const docs = await getCollection('docs');
	return docs
		.filter((d) => !d.id.replace(/\\/g, '/').includes('_template') && !d.data.draft)
		.sort((a, b) => a.id.localeCompare(b.id));
}

function pageUrl(slug: string): string {
	return `${SITE}${slugToHref(slug)}`;
}

export async function llmsIndex(): Promise<string> {
	const docs = await wikiDocs();
	const links = docs
		.map((doc) => {
			const slug = docIdToSlug(doc.id);
			const desc = doc.data.description ? `: ${doc.data.description}` : '';
			return `- [${doc.data.title}](${pageUrl(slug)})${desc}`;
		})
		.join('\n');
	return `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

重要な制約:
- 本サイトは JAXA / 宇宙機関の公式サイトではありません。
- Wiki 本文・数字は許可ドメイン上の公式一次資料のみを根拠にします（Wikipedia・報道・SNSは出典にしない）。
- エージェントは HTML を直接編集せず、リポジトリの Markdown を監査・加筆してください。手順は AGENTS.md を参照。
- 外部 RAG は /corpus/chunks.jsonl を取り込み、サイト内 Vectorize / チャット API はありません。

## ページ

${links}

## 任意リンク

- [エージェント契約 (AGENTS.md)](https://github.com/tetra4rnav/wannabe-jaxa-astronaut/blob/main/AGENTS.md): Wiki の読み書き・監査ルール
- [RAG コーパス manifest](${SITE}/corpus/manifest.json): チャンク数・スキーマ版
- [ニュース JSON](${SITE}/news.json): 原語＋日本語のニュース一覧
`;
}

export async function llmsSmall(): Promise<string> {
	const docs = await wikiDocs();
	return docs
		.map((doc) => {
			const slug = docIdToSlug(doc.id);
			return `# ${doc.data.title}\n${pageUrl(slug)}\n${doc.data.description ?? ''}\n`;
		})
		.join('\n');
}

export async function llmsFull(): Promise<string> {
	const docs = await wikiDocs();
	return docs
		.map((doc) => {
			const slug = docIdToSlug(doc.id);
			const body = 'body' in doc && typeof doc.body === 'string' ? doc.body : '';
			return `# ${doc.data.title}\n\n- HTML: ${pageUrl(slug)}\n- Markdown: ${SITE}${slugToMdHref(slug)}\n\n${body.trim()}\n`;
		})
		.join('\n---\n\n');
}
