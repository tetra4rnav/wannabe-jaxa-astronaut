import type { NewsItem } from '../../src/utils/news-types.ts';
import type { ProjectSlug } from '../../src/config/projects.ts';
import { PROJECTS } from '../../src/config/projects.ts';
import { filterCatalogSlugs, isCatalogSlug } from './classify.ts';
import {
	runJevJudgment,
	type FeedbackScore,
	type JudgmentEnv,
	type JevQuestions,
} from '../opik/run-judgment.ts';

export type NewsClassifyResult = {
	ingestAsSource: boolean;
	projectSlugs: ProjectSlug[];
	reason: string;
	llmClassifiedAt: string;
};

/** noul probability at or above this counts as true / assigned. */
export const JEV_NOUL_THRESHOLD = 0.55;

const INGEST_KEY = 'ingestAsSource';

function catalogProjects() {
	return PROJECTS.filter((p) => p.slug !== 'unassigned');
}

export function buildJevNewsQuestions(): JevQuestions {
	const questions: JevQuestions = {
		[INGEST_KEY]: {
			type: 'noul',
			instructions:
				'Is this item news-like (a factual update or official announcement) and trustworthy as official-adjacent evidence for a study wiki RAG corpus?',
			criteria: {
				true: 'Official or official-adjacent news with concrete facts; suitable as evidence',
				false: 'Rumor, opinion, empty stub, hub page, vibe post, or not news-like',
			},
		},
	};
	for (const p of catalogProjects()) {
		questions[p.slug] = {
			type: 'noul',
			instructions: `Is this news primarily about the catalog project "${p.nameJa}" / "${p.nameEn}" (slug ${p.slug})?`,
			criteria: {
				true: `Clearly concerns ${p.nameEn} / ${p.nameJa}`,
				false: `Not about ${p.nameEn} / ${p.nameJa}`,
			},
		};
	}
	return questions;
}

function noulValue(answer: unknown): number | null {
	if (!answer || typeof answer !== 'object') return null;
	const a = answer as Record<string, unknown>;
	if (a.type === 'noul' && typeof a.noul === 'number') return a.noul;
	if (typeof a.noul === 'number') return a.noul;
	return null;
}

/** Map Jev answers → catalog slugs + ingest gate. Pure; used by classify and tests. */
export function mapJevNewsAnswers(answers: Record<string, unknown> | null): {
	ingestAsSource: boolean;
	projectSlugs: ProjectSlug[];
	reason: string;
} {
	if (!answers) {
		return {
			ingestAsSource: false,
			projectSlugs: ['unassigned'],
			reason: 'jev: no answers',
		};
	}

	const ingestNoul = noulValue(answers[INGEST_KEY]);
	const ingestAsSource = ingestNoul !== null && ingestNoul >= JEV_NOUL_THRESHOLD;

	const scored: { slug: ProjectSlug; noul: number }[] = [];
	for (const p of catalogProjects()) {
		const n = noulValue(answers[p.slug]);
		if (n === null) continue;
		if (n >= JEV_NOUL_THRESHOLD && isCatalogSlug(p.slug)) {
			scored.push({ slug: p.slug, noul: n });
		}
	}
	scored.sort((a, b) => b.noul - a.noul);
	const projectSlugs = filterCatalogSlugs(scored.map((s) => s.slug));

	const bits = [
		...(ingestNoul !== null ? [`ingest=${ingestNoul.toFixed(2)}`] : []),
		...scored.slice(0, 4).map((s) => `${s.slug}=${s.noul.toFixed(2)}`),
	];
	const reason = bits.length ? `jev ${bits.join(' ')}` : 'jev unassigned';

	return { ingestAsSource, projectSlugs, reason: reason.slice(0, 240) };
}

function scoresForJevNews(answers: unknown | null): FeedbackScore[] {
	if (!answers || typeof answers !== 'object') {
		return [
			{ name: 'schema_ok', value: 0, reason: 'no answers' },
			{ name: 'slugs_in_catalog', value: 0, reason: 'n/a' },
		];
	}
	const mapped = mapJevNewsAnswers(answers as Record<string, unknown>);
	const invents = mapped.projectSlugs.some((s) => !isCatalogSlug(s));
	return [
		{ name: 'schema_ok', value: 1 },
		{
			name: 'slugs_in_catalog',
			value: invents ? 0 : 1,
			reason: mapped.projectSlugs.join(','),
		},
	];
}

export async function llmClassifyNewsItem(
	env: JudgmentEnv,
	item: Pick<
		NewsItem,
		| 'id'
		| 'url'
		| 'kind'
		| 'region'
		| 'sourceLabel'
		| 'titleOriginal'
		| 'summaryOriginal'
		| 'titleJa'
		| 'summaryJa'
		| 'accountHandle'
	>,
): Promise<NewsClassifyResult> {
	const state = {
		id: item.id,
		url: item.url,
		kind: item.kind,
		region: item.region,
		source: item.sourceLabel,
		accountHandle: item.accountHandle ?? null,
		titleOriginal: item.titleOriginal,
		summaryOriginal: item.summaryOriginal,
		titleJa: item.titleJa,
		summaryJa: item.summaryJa,
	};

	const result = await runJevJudgment(env, {
		name: `news-ingest-gate:${item.id}`,
		tags: ['judgment:news-ingest-gate'],
		input: {
			id: item.id,
			url: item.url,
			kind: item.kind,
			sourceLabel: item.sourceLabel,
			titleJa: item.titleJa,
			titleOriginal: item.titleOriginal,
		},
		state,
		questions: buildJevNewsQuestions(),
		score: (_raw, answers) => scoresForJevNews(answers),
	});

	const now = new Date().toISOString();
	const mapped = mapJevNewsAnswers(result.answers);
	return {
		...mapped,
		llmClassifiedAt: now,
	};
}
