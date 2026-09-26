import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createAuth, getRuntimeEnv } from '../../../lib/auth';
import { parseAdminEmails } from '../../../lib/operator-access';
import { provisionOperator } from '../../../lib/provision-operator';

export const prerender = false;

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

function bearerOk(header: string | null, secret: string | undefined): boolean {
	if (!secret || !header?.startsWith('Bearer ')) return false;
	const token = header.slice('Bearer '.length);
	const left = Buffer.from(token);
	const right = Buffer.from(secret);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

export const POST: APIRoute = async (context) => {
	const env = await getRuntimeEnv();
	if (!env?.DB || !env.BETTER_AUTH_SECRET || !env.BOOTSTRAP_SECRET) {
		return new Response('Auth unavailable', { status: 503 });
	}
	if (!bearerOk(context.request.headers.get('authorization'), env.BOOTSTRAP_SECRET)) {
		return new Response('Unauthorized', { status: 401 });
	}

	let body: { email?: string; password?: string; name?: string };
	try {
		body = (await context.request.json()) as { email?: string; password?: string; name?: string };
	} catch {
		return new Response('invalid JSON', { status: 400 });
	}

	const email = body.email?.trim().toLowerCase() ?? '';
	const password = body.password ?? '';
	const name = body.name?.trim() || email;
	const allowed = parseAdminEmails(env.ADMIN_EMAILS);
	if (!email || !allowed.has(email)) {
		return new Response('Forbidden', { status: 403 });
	}
	if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
		return new Response('invalid password', { status: 400 });
	}

	try {
		const auth = createAuth(env, context.url);
		const operator = await provisionOperator(auth, { email, password, name });
		return Response.json(operator, { status: operator.created ? 201 : 200 });
	} catch {
		return new Response('failed to create operator', { status: 500 });
	}
};
