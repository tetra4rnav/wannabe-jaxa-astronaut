import {
	NEWS_KV_KEY,
	NEWS_MD_KV_KEY,
	newsFileToMarkdown,
	type NewsFile,
} from './_lib/store';

interface Env {
	STORE: KVNamespace;
}

const GITHUB_FALLBACK =
	'https://raw.githubusercontent.com/tetra4rnav/wannabe-jaxa-astronaut/main/src/data/news.json';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const md = await context.env.STORE?.get(NEWS_MD_KV_KEY);
	if (md) {
		return new Response(md, {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Cache-Control': 'public, max-age=60',
			},
		});
	}

	const json = await context.env.STORE?.get(NEWS_KV_KEY);
	if (json) {
		try {
			const news = JSON.parse(json) as NewsFile;
			return new Response(newsFileToMarkdown(news), {
				headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			});
		} catch {
			/* fall through */
		}
	}

	try {
		const res = await fetch(GITHUB_FALLBACK);
		if (res.ok) {
			const news = (await res.json()) as NewsFile;
			return new Response(newsFileToMarkdown(news), {
				headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			});
		}
	} catch {
		/* ignore */
	}

	return new Response('# ニュース\n\n（まだデータがありません）\n', {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
