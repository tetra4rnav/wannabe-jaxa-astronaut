import type { APIRoute } from 'astro';
import { createAuth, getRuntimeEnv } from '../../../lib/auth';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
	const env = await getRuntimeEnv();
	if (!env?.DB || !env.BETTER_AUTH_SECRET) {
		return new Response('Auth unavailable', { status: 503 });
	}
	const auth = createAuth(env, context.url);
	return auth.handler(context.request);
};
