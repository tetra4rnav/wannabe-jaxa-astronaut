import { defineMiddleware } from 'astro:middleware';
import { createAuth, getRuntimeEnv } from './lib/auth';
import { isAdminOpen, isOperator, parseAdminEmails, safeNext } from './lib/operator-access';

function plain(status: number, message: string): Response {
	return new Response(message, {
		status,
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
}

export const onRequest = defineMiddleware(async (context, next) => {
	const path = context.url.pathname;
	const env = await getRuntimeEnv();
	context.locals.user = null;
	context.locals.session = null;
	context.locals.adminOpen = isAdminOpen(env);

	const skipSession = path.startsWith('/api/auth') || path.startsWith('/api/operator');
	if (!skipSession && env?.DB && env.BETTER_AUTH_SECRET) {
		try {
			const auth = createAuth(env, context.url);
			const result = await auth.api.getSession({ headers: context.request.headers });
			if (result) {
				context.locals.user = {
					id: result.user.id,
					email: result.user.email,
					name: result.user.name,
					role: result.user.role,
				};
				context.locals.session = { id: result.session.id };
			}
		} catch {
			context.locals.user = null;
			context.locals.session = null;
		}
	}

	if (!path.startsWith('/admin')) return next();
	if (context.locals.adminOpen) return next();

	const user = context.locals.user;
	if (isOperator(user, parseAdminEmails(env?.ADMIN_EMAILS))) return next();

	if (path.startsWith('/admin/api')) {
		return plain(user ? 403 : 401, user ? '権限がありません' : 'ログインが必要です');
	}
	const nextPath = safeNext(`${path}${context.url.search}`);
	return context.redirect(`/login?next=${encodeURIComponent(nextPath)}`);
});
