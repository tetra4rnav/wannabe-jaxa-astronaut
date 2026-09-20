import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import { NEWS_KV_KEY } from '../../../shared/news/format.ts';
import { proposeForNewsItem } from '../../../shared/proposals/propose.ts';
import { loadProposals, upsertProposal } from '../../../shared/proposals/store.ts';
import { retrievePriorChunks } from '../../../shared/timeline/retrieve.ts';
import type { NewsFile, NewsItem } from '../../../src/utils/news-types.ts';
import type { Env } from '../env.ts';

const REPO = 'tetra4rnav/wannabe-jaxa-astronaut';
const BATCH = 5;

type ProposeParams = { newsIds?: string[] };

async function loadNews(store: KVNamespace): Promise<NewsFile | null> {
	const raw = await store.get(NEWS_KV_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as NewsFile;
	} catch {
		return null;
	}
}

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

		const news = await step.do('load news', async () => loadNews(this.env.STORE));
		if (!news?.items?.length) return { proposed: 0 };

		const existing = await step.do('load proposals', async () => loadProposals(this.env.STORE));
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
				await upsertProposal(this.env.STORE, proposal);
				n++;
				return { id: proposal.id, action: proposal.action };
			});
		}

		return { proposed: n };
	}
}
