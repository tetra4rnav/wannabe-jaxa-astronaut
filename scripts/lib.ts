import { createHash } from 'node:crypto';
import type { NewsItem } from '../src/utils/news-types.ts';

export function hashId(parts: string): string {
	return createHash('sha256').update(parts).digest('hex').slice(0, 16);
}

export function matchesKeywords(text: string, keywords: string[]): boolean {
	const lower = text.toLowerCase();
	return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function truncate(text: string, max = 280): string {
	const t = text.replace(/\s+/g, ' ').trim();
	if (t.length <= max) return t;
	return `${t.slice(0, max - 1)}…`;
}

export async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
	try {
		const res = await fetch(url, {
			...init,
			headers: {
				Accept: '*/*',
				'User-Agent': 'wannabe-jaxa-astronaut-news-bot/1.0 (+https://github.com/tetra4rnav/wannabe-jaxa-astronaut)',
				...(init?.headers ?? {}),
			},
		});
		if (!res.ok) {
			console.warn(`[fetch] ${url} -> ${res.status}`);
			return null;
		}
		const buf = await res.arrayBuffer();
		return new TextDecoder('utf-8').decode(buf);
	} catch (err) {
		console.warn(`[fetch] ${url} failed:`, err);
		return null;
	}
}

export function mergeByUrl(existing: NewsItem[], incoming: NewsItem[]): NewsItem[] {
	const map = new Map<string, NewsItem>();
	for (const item of existing) map.set(item.url, item);
	for (const item of incoming) {
		const prev = map.get(item.url);
		if (prev) {
			map.set(item.url, {
				...item,
				titleJa: prev.titleJa || item.titleJa,
				summaryJa: prev.summaryJa || item.summaryJa,
				machineTranslated: prev.machineTranslated || item.machineTranslated,
			});
		} else {
			map.set(item.url, item);
		}
	}
	return [...map.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
