import { createHash } from 'node:crypto';
import { isOfficialUrl } from '../../src/config/official-domains.ts';

const EMBED_MODEL = '@cf/qwen/qwen3-embedding-0.6b';

export function contentHash(text: string): string {
	return createHash('sha256').update(text).digest('hex').slice(0, 32);
}

export function stripHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function chunkText(text: string, max = 800): string[] {
	const clean = text.trim();
	if (!clean) return [];
	if (clean.length <= max) return [clean];
	const out: string[] = [];
	for (let i = 0; i < clean.length; i += max) {
		out.push(clean.slice(i, i + max));
	}
	return out;
}

export async function fetchPageText(url: string): Promise<string | null> {
	if (!isOfficialUrl(url)) return null;
	try {
		const res = await fetch(url, {
			headers: {
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'User-Agent':
					'wannabe-jaxa-astronaut-ingest/1.0 (+https://github.com/tetra4rnav/wannabe-jaxa-astronaut)',
			},
		});
		if (!res.ok) return null;
		const ct = res.headers.get('content-type') ?? '';
		const raw = await res.text();
		if (ct.includes('html') || raw.trimStart().startsWith('<')) {
			return stripHtml(raw).slice(0, 20000);
		}
		return raw.slice(0, 20000);
	} catch {
		return null;
	}
}

export async function embedTexts(ai: Ai, texts: string[]): Promise<number[][]> {
	if (!texts.length) return [];
	const result = (await ai.run(EMBED_MODEL as Parameters<Ai['run']>[0], {
		text: texts,
	})) as { data?: number[][] };
	return result.data ?? [];
}

export type NtrsHit = {
	url: string;
	title: string;
	abstract: string;
	published?: string;
};

/** NASA NTRS public search — abstracts only. */
export async function searchNtrs(query: string, limit = 5): Promise<NtrsHit[]> {
	const url = new URL('https://ntrs.nasa.gov/api/citations/search');
	url.searchParams.set('q', query);
	url.searchParams.set('page.size', String(limit));
	try {
		const res = await fetch(url.toString(), {
			headers: { Accept: 'application/json', 'User-Agent': 'wannabe-jaxa-astronaut-ingest/1.0' },
		});
		if (!res.ok) {
			console.warn(`[ntrs] ${res.status} for ${query}`);
			return [];
		}
		const data = (await res.json()) as {
			results?: {
				id?: string;
				title?: string;
				abstract?: string;
				publishedDate?: string;
				downloadsAvailable?: boolean;
			}[];
		};
		const out: NtrsHit[] = [];
		for (const r of data.results ?? []) {
			if (!r.id || !r.title || !r.abstract) continue;
			out.push({
				url: `https://ntrs.nasa.gov/citations/${r.id}`,
				title: r.title,
				abstract: r.abstract.slice(0, 4000),
				published: r.publishedDate,
			});
		}
		return out;
	} catch (err) {
		console.warn('[ntrs] failed', err);
		return [];
	}
}
