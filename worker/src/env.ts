export interface Env {
	STORE: KVNamespace;
	DB: D1Database;
	CHUNKS: R2Bucket;
	VECTORIZE: VectorizeIndex;
	AI: Ai;
	FETCH_NEWS: Workflow;
	FACT_CHECK: Workflow;
	INGEST_CORPUS: Workflow;
	PROPOSE_WIKI: Workflow;
	X_BEARER_TOKEN?: string;
	DEEPL_API_KEY?: string;
	CF_AI_MODEL?: string;
	RUN_SECRET?: string;
	OPIK_API_KEY?: string;
	OPIK_WORKSPACE?: string;
	OPIK_PROJECT_NAME?: string;
}
