import type { APIRoute } from 'astro';
import { createAuth, getRuntimeEnv } from '../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
	const env = await getRuntimeEnv();
	const headers = new Headers({ location: '/' });
	if (env?.DB && env.BETTER_AUTH_SECRET) {
		const auth = createAuth(env, context.url);
		const result = await auth.api.signOut({
			headers: context.request.headers,
			asResponse: true,
		});
		for (const cookie of result.headers.getSetCookie()) {
			headers.append('set-cookie', cookie);
		}
	}
	return new Response(null, { status: 303, headers });
};
