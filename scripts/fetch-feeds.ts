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
	const feedOrigin = new URL(feed.url).origin;

	while ((m = re.exec(html)) && out.length < 40) {
		let href = m[1]!;
		let title = m[2]!.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
		// List scrapers often wrap whole blocks; keep a headline-sized string
		title = title.split(/(?=\d{4}[-/.年]\d{1,2})/)[0]?.trim() || title;
		if (title.length > 80) title = `${title.slice(0, 79).replace(/\s+\S*$/, '').trim()}…`;
		if (title.length < 8) continue;
		try {
			href = new URL(href, feed.url).toString();
		} catch {
			continue;
		}
		if (seen.has(href)) continue;
		seen.add(href);
		if (href === feed.url || href === `${feed.url.replace(/\/$/, '')}/`) continue;
		try {
			const u = new URL(href);
			if (u.origin !== feedOrigin && feed.region !== 'spacex') continue;
			if (feed.region === 'china') {
				const article =
					/content\.html?$/i.test(u.pathname) ||
					/\/c\d+\//.test(u.pathname) ||
					/\/t\d{8,}/i.test(u.pathname);
				if (!article || /\/(kpjy|dmt|hdjl)\//i.test(u.pathname)) continue;
			}
		} catch {
			continue;
		}

		const keywordOk = matchesKeywords(title, NEWS_KEYWORDS);
		let keep = keywordOk;
		if (!keep) {
			if (feed.region === 'japan' && /jaxa\.jp/i.test(href) && /press|topics|news/i.test(href)) keep = true;
			else if (feed.region === 'russia' && /roscosmos\.ru/i.test(href) && /\/\d{4,}\/?$/.test(href)) keep = true;
			else if (feed.region === 'spacex' && /spacex\.com/i.test(href)) keep = true;
		}
		if (!keep) continue;

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
