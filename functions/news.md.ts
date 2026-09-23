import { newsFileToMarkdown } from './_lib/store';
import { loadNewsFromD1 } from './_lib/d1-news';

interface Env {
	DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	try {
		const news = await loadNewsFromD1(context.env.DB);
		return new Response(newsFileToMarkdown(news), {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Cache-Control': 'public, max-age=60',
			},
		});
	} catch {
		return new Response('# ニュース\n\n（まだデータがありません）\n', {
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
		});
	}
};
