import { isOfficialUrl } from '../../src/config/official-domains.ts';
import { PROJECT_BY_SLUG } from '../../src/config/projects.ts';
import type { NewsItem } from '../../src/utils/news-types.ts';
import {
	proposalIdForNews,
	type WikiProposal,
	type WikiProposalAction,
} from '../../src/utils/proposal-types.ts';
import {
	runJudgment,
	type FeedbackScore,
	type JudgmentEnv,
} from '../opik/run-judgment.ts';
import { catalogPromptLines } from '../timeline/classify.ts';
import type { RetrievedChunk } from '../timeline/retrieve.ts';

const ACTIONS: WikiProposalAction[] = ['update', 'create', 'add-project', 'skip'];

const SYSTEM = `You propose wiki *work* for an unofficial JAXA astronaut study site.
Reply ONLY with JSON:
{"action":"update"|"create"|"add-project"|"skip","targetDocsId":string|null,"proposedTitle":string,"headings":string[],"evidenceUrls":string[],"timelineNote":string,"relation":string,"rationale":string}

Rules:
- Never write wiki Markdown body. Propose what a human should add/update.
- action=update: change an existing docs id from the wiki list.
- action=create: propose a new docs id path (folder/slug), not a full article.
- action=add-project: catalog lacks a needed project; do not invent a slug as if it existed.
- action=skip: news needs no wiki work, or grounding is too weak.
- evidenceUrls: ONLY URLs from the provided prior official/paper chunks (copy exactly). Never invent URLs. Never cite the news URL as wiki evidence.
- Ground only in earlier same-project official/paper material (chunks given). Explain relation briefly; do not write a finished news brief.
- targetDocsId must be from the wiki list for update, or a plausible new path for create, or null for skip/add-project.
- headings: 0–5 suggested section headings (Japanese OK).
- Keep strings short.`;

function scoresForProposal(parsed: unknown | null, allowedEvidence: Set<string>): FeedbackScore[] {
	if (!parsed || typeof parsed !== 'object') {
		return [
			{ name: 'schema_ok', value: 0 },
			{ name: 'evidence_allowlisted', value: 0 },
		];
	}
	const o = parsed as Record<string, unknown>;
	const actionOk = typeof o.action === 'string' && ACTIONS.includes(o.action as WikiProposalAction);
	const schemaOk =
		actionOk &&
		(o.targetDocsId === null || typeof o.targetDocsId === 'string') &&
		typeof o.proposedTitle === 'string' &&
		Array.isArray(o.headings) &&
		Array.isArray(o.evidenceUrls) &&
		typeof o.timelineNote === 'string' &&
		typeof o.relation === 'string' &&
		typeof o.rationale === 'string';
	const urls = Array.isArray(o.evidenceUrls)
		? o.evidenceUrls.filter((u): u is string => typeof u === 'string')
		: [];
	const evidenceOk =
		urls.length === 0 ||
		urls.every((u) => allowedEvidence.has(u) && isOfficialUrl(u));
	return [
		{ name: 'schema_ok', value: schemaOk ? 1 : 0 },
		{
			name: 'evidence_allowlisted',
			value: evidenceOk ? 1 : 0,
			reason: evidenceOk ? `${urls.length} urls` : 'invented or non-official url',
		},
	];
}

function filterEvidence(urls: unknown, allowed: Set<string>): string[] {
	if (!Array.isArray(urls)) return [];
	const out: string[] = [];
	const seen = new Set<string>();
	for (const u of urls) {
		if (typeof u !== 'string') continue;
		const url = u.trim();
		if (!url || seen.has(url)) continue;
		if (!allowed.has(url) || !isOfficialUrl(url)) continue;
		seen.add(url);
		out.push(url);
	}
	return out;
}

export async function proposeForNewsItem(
	env: JudgmentEnv,
	opts: {
		item: Pick<
			NewsItem,
			| 'id'
			| 'url'
			| 'publishedAt'
			| 'titleJa'
			| 'titleOriginal'
			| 'summaryJa'
			| 'summaryOriginal'
			| 'projectSlugs'
		>;
		chunks: RetrievedChunk[];
		wikiDocs: { id: string; title: string }[];
	},
): Promise<WikiProposal> {
	const { item, chunks, wikiDocs } = opts;
	const projectSlugs = item.projectSlugs?.length ? item.projectSlugs : ['unassigned'];
	const allowedEvidence = new Set(chunks.map((c) => c.url).filter(Boolean));
	const projectLines = projectSlugs
		.map((s) => {
			const p = PROJECT_BY_SLUG[s];
			return p ? `- ${s}: ${p.nameJa} (wiki: ${p.wikiDocsId ?? 'none'})` : `- ${s}`;
		})
		.join('\n');
	const wikiLines = wikiDocs.map((d) => `- ${d.id}: ${d.title}`).join('\n') || '(none)';
	const chunkBlock = chunks.length
		? chunks
				.map(
					(c, i) =>
						`[${i + 1}] project=${c.project} kind=${c.kind} occurred_at=${c.occurredAt} url=${c.url}\n${c.text}`,
				)
				.join('\n\n')
		: '(no prior official/paper chunks found for these projects on or before the news date)';

	const user = `Catalog projects:
${catalogPromptLines()}

News projects:
${projectLines}

Existing wiki docs (id: title):
${wikiLines}

News item (spark only — not a wiki citation):
id: ${item.id}
url: ${item.url}
publishedAt: ${item.publishedAt}
titleJa: ${item.titleJa}
summaryJa: ${item.summaryJa}
titleOriginal: ${item.titleOriginal}
summaryOriginal: ${item.summaryOriginal}

Prior same-project chunks (occurred_at <= news date):
${chunkBlock}`;

	const result = await runJudgment(env, {
		name: `propose-wiki:${item.id}`,
		tags: ['judgment:propose-wiki'],
		input: {
			newsId: item.id,
			url: item.url,
			projectSlugs,
			chunkCount: chunks.length,
		},
		system: SYSTEM,
		user,
		score: (_raw, parsed) => scoresForProposal(parsed, allowedEvidence),
	});

	const createdAt = new Date().toISOString();
	const base = {
		id: proposalIdForNews(item.id),
		createdAt,
		newsId: item.id,
		newsUrl: item.url,
		newsTitle: item.titleJa || item.titleOriginal,
		projectSlugs,
		model: result.model,
	};

	if (!result.parsed || typeof result.parsed !== 'object') {
		return {
			...base,
			action: 'skip',
			targetDocsId: null,
			proposedTitle: '',
			headings: [],
			evidenceUrls: [],
			timelineNote: '',
			relation: '',
			rationale: 'LLM parse failed',
		};
	}

	const o = result.parsed as Record<string, unknown>;
	let action: WikiProposalAction = ACTIONS.includes(o.action as WikiProposalAction)
		? (o.action as WikiProposalAction)
		: 'skip';
	const evidenceUrls = filterEvidence(o.evidenceUrls, allowedEvidence);

	// No invented grounding: if model claims update/create without evidence, demote to skip
	if ((action === 'update' || action === 'create') && evidenceUrls.length === 0) {
		action = 'skip';
	}

	const headings = Array.isArray(o.headings)
		? o.headings.filter((h): h is string => typeof h === 'string').map((h) => h.slice(0, 120)).slice(0, 5)
		: [];

	return {
		...base,
		action,
		targetDocsId:
			typeof o.targetDocsId === 'string' ? o.targetDocsId.slice(0, 200) : null,
		proposedTitle: typeof o.proposedTitle === 'string' ? o.proposedTitle.slice(0, 200) : '',
		headings,
		evidenceUrls,
		timelineNote: typeof o.timelineNote === 'string' ? o.timelineNote.slice(0, 400) : '',
		relation: typeof o.relation === 'string' ? o.relation.slice(0, 600) : '',
		rationale:
			typeof o.rationale === 'string'
				? o.rationale.slice(0, 600)
				: evidenceUrls.length === 0
					? 'Insufficient prior official grounding'
					: '',
	};
}
