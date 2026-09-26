export type OperatorUser = {
	id: string;
	email: string;
	name: string;
	role?: string | null;
};

export function parseAdminEmails(raw: string | undefined): Set<string> {
	return new Set(
		(raw ?? '')
			.split(',')
			.map((part) => part.trim().toLowerCase())
			.filter(Boolean),
	);
}

export function isAdminOpen(env: { ADMIN_OPEN?: string } | undefined): boolean {
	return env?.ADMIN_OPEN === '1' || env?.ADMIN_OPEN === 'true';
}

/** Admin console requires an admin role and an email still on ADMIN_EMAILS. */
export function isOperator(
	user: { email?: string | null; role?: string | null } | null | undefined,
	emails: Set<string>,
): boolean {
	if (!user?.email || emails.size === 0) return false;
	return user.role === 'admin' && emails.has(user.email.toLowerCase());
}

/** Same-origin relative path only. Anything else falls back to /admin. */
export function safeNext(raw: string | null | undefined, fallback = '/admin'): string {
	if (!raw) return fallback;
	if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
	if (raw.includes('\\') || raw.includes('://')) return fallback;
	return raw;
}

const WORKERS_PREVIEW = /\.workers\.dev$/;

export function resolveAuthBaseURL(requestUrl: URL, canonical: string | undefined): string {
	const origin = requestUrl.origin;
	if (isTrustedOrigin(origin, canonical)) return origin;
	const trimmed = canonical?.replace(/\/$/, '');
	if (trimmed) return trimmed;
	return origin;
}

function isTrustedOrigin(origin: string, canonical: string | undefined): boolean {
	let url: URL;
	try {
		url = new URL(origin);
	} catch {
		return false;
	}
	const host = url.hostname;
	if (host === 'localhost' || host === '127.0.0.1') return url.protocol === 'http:' || url.protocol === 'https:';
	if (WORKERS_PREVIEW.test(host)) return url.protocol === 'https:';
	if (!canonical) return false;
	try {
		return new URL(canonical).origin === origin;
	} catch {
		return false;
	}
}
