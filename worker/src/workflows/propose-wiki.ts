import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import { loadNewsFromD1 } from '../../../shared/news/d1-store.ts';
import { proposeForNewsItem } from '../../../shared/proposals/propose.ts';
import {
	loadProposalsFromD1,
	upsertProposalInD1,
} from '../../../shared/proposals/d1-store.ts';
import { ensureCatalogSeeded } from '../../../shared/timeline/catalog.ts';
import { retrievePriorChunks } from '../../../shared/timeline/retrieve.ts';
import type { NewsItem } from '../../../src/utils/news-types.ts';
import type { Env } from '../env.ts';

const REPO = 'tetra4rnav/wannabe-jaxa-astronaut';
const BATCH = 5;

type ProposeParams = { newsIds?: string[] };

async function listWikiDocs(): Promise<{ id: string; title: string }[]> {
	const treeRes = await fetch(
		`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`,
		{ headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'wannabe-jaxa-jobs' } },
	);
	if (!treeRes.ok) return [];
	const tree = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
	const paths = (tree.tree ?? [])
		.filter(
			(t) =>
				t.type === 'blob' &&
				t.path.startsWith('src/content/docs/') &&
				/\.mdx?$/.test(t.path) &&
				!t.path.includes('/_template/') &&
				!t.path.endsWith('/about.md'),
		)
		.map((t) => t.path)
		.slice(0, 80);

	const docs: { id: string; title: string }[] = [];
	for (const path of paths) {
		const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${path}`, {
			headers: { 'User-Agent': 'wannabe-jaxa-jobs' },
		});
		if (!rawRes.ok) continue;
		const raw = await rawRes.text();
		const id = path
			.replace(/^src\/content\/docs\//, '')
			.replace(/\.mdx?$/, '')
			.replace(/\/index$/, '');
		if (id === 'about' || id === 'index') continue;
		const title = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? id;
		docs.push({ id, title });
	}
	return docs;
}

function pickCandidates(
	items: NewsItem[],
	existingNewsIds: Set<string>,
	preferIds?: string[],
): NewsItem[] {
	const prefer = new Set(preferIds ?? []);
	const classified = items.filter(
		(i) => i.llmClassifiedAt && (prefer.size === 0 || prefer.has(i.id)),
	);
	const fresh = classified.filter((i) => !existingNewsIds.has(i.id));
	const pool = fresh.length ? fresh : classified.filter((i) => prefer.has(i.id));
	return pool
		.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
		.slice(0, BATCH);
}

export class ProposeWikiWorkflow extends WorkflowEntrypoint<Env, ProposeParams> {
	async run(event: WorkflowEvent<ProposeParams>, step: WorkflowStep) {
		const preferIds = event.payload?.newsIds;

		await step.do('ensure catalog seeded', async () => {
			await ensureCatalogSeeded(this.env.DB);
		});

		const news = await step.do('load news', async () => loadNewsFromD1(this.env.DB));
		if (!news?.items?.length) return { proposed: 0 };

		const existing = await step.do('load proposals', async () =>
			loadProposalsFromD1(this.env.DB),
		);
		const existingNewsIds = new Set(existing.items.map((p) => p.newsId));

		const candidates = await step.do('pick candidates', async () =>
			pickCandidates(news.items, existingNewsIds, preferIds),
		);
		if (!candidates.length) return { proposed: 0 };

		const wikiDocs = await step.do('list wiki docs', async () => listWikiDocs());

		let n = 0;
		for (const item of candidates) {
			await step.do(`propose ${item.id}`, { retries: { limit: 1, delay: '20 seconds' } }, async () => {
				const projects = (item.projectSlugs ?? []).filter((s) => s !== 'unassigned');
				const chunks = projects.length
					? await retrievePriorChunks(this.env, {
							queryText: `${item.titleJa}\n${item.summaryJa}\n${item.titleOriginal}`,
							projectSlugs: projects,
							occurredAt: item.publishedAt,
						})
					: [];

				const proposal = await proposeForNewsItem(this.env, {
					item,
					chunks,
					wikiDocs,
				});
				await upsertProposalInD1(this.env.DB, proposal);
				n++;
				return { id: proposal.id, action: proposal.action };
			});
		}

		return { proposed: n };
	}
}
