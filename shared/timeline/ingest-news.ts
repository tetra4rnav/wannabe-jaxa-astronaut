import { isOfficialUrl } from '../../src/config/official-domains.ts';
import { enqueueDocument } from './db.ts';
import {
	chunkText,
	contentHash,
	embedTexts,
	fetchPageText,
} from './ingest.ts';
import { upsertEvent } from './db.ts';

type IngestEnv = {
	DB: D1Database;
	CHUNKS: R2Bucket;
	VECTORIZE: VectorizeIndex;
	AI: Ai;
};

/**
 * Immediately ingest an approved news item into D1/R2/Vectorize (source_type news).
 * X / non-allowlisted URLs use title+summary text only.
 */
export async function ingestApprovedNews(
	env: IngestEnv,
	item: {
		id: string;
		url: string;
		kind: string;
		publishedAt: string;
		titleJa: string;
		titleOriginal: string;
		summaryJa: string;
		summaryOriginal: string;
		projectSlugs: string[];
	},
): Promise<'ingested' | 'skipped' | 'failed'> {
	const title = item.titleJa || item.titleOriginal;
	const summary = item.summaryJa || item.summaryOriginal;
	const project = item.projectSlugs.find((s) => s !== 'unassigned') ?? 'unassigned';

	let text: string | null = null;
	if (item.kind !== 'x' && isOfficialUrl(item.url)) {
		text = await fetchPageText(item.url);
	}
	if (!text || text.length < 40) {
		text = `${title}\n\n${summary}`.trim();
	}
	if (text.length < 40) return 'skipped';

	await enqueueDocument(env.DB, {
		url: item.url,
		title,
		sourceType: 'news',
		projectSlug: project,
		occurredAt: item.publishedAt,
	});

	const hash = contentHash(text);
	const chunks = chunkText(text, 800).slice(0, 8);
	const vectors = await embedTexts(env.AI, chunks);
	const occurredAt = item.publishedAt || new Date().toISOString().slice(0, 10);

	const upserts = [];
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i]!;
		const values = vectors[i];
		if (!values) continue;
		const chunkId = `news-${hash}-${i}`;
		await env.CHUNKS.put(`chunks/${chunkId}.txt`, chunk, {
			customMetadata: { url: item.url, project, kind: 'news', newsId: item.id },
		});
		upserts.push({
			id: chunkId,
			values,
			metadata: {
				project,
				kind: 'news',
				occurred_at: occurredAt,
				url: item.url.slice(0, 1024),
				r2: `chunks/${chunkId}.txt`,
			},
		});
	}
	if (upserts.length) {
		await env.VECTORIZE.upsert(upserts);
	}

	for (const slug of item.projectSlugs.length ? item.projectSlugs : ['unassigned']) {
		await upsertEvent(env.DB, {
			projectSlug: slug,
			kind: 'news',
			occurredAt,
			url: item.url,
			title,
			newsId: item.id,
		});
	}

	await env.DB.prepare(
		`UPDATE documents SET status='ingested', content_hash=?, ingested_at=?, error=NULL WHERE url=?`,
	)
		.bind(hash, new Date().toISOString(), item.url)
		.run();

	return 'ingested';
}
