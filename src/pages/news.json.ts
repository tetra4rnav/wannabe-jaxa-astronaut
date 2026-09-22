import type { APIRoute } from 'astro';
import { loadNewsFile } from '@/lib/news-store';

export const prerender = false;

export const GET: APIRoute = async () => {
	const news = await loadNewsFile();
	return new Response(JSON.stringify(news), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60',
		},
	});
};
