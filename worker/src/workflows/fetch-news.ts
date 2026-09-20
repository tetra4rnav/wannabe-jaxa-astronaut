import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import type { NewsFile, NewsItem } from '../../../src/utils/news-types.ts';
import {
	NEWS_KV_KEY,
	NEWS_MD_KV_KEY,
	newsFileToMarkdown,
} from '../../../shared/news/format.ts';
import { emptyNewsFile, runFetchNews } from '../../../shared/news/run-fetch-news.ts';
import type { NewsSecrets } from '../../../shared/news/secrets.ts';
import { syncProjectsTable, upsertEvent } from '../../../shared/timeline/db.ts';
import { ingestApprovedNews } from '../../../shared/timeline/ingest-news.ts';
import { llmClassifyNewsItem } from '../../../shared/timeline/llm-classify-news.ts';
import type { Env } from '../env.ts';

const GITHUB_NEWS_FALLBACK =
	'https://raw.githubusercontent.com/tetra4rnav/wannabe-jaxa-astronaut/main/src/data/news.json';

const CLASSIFY_BATCH = 8;

async function loadExisting(store: KVNamespace): Promise<NewsFile> {
	const raw = await store.get(NEWS_KV_KEY);
	if (raw) {
		try {
			return JSON.parse(raw) as NewsFile;
		} catch {
			/* fall through */
		}
	}
	try {
		const res = await fetch(GITHUB_NEWS_FALLBACK);
		if (res.ok) return (await res.json()) as NewsFile;
	} catch {
		/* ignore */
	}
	return emptyNewsFile();
}

function secretsFromEnv(env: Env): NewsSecrets {
	return {
		X_BEARER_TOKEN: env.X_BEARER_TOKEN,
		DEEPL_API_KEY: env.DEEPL_API_KEY,
	};
}

function needsLlmClassify(item: NewsItem): boolean {
	return !item.llmClassifiedAt;
}

export class FetchNewsWorkflow extends WorkflowEntrypoint<Env> {
	async run(_event: WorkflowEvent<unknown>, step: WorkflowStep) {
		await step.do('sync projects', async () => {
			await syncProjectsTable(this.env.DB);
		});

		const existing = await step.do('load existing news', async () => {
			return loadExisting(this.env.STORE);
		});

		const merged = await step.do(
			'fetch merge translate',
			{ retries: { limit: 2, delay: '30 seconds', backoff: 'exponential' }, timeout: '14 minutes' },
			async () => runFetchNews(existing, secretsFromEnv(this.env)),
		);

		const pending = merged.items.filter(needsLlmClassify).slice(0, CLASSIFY_BATCH);

		const classifiedMap = await step.do(
			'llm classify batch',
			{ retries: { limit: 1, delay: '20 seconds' }, timeout: '14 minutes' },
			async () => {
				const out: Record<
					string,
					{
						ingestAsSource: boolean;
						projectSlugs: string[];
						reason: string;
						llmClassifiedAt: string;
					}
				> = {};
				for (const item of pending) {
					out[item.id] = await llmClassifyNewsItem(this.env, item);
				}
				return out;
			},
		);

		const tagged = await step.do('merge classifications', async () => {
			const items = merged.items.map((item) => {
				const c = classifiedMap[item.id];
				if (!c) return item;
				return {
					...item,
					projectSlugs: c.projectSlugs,
					ingestAsSource: c.ingestAsSource,
					llmClassifiedAt: c.llmClassifiedAt,
					llmReason: c.reason,
				} satisfies NewsItem;
			});
			return { ...merged, items } satisfies NewsFile;
		});

		await step.do('write events', async () => {
			for (const item of tagged.items) {
				const slugs = item.projectSlugs?.length ? item.projectSlugs : ['unassigned'];
				for (const slug of slugs) {
					await upsertEvent(this.env.DB, {
						projectSlug: slug,
						kind: 'news',
						occurredAt: item.publishedAt,
						url: item.url,
						title: item.titleJa || item.titleOriginal,
						newsId: item.id,
					});
				}
			}
			return tagged.items.length;
		});

		await step.do('ingest approved news', async () => {
			let n = 0;
			for (const item of tagged.items) {
				if (!item.ingestAsSource || !item.llmClassifiedAt) continue;
				if (!classifiedMap[item.id]) continue; // only newly classified this run
				const result = await ingestApprovedNews(this.env, {
					id: item.id,
					url: item.url,
					kind: item.kind,
					publishedAt: item.publishedAt,
					titleJa: item.titleJa,
					titleOriginal: item.titleOriginal,
					summaryJa: item.summaryJa,
					summaryOriginal: item.summaryOriginal,
					projectSlugs: item.projectSlugs ?? ['unassigned'],
				});
				if (result === 'ingested') n++;
			}
			return n;
		});

		await step.do('write kv', async () => {
			await this.env.STORE.put(NEWS_KV_KEY, JSON.stringify(tagged));
			await this.env.STORE.put(NEWS_MD_KV_KEY, newsFileToMarkdown(tagged));
			return { count: tagged.items.length, updatedAt: tagged.updatedAt };
		});
	}
}
