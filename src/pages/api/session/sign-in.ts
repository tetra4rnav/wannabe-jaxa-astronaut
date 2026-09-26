import type { APIRoute } from 'astro';
import { createAuth, getRuntimeEnv } from '../../../lib/auth';
import { safeNext } from '../../../lib/operator-access';

export const prerender = false;

function redirectWithCookies(location: string, source: Response): Response {
	const headers = new Headers();
	for (const cookie of source.headers.getSetCookie()) {
		headers.append('set-cookie', cookie);
	}
	headers.set('location', location);
	return new Response(null, { status: 303, headers });
}

export const POST: APIRoute = async (context) => {
	const env = await getRuntimeEnv();
	const form = await context.request.formData();
	const next = safeNext(String(form.get('next') ?? ''));
	const fail = () => context.redirect(`/login?error=1&next=${encodeURIComponent(next)}`);

	if (!env?.DB || !env.BETTER_AUTH_SECRET) return fail();

	const email = String(form.get('email') ?? '').trim();
	const password = String(form.get('password') ?? '');
	const auth = createAuth(env, context.url);
	const result = await auth.api.signInEmail({
		body: { email, password },
		headers: context.request.headers,
		asResponse: true,
	});
	if (!result.ok) return fail();
	return redirectWithCookies(next, result);
};
