export type OpikConfig = {
	apiKey: string;
	workspace: string;
	projectName: string;
};

export type FeedbackScore = {
	name: string;
	value: number;
	reason?: string;
};

const OPIK_BASE = 'https://www.comet.com/opik/api/v1/private';

export function opikConfigFromEnv(env: {
	OPIK_API_KEY?: string;
	OPIK_WORKSPACE?: string;
	OPIK_PROJECT_NAME?: string;
}): OpikConfig | null {
	if (!env.OPIK_API_KEY || !env.OPIK_WORKSPACE) return null;
	return {
		apiKey: env.OPIK_API_KEY,
		workspace: env.OPIK_WORKSPACE,
		projectName: env.OPIK_PROJECT_NAME || 'wannabe-jaxa-astronaut',
	};
}

function headers(cfg: OpikConfig): HeadersInit {
	return {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		'Comet-Workspace': cfg.workspace,
		authorization: cfg.apiKey,
	};
}

export function newOpikId(): string {
	return crypto.randomUUID();
}

export async function createTrace(
	cfg: OpikConfig,
	body: {
		id: string;
		name: string;
		start_time: string;
		input?: unknown;
		metadata?: Record<string, unknown>;
		tags?: string[];
	},
): Promise<void> {
	const res = await fetch(`${OPIK_BASE}/traces`, {
		method: 'POST',
		headers: headers(cfg),
		body: JSON.stringify({
			...body,
			project_name: cfg.projectName,
		}),
	});
	if (!res.ok) {
		console.warn(`[opik] createTrace ${res.status}`, await res.text().catch(() => ''));
	}
}

export async function endTrace(
	cfg: OpikConfig,
	id: string,
	body: { end_time: string; output?: unknown; error_info?: unknown },
): Promise<void> {
	const res = await fetch(`${OPIK_BASE}/traces/${id}`, {
		method: 'PATCH',
		headers: headers(cfg),
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		console.warn(`[opik] endTrace ${res.status}`, await res.text().catch(() => ''));
	}
}

export async function createSpan(
	cfg: OpikConfig,
	body: {
		id: string;
		trace_id: string;
		parent_span_id?: string;
		name: string;
		type?: 'general' | 'llm' | 'tool' | 'guardrail';
		start_time: string;
		end_time?: string;
		input?: unknown;
		output?: unknown;
		metadata?: Record<string, unknown>;
		model?: string;
		provider?: string;
		tags?: string[];
	},
): Promise<void> {
	const res = await fetch(`${OPIK_BASE}/spans`, {
		method: 'POST',
		headers: headers(cfg),
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		console.warn(`[opik] createSpan ${res.status}`, await res.text().catch(() => ''));
	}
}

export async function logFeedbackScores(
	cfg: OpikConfig,
	traceId: string,
	scores: FeedbackScore[],
): Promise<void> {
	if (!scores.length) return;
	const res = await fetch(`${OPIK_BASE}/traces/feedback-scores`, {
		method: 'POST',
		headers: headers(cfg),
		body: JSON.stringify({
			scores: scores.map((s) => ({
				id: traceId,
				name: s.name,
				value: s.value,
				reason: s.reason,
				project_name: cfg.projectName,
			})),
		}),
	});
	if (!res.ok) {
		console.warn(`[opik] feedback ${res.status}`, await res.text().catch(() => ''));
	}
}
