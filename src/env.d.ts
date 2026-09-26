/// <reference types="astro/client" />

type RuntimeEnv = {
	STORE?: KVNamespace;
	DB?: D1Database;
	ADMIN_OPEN?: string;
	ADMIN_EMAILS?: string;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	BOOTSTRAP_SECRET?: string;
};

type OperatorUser = {
	id: string;
	email: string;
	name: string;
	role?: string | null;
};

declare namespace App {
	interface Locals {
		user: OperatorUser | null;
		session: { id: string } | null;
		adminOpen: boolean;
	}
}

declare namespace Cloudflare {
	interface Env extends RuntimeEnv {}
}

declare module 'cloudflare:workers' {
	export const env: RuntimeEnv;
}
