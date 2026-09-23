import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	const path = context.url.pathname;
	if (!path.startsWith('/admin')) return next();

	if (import.meta.env.DEV) return next();

	const runtimeEnv = (
		context.locals as { runtime?: { env?: { ADMIN_OPEN?: string } } }
	).runtime?.env;
	const adminOpen = runtimeEnv?.ADMIN_OPEN === '1' || runtimeEnv?.ADMIN_OPEN === 'true';
	if (adminOpen) return next();

	const jwt = context.request.headers.get('Cf-Access-Jwt-Assertion');
	if (!jwt) {
		return new Response('Unauthorized — Cloudflare Access required', {
			status: 401,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		});
	}
	return next();
});
