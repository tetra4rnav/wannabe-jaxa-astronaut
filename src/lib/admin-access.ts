import type { APIContext } from 'astro';
import { isOperator, parseAdminEmails } from './operator-access';
import { getRuntimeEnv } from './auth';

/** Production requires a Better Auth operator session. ADMIN_OPEN bypasses (never in production). */
export async function assertAdminAccess(
	context: APIContext | { request: Request; locals?: App.Locals },
): Promise<Response | null> {
	const locals = 'locals' in context ? context.locals : undefined;
	if (locals?.adminOpen) return null;

	const user = locals?.user ?? null;
	const env = await getRuntimeEnv();
	if (isOperator(user, parseAdminEmails(env?.ADMIN_EMAILS))) return null;

	const message = user ? '権限がありません' : 'ログインが必要です';
	return new Response(message, {
		status: user ? 403 : 401,
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
}

export async function getDb(): Promise<D1Database | null> {
	try {
		const { env } = await import('cloudflare:workers');
		return env.DB ?? null;
	} catch {
		return null;
	}
}

export async function getStore(): Promise<KVNamespace | null> {
	try {
		const { env } = await import('cloudflare:workers');
		return env.STORE ?? null;
	} catch {
		return null;
	}
}
