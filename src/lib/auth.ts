import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { authSchema } from './auth-schema';
import { parseAdminEmails, resolveAuthBaseURL } from './operator-access';

export type AuthEnv = {
	DB?: D1Database;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	ADMIN_EMAILS?: string;
	ADMIN_OPEN?: string;
	BOOTSTRAP_SECRET?: string;
	STORE?: KVNamespace;
};

export async function getRuntimeEnv(): Promise<AuthEnv | undefined> {
	try {
		const { env } = await import('cloudflare:workers');
		return env;
	} catch {
		return undefined;
	}
}

export function createAuth(env: AuthEnv, requestUrl: URL) {
	if (!env.DB) throw new Error('DB unavailable');
	if (!env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET missing');

	const emails = parseAdminEmails(env.ADMIN_EMAILS);
	const baseURL = resolveAuthBaseURL(requestUrl, env.BETTER_AUTH_URL);
	const db = drizzle(env.DB, { schema: authSchema });

	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL,
		trustedOrigins: [baseURL],
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: authSchema,
		}),
		emailAndPassword: {
			enabled: true,
			disableSignUp: true,
		},
		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: false,
					defaultValue: 'user',
					input: false,
				},
			},
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
			},
		},
		rateLimit: {
			enabled: true,
			storage: 'database',
			window: 60,
			max: 10,
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						const email = String(user.email ?? '').toLowerCase();
						if (!emails.has(email)) return false;
						return { data: { ...user, role: 'admin' } };
					},
				},
			},
		},
		advanced: {
			useSecureCookies: new URL(baseURL).protocol === 'https:',
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
