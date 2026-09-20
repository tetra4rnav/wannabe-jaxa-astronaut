import type { NewsFile } from '../src/utils/news-types';
import { NEWS_KV_KEY } from '../shared/news/format';

interface Env {
	STORE: KVNamespace;
}

const GITHUB_FALLBACK =
	'https://raw.githubusercontent.com/tetra4rnav/wannabe-jaxa-astronaut/main/src/data/news.json';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const fromKv = await context.env.STORE?.get(NEWS_KV_KEY);
	if (fromKv) {
		return new Response(fromKv, {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=60',
			},
		});
	}

	try {
		const res = await fetch(GITHUB_FALLBACK);
		if (res.ok) {
			const text = await res.text();
			return new Response(text, {
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Cache-Control': 'public, max-age=60',
				},
			});
		}
	} catch {
		/* ignore */
	}

	const empty: NewsFile = {
		updatedAt: new Date(0).toISOString(),
		xConfigured: false,
		items: [],
	};
	return new Response(JSON.stringify(empty, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
