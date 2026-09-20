import type { NewsFile, NewsItem } from '../../src/utils/news-types.ts';

function renderItem(item: NewsItem): string {
	const lines = [
		`### ${item.titleJa || item.titleOriginal}`,
		'',
		`- source: ${item.sourceLabel}${item.accountHandle ? ` (@${item.accountHandle})` : ''}`,
		`- kind: ${item.kind} · region: ${item.region} · lang: ${item.lang}`,
		`- published: ${item.publishedAt}`,
		`- url: ${item.url}`,
		`- machineTranslated: ${item.machineTranslated}`,
		'',
		`**原語 (${item.lang})**`,
		'',
		item.titleOriginal,
		'',
		item.summaryOriginal,
		'',
		'**日本語**',
		'',
		item.titleJa,
		'',
		item.summaryJa,
		'',
	];
	return lines.join('\n');
}

export function newsFileToMarkdown(news: NewsFile): string {
	const items = news.items as NewsItem[];
	return [
		'# ニュース（原語＋日本語）',
		'',
		`updatedAt: ${news.updatedAt}`,
		`xConfigured: ${news.xConfigured}`,
		'',
		'機械翻訳が含まれる場合があります。',
		'',
		...items.map(renderItem),
	].join('\n');
}

export const NEWS_KV_KEY = 'news:file';
export const NEWS_MD_KV_KEY = 'news:md';

export function factCheckKvKey(docsId: string): string {
	return `fact-check:${docsId.replace(/\\/g, '/').replace(/^\//, '')}`;
}
