import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = (context) => {
	const email = context.locals.user?.email ?? null;
	return Response.json({ email });
};
