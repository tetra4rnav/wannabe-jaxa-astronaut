/// <reference types="astro/client" />

type RuntimeEnv = {
	STORE?: KVNamespace;
	DB?: D1Database;
};

declare namespace Cloudflare {
	interface Env extends RuntimeEnv {}
}

declare module 'cloudflare:workers' {
	export const env: RuntimeEnv;
}
