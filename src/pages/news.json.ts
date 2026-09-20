import type { APIRoute } from 'astro';
import news from '../data/news.json';

export const prerender = true;

export const GET: APIRoute = () => {
	return new Response(JSON.stringify(news, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
	});
};
