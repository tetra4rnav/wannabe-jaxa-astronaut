/** Helpers colocated under functions/ so Pages Functions bundler can resolve them. */

export type NewsItem = {
	id: string;
	url: string;
	kind: string;
	lang: string;
	region: string;
	sourceLabel: string;
	sourceId: string;
	publishedAt: string;
	retrievedAt: string;
	titleOriginal: string;
	summaryOriginal: string;
	titleJa: string;
	summaryJa: string;
	accountHandle?: string;
	machineTranslated: boolean;
};

export type NewsFile = {
	updatedAt: string;
	xConfigured: boolean;
	items: NewsItem[];
};

export type FactCheckFile = {
	id: string;
	entries: unknown[];
};

export const NEWS_KV_KEY = 'news:file';
export const NEWS_MD_KV_KEY = 'news:md';

export function factCheckKvKey(docsId: string): string {
	return `fact-check:${docsId.replace(/\\/g, '/').replace(/^\//, '')}`;
}

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
	return [
		'# ニュース（原語＋日本語）',
		'',
		`updatedAt: ${news.updatedAt}`,
		`xConfigured: ${news.xConfigured}`,
		'',
		'機械翻訳が含まれる場合があります。',
		'',
		...news.items.map(renderItem),
	].join('\n');
}
