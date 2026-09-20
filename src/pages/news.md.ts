import type { APIRoute } from 'astro';
import news from '../data/news.json';
import type { NewsItem } from '../utils/news-types';

export const prerender = true;

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

export const GET: APIRoute = () => {
	const items = news.items as NewsItem[];
	const body = [
		'# ニュース（原語＋日本語）',
		'',
		`updatedAt: ${news.updatedAt}`,
		`xConfigured: ${news.xConfigured}`,
		'',
		'機械翻訳が含まれる場合があります。',
		'',
		...items.map(renderItem),
	].join('\n');

	return new Response(body, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
