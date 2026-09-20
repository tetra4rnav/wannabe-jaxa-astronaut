export interface Env {
	STORE: KVNamespace;
	AI: Ai;
	FETCH_NEWS: Workflow;
	FACT_CHECK: Workflow;
	X_BEARER_TOKEN?: string;
	DEEPL_API_KEY?: string;
	CF_AI_MODEL?: string;
	RUN_SECRET?: string;
}
