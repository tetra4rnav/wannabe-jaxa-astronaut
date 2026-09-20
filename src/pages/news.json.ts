import type { APIRoute } from 'astro';
import news from '../data/news.json';

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(news), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60',
		},
	});
