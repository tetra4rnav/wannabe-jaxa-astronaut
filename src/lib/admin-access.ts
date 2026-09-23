import type { APIContext } from 'astro';

/** Production requires Cloudflare Access JWT; DEV / ADMIN_OPEN bypass. */
export function assertAdminAccess(context: APIContext | { request: Request }): Response | null {
	const url = new URL(context.request.url);
	const isDev = import.meta.env.DEV;
	let adminOpen = false;
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const env = (context as any).locals?.runtime?.env as { ADMIN_OPEN?: string } | undefined;
		adminOpen = env?.ADMIN_OPEN === '1' || env?.ADMIN_OPEN === 'true';
	} catch {
		/* ignore */
	}
	if (isDev || adminOpen) return null;

	const jwt = context.request.headers.get('Cf-Access-Jwt-Assertion');
	if (!jwt) {
		return new Response('Unauthorized — Cloudflare Access required', {
			status: 401,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		});
	}
	return null;
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
