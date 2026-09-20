import {
	createSpan,
	createTrace,
	endTrace,
	logFeedbackScores,
	newOpikId,
	opikConfigFromEnv,
	type FeedbackScore,
	type OpikConfig,
} from './client.ts';

export type JudgmentEnv = {
	AI: Ai;
	CF_AI_MODEL?: string;
	OPIK_API_KEY?: string;
	OPIK_WORKSPACE?: string;
	OPIK_PROJECT_NAME?: string;
};

export const DEFAULT_JUDGMENT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export type RunJudgmentOptions = {
	name: string;
	tags: string[];
	input: unknown;
	system: string;
	user: string;
	model?: string;
	score?: (raw: string | null, parsed: unknown | null) => FeedbackScore[];
};

export type JudgmentResult = {
	raw: string | null;
	parsed: unknown | null;
	jsonValid: boolean;
	model: string;
	traceId: string | null;
};

function extractJson(text: string): unknown | null {
	try {
		const match = text.match(/\{[\s\S]*\}/);
		return JSON.parse(match?.[0] ?? text);
	} catch {
		return null;
	}
}

async function callWorkersAi(
	ai: Ai,
	model: string,
	system: string,
	user: string,
): Promise<string | null> {
	try {
		const result = (await ai.run(model as Parameters<Ai['run']>[0], {
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user },
			],
		})) as { response?: string };
		return result.response ?? null;
	} catch (err) {
		console.warn('[judgment] AI failed', err);
		return null;
	}
}

/**
 * Sole entry for Workers AI LLM judgments. Opens Opik trace + spans when configured.
 * Fail-open: missing Opik secrets → warn and still run the model.
 */
export async function runJudgment(
	env: JudgmentEnv,
	opts: RunJudgmentOptions,
): Promise<JudgmentResult> {
	const model = opts.model || env.CF_AI_MODEL || DEFAULT_JUDGMENT_MODEL;
	const cfg = opikConfigFromEnv(env);
	if (!cfg) {
		console.warn('[opik] OPIK_API_KEY / OPIK_WORKSPACE unset; skipping Opik for', opts.name);
	}

	const start = new Date().toISOString();
	const raw = await callWorkersAi(env.AI, model, opts.system, opts.user);
	const parsed = raw ? extractJson(raw) : null;
	const jsonValid = parsed !== null;
	const end = new Date().toISOString();

	const scores: FeedbackScore[] = [
		{ name: 'json_valid', value: jsonValid ? 1 : 0, reason: jsonValid ? 'parsed' : 'parse failed' },
		...(opts.score?.(raw, parsed) ?? []),
	];

	let traceId: string | null = null;
	if (cfg) {
		traceId = newOpikId();
		const parentSpanId = newOpikId();
		const llmSpanId = newOpikId();
		const guardSpanId = newOpikId();
		try {
			await createTrace(cfg, {
				id: traceId,
				name: opts.name,
				start_time: start,
				input: opts.input,
				tags: opts.tags,
				metadata: { model },
			});
			await createSpan(cfg, {
				id: parentSpanId,
				trace_id: traceId,
				name: opts.name,
				type: 'general',
				start_time: start,
				end_time: end,
				input: opts.input,
				output: { raw, parsed },
				tags: opts.tags,
			});
			await createSpan(cfg, {
				id: llmSpanId,
				trace_id: traceId,
				parent_span_id: parentSpanId,
				name: 'workers-ai',
				type: 'llm',
				start_time: start,
				end_time: end,
				input: { system: opts.system, user: opts.user },
				output: { raw, parsed },
				model,
				provider: 'cloudflare-workers-ai',
				tags: opts.tags,
			});
			await createSpan(cfg, {
				id: guardSpanId,
				trace_id: traceId,
				parent_span_id: parentSpanId,
				name: 'structural-scores',
				type: 'guardrail',
				start_time: end,
				end_time: end,
				output: { scores },
				tags: opts.tags,
			});
			await endTrace(cfg, traceId, { end_time: end, output: { raw, parsed } });
			await logFeedbackScores(cfg, traceId, scores);
		} catch (err) {
			console.warn('[opik] logging failed', err);
		}
	}

	return { raw, parsed, jsonValid, model, traceId };
}

export type { OpikConfig, FeedbackScore };
