import type { NewsFile } from '@/utils/news-types';
import localNews from '@/data/news.json';

export const NEWS_KV_KEY = 'news:file';

const empty: NewsFile = {
	updatedAt: new Date(0).toISOString(),
	xConfigured: false,
	items: [],
};

function asNewsFile(raw: unknown): NewsFile | null {
	if (!raw || typeof raw !== 'object') return null;
	const file = raw as NewsFile;
	if (!Array.isArray(file.items)) return null;
	return file;
}

/** Live news from KV when bound; otherwise bundled `src/data/news.json`. */
export async function loadNewsFile(): Promise<NewsFile> {
	try {
		const { env } = await import('cloudflare:workers');
		const fromKv = await env.STORE?.get(NEWS_KV_KEY);
		if (fromKv) {
			const parsed = asNewsFile(JSON.parse(fromKv));
			if (parsed) return parsed;
		}
	} catch {
		/* local Node prerender / missing binding */
	}

	const bundled = asNewsFile(localNews);
	return bundled ?? empty;
}
