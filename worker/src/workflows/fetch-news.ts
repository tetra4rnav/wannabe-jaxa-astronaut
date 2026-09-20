import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import type { NewsFile } from '../../../src/utils/news-types.ts';
import {
	NEWS_KV_KEY,
	NEWS_MD_KV_KEY,
	newsFileToMarkdown,
} from '../../../shared/news/format.ts';
import { emptyNewsFile, runFetchNews } from '../../../shared/news/run-fetch-news.ts';
import type { NewsSecrets } from '../../../shared/news/secrets.ts';
import type { Env } from '../env.ts';

const GITHUB_NEWS_FALLBACK =
	'https://raw.githubusercontent.com/tetra4rnav/wannabe-jaxa-astronaut/main/src/data/news.json';

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

export class FetchNewsWorkflow extends WorkflowEntrypoint<Env> {
	async run(_event: WorkflowEvent<unknown>, step: WorkflowStep) {
		const existing = await step.do('load existing news', async () => {
			return loadExisting(this.env.STORE);
		});

		const merged = await step.do(
			'fetch merge translate',
			{ retries: { limit: 2, delay: '30 seconds', backoff: 'exponential' }, timeout: '14 minutes' },
			async () => runFetchNews(existing, secretsFromEnv(this.env)),
		);

		await step.do('write kv', async () => {
			await this.env.STORE.put(NEWS_KV_KEY, JSON.stringify(merged));
			await this.env.STORE.put(NEWS_MD_KV_KEY, newsFileToMarkdown(merged));
			return { count: merged.items.length, updatedAt: merged.updatedAt };
		});
	}
}
