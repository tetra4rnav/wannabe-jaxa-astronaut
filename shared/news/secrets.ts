/** Secrets for news fetch / translate. Prefer explicit args over process.env in Workers. */
export type NewsSecrets = {
	X_BEARER_TOKEN?: string;
	DEEPL_API_KEY?: string;
};

export function secretsFromProcess(): NewsSecrets {
	return {
		X_BEARER_TOKEN: process.env.X_BEARER_TOKEN,
		DEEPL_API_KEY: process.env.DEEPL_API_KEY,
	};
}
