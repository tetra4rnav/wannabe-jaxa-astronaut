import { XMLParser } from 'fast-xml-parser';
import { FEEDS, NEWS_KEYWORDS, type FeedConfig } from '../src/config/feeds.ts';
import type { NewsItem } from '../src/utils/news-types.ts';
import { fetchText, hashId, matchesKeywords, truncate } from './lib.ts';
import { translateToJa } from './translate.ts';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	trimValues: true,
});

function asArray<T>(v: T | T[] | undefined | null): T[] {
	if (!v) return [];
	return Array.isArray(v) ? v : [v];
}

function pickLink(item: Record<string, unknown>): string {
	const link = item.link;
	if (typeof link === 'string') return link;
	if (link && typeof link === 'object') {
		const obj = link as Record<string, string>;
		return obj['@_href'] || obj['#text'] || '';
	}
	const guid = item.guid;
	if (typeof guid === 'string') return guid;
	if (guid && typeof guid === 'object') return String((guid as { '#text'?: string })['#text'] ?? '');
	return '';
}

function pickText(...vals: unknown[]): string {
	for (const v of vals) {
		if (typeof v === 'string' && v.trim()) return v.trim();
		if (v && typeof v === 'object' && '#text' in (v as object)) {
			const t = String((v as { '#text': string })['#text'] ?? '').trim();
			if (t) return t;
		}
	}
	return '';
}

async function parseRss(feed: FeedConfig, xml: string): Promise<Omit<NewsItem, 'titleJa' | 'summaryJa' | 'machineTranslated'>[]> {
	const doc = parser.parse(xml);
	const channel = doc.rss?.channel ?? doc.feed;
	if (!channel) return [];
	const items = asArray(channel.item ?? channel.entry);
	const out: Omit<NewsItem, 'titleJa' | 'summaryJa' | 'machineTranslated'>[] = [];
	const retrievedAt = new Date().toISOString();

	for (const raw of items) {
		const item = raw as Record<string, unknown>;
		const title = pickText(item.title);
		const summary = truncate(
			pickText(item.description, item.summary, item.content, item['content:encoded']).replace(/<[^>]+>/g, ''),
		);
		const url = pickLink(item);
		if (!title || !url) continue;
		const hay = `${title} ${summary}`;
		if (!matchesKeywords(hay, NEWS_KEYWORDS)) continue;
		const publishedAt = pickText(item.pubDate, item.published, item.updated, item['dc:date']) || retrievedAt;
		out.push({
			id: hashId(url),
			url,
			kind: 'rss',
			lang: feed.lang,
			region: feed.region,
			sourceLabel: feed.label,
			sourceId: feed.id,
			publishedAt: new Date(publishedAt).toISOString(),
			retrievedAt,
			titleOriginal: title,
			summaryOriginal: summary,
		});
	}
	return out;
}

async function parseHtmlList(
	feed: FeedConfig,
	html: string,
): Promise<Omit<NewsItem, 'titleJa' | 'summaryJa' | 'machineTranslated'>[]> {
	const retrievedAt = new Date().toISOString();
	const out: Omit<NewsItem, 'titleJa' | 'summaryJa' | 'machineTranslated'>[] = [];
	const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
	let m: RegExpExecArray | null;
	const seen = new Set<string>();
	while ((m = re.exec(html)) && out.length < 40) {
		let href = m[1]!;
		const title = m[2]!.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
		if (!title || title.length < 4) continue;
		try {
			href = new URL(href, feed.url).toString();
		} catch {
			continue;
		}
		if (seen.has(href)) continue;
		seen.add(href);
		if (!matchesKeywords(`${title}`, NEWS_KEYWORDS) && feed.region !== 'spacex') {
			// For SpaceX updates page, keep recent-looking anchors with spacex.com path
			if (!href.includes('spacex.com')) continue;
			if (title.length < 8) continue;
		} else if (!matchesKeywords(`${title}`, NEWS_KEYWORDS)) {
			continue;
		}
		out.push({
			id: hashId(href),
			url: href,
			kind: 'html-list',
			lang: feed.lang,
			region: feed.region,
			sourceLabel: feed.label,
			sourceId: feed.id,
			publishedAt: retrievedAt,
			retrievedAt,
			titleOriginal: title,
			summaryOriginal: truncate(title, 200),
		});
	}
	return out;
}

export async function fetchFeeds(): Promise<NewsItem[]> {
	const results: NewsItem[] = [];
	for (const feed of FEEDS) {
		const text = await fetchText(feed.url);
		if (!text) continue;
		try {
			const raw =
				feed.kind === 'rss' ? await parseRss(feed, text) : await parseHtmlList(feed, text);
			for (const item of raw) {
				const title = await translateToJa(item.titleOriginal, item.lang);
				const summary = await translateToJa(item.summaryOriginal, item.lang);
				results.push({
					...item,
					titleJa: title.text,
					summaryJa: summary.text,
					machineTranslated: title.machineTranslated || summary.machineTranslated,
				});
			}
			console.log(`[feeds] ${feed.id}: ${raw.length} items`);
		} catch (err) {
			console.warn(`[feeds] ${feed.id} parse failed`, err);
		}
	}
	return results;
}
