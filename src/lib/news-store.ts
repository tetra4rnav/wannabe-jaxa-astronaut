import type { NewsFile } from '@/utils/news-types';
import localNews from '@/data/news.json';
import { loadNewsFromD1 } from '../../shared/news/d1-store.ts';

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

/** Live news from D1 when bound; otherwise bundled `src/data/news.json`. */
export async function loadNewsFile(): Promise<NewsFile> {
	try {
		const { env } = await import('cloudflare:workers');
		if (env.DB) {
			const fromD1 = await loadNewsFromD1(env.DB);
			if (fromD1.items.length) return fromD1;
		}
	} catch {
		/* local Node prerender / missing binding */
	}

	const bundled = asNewsFile(localNews);
	return bundled ?? empty;
}
