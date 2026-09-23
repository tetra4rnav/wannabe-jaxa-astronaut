import { embedTexts } from './ingest.ts';
import { expandRetrievalSlugs } from './project-graph.ts';

export type RetrievedChunk = {
	id: string;
	score: number;
	project: string;
	kind: string;
	occurredAt: string;
	url: string;
	text: string;
};

type RetrieveEnv = {
	AI: Ai;
	VECTORIZE: VectorizeIndex;
	CHUNKS: R2Bucket;
};

/**
 * Classified-project (+ 1-hop relation expansion) chunks with occurred_at
 * on or before the news date. Prefers official / paper; falls back to gated
 * news if needed. Same-project matches sort ahead of expansion-only hits.
 */
export async function retrievePriorChunks(
	env: RetrieveEnv,
	opts: {
		queryText: string;
		projectSlugs: string[];
		occurredAt: string;
		topK?: number;
	},
): Promise<RetrievedChunk[]> {
	const classified = opts.projectSlugs.filter((s) => s && s !== 'unassigned');
	if (!classified.length) return [];

	const classifiedSet = new Set(classified);
	const projects = expandRetrievalSlugs(classified);
	if (!projects.length) return [];

	const date = opts.occurredAt.slice(0, 10);
	const [vector] = await embedTexts(env.AI, [opts.queryText.slice(0, 2000)]);
	if (!vector?.length) return [];

	const topK = opts.topK ?? 8;
	let matches: VectorizeMatch[] = [];
	try {
		const res = await env.VECTORIZE.query(vector, {
			topK,
			returnMetadata: 'indexed',
			filter: {
				project: { $in: projects },
				occurred_at: { $lte: date },
				kind: { $in: ['official', 'paper'] },
			},
		});
		matches = res.matches ?? [];
	} catch (err) {
		console.warn('[retrieve] filtered query failed, retry without kind', err);
		try {
			const res = await env.VECTORIZE.query(vector, {
				topK,
				returnMetadata: 'indexed',
				filter: {
					project: { $in: projects },
					occurred_at: { $lte: date },
				},
			});
			matches = (res.matches ?? []).filter((m) => {
				const kind = String(m.metadata?.kind ?? '');
				return kind === 'official' || kind === 'paper' || kind === 'news';
			});
		} catch (err2) {
			console.warn('[retrieve] query failed', err2);
			return [];
		}
	}

	const out: RetrievedChunk[] = [];
	for (const m of matches) {
		const meta = (m.metadata ?? {}) as Record<string, unknown>;
		const r2 = typeof meta.r2 === 'string' ? meta.r2 : `chunks/${m.id}.txt`;
		const url = typeof meta.url === 'string' ? meta.url : '';
		const obj = await env.CHUNKS.get(r2);
		const text = obj ? await obj.text() : '';
		out.push({
			id: m.id,
			score: m.score ?? 0,
			project: String(meta.project ?? ''),
			kind: String(meta.kind ?? ''),
			occurredAt: String(meta.occurred_at ?? ''),
			url,
			text: text.slice(0, 1200),
		});
	}

	out.sort((a, b) => {
		const aClassified = classifiedSet.has(a.project) ? 0 : 1;
		const bClassified = classifiedSet.has(b.project) ? 0 : 1;
		if (aClassified !== bClassified) return aClassified - bClassified;
		return (b.score ?? 0) - (a.score ?? 0);
	});

	return out;
}
