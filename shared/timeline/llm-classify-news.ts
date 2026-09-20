import type { NewsItem } from '../../src/utils/news-types.ts';
import type { ProjectSlug } from '../../src/config/projects.ts';
import { catalogPromptLines, filterCatalogSlugs, isCatalogSlug } from './classify.ts';
import {
	runJudgment,
	type FeedbackScore,
	type JudgmentEnv,
} from '../opik/run-judgment.ts';

export type NewsClassifyResult = {
	ingestAsSource: boolean;
	projectSlugs: ProjectSlug[];
	reason: string;
	llmClassifiedAt: string;
};

const SYSTEM = `You classify official-adjacent spaceflight news for an unofficial JAXA astronaut study wiki.
Reply ONLY with JSON:
{"ingestAsSource":boolean,"projectSlugs":string[],"reason":string}

Rules:
- ingestAsSource=true ONLY if the item is news-like (factual update or official announcement) AND trustworthy as official-adjacent evidence for RAG (from the given official feed/X channel, not rumor, opinion, empty stub, or pure retweet noise).
- projectSlugs: zero or more slugs from the catalog list only. Multi-project OK. If none fit, use ["unassigned"].
- Never invent project slugs outside the catalog.
- reason: one short English or Japanese sentence.`;

function scoresForNews(parsed: unknown | null): FeedbackScore[] {
	if (!parsed || typeof parsed !== 'object') {
		return [
			{ name: 'schema_ok', value: 0, reason: 'no object' },
			{ name: 'slugs_in_catalog', value: 0, reason: 'n/a' },
		];
	}
	const o = parsed as Record<string, unknown>;
	const schemaOk =
		typeof o.ingestAsSource === 'boolean' &&
		Array.isArray(o.projectSlugs) &&
		typeof o.reason === 'string';
	const filtered = filterCatalogSlugs(o.projectSlugs);
	const rawSlugs = Array.isArray(o.projectSlugs)
		? o.projectSlugs.filter((x): x is string => typeof x === 'string')
		: [];
	const invents = rawSlugs.some((s) => s !== 'unassigned' && !isCatalogSlug(s));
	return [
		{ name: 'schema_ok', value: schemaOk ? 1 : 0 },
		{
			name: 'slugs_in_catalog',
			value: invents ? 0 : 1,
			reason: invents ? `invented: ${rawSlugs.join(',')}` : filtered.join(','),
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
	const catalog = catalogPromptLines();
	const user = `Catalog projects:
${catalog}

News item:
id: ${item.id}
url: ${item.url}
kind: ${item.kind}
region: ${item.region}
source: ${item.sourceLabel}${item.accountHandle ? ` (@${item.accountHandle})` : ''}
titleOriginal: ${item.titleOriginal}
summaryOriginal: ${item.summaryOriginal}
titleJa: ${item.titleJa}
summaryJa: ${item.summaryJa}`;

	const result = await runJudgment(env, {
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
		system: SYSTEM,
		user,
		score: (_raw, parsed) => scoresForNews(parsed),
	});

	const now = new Date().toISOString();
	if (!result.parsed || typeof result.parsed !== 'object') {
		return {
			ingestAsSource: false,
			projectSlugs: ['unassigned'],
			reason: 'LLM parse failed',
			llmClassifiedAt: now,
		};
	}
	const o = result.parsed as Record<string, unknown>;
	return {
		ingestAsSource: o.ingestAsSource === true,
		projectSlugs: filterCatalogSlugs(o.projectSlugs),
		reason: typeof o.reason === 'string' ? o.reason.slice(0, 240) : '',
		llmClassifiedAt: now,
	};
}
