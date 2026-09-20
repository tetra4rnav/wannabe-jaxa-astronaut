import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import { CORPUS_SEEDS, NTRS_QUERIES } from '../../../src/config/corpus-seeds.ts';
import { isOfficialUrl } from '../../../src/config/official-domains.ts';
import { enqueueDocument, syncProjectsTable, upsertEvent } from '../../../shared/timeline/db.ts';
import {
	chunkText,
	contentHash,
	embedTexts,
	fetchPageText,
	searchNtrs,
} from '../../../shared/timeline/ingest.ts';
import type { Env } from '../env.ts';

const BATCH = 4;
const REPO = 'tetra4rnav/wannabe-jaxa-astronaut';

type PendingDoc = {
	id: number;
	url: string;
	title: string | null;
	source_type: string;
	project_slug: string;
	occurred_at: string | null;
};

async function queueWikiSources(db: D1Database): Promise<number> {
	const treeRes = await fetch(
		`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`,
		{ headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'wannabe-jaxa-jobs' } },
	);
	if (!treeRes.ok) return 0;
	const tree = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
	const paths = (tree.tree ?? [])
		.filter(
			(t) =>
				t.type === 'blob' &&
				t.path.startsWith('src/content/docs/') &&
				/\.mdx?$/.test(t.path) &&
				!t.path.includes('/_template/'),
		)
		.map((t) => t.path)
		.slice(0, 40);

	let n = 0;
	for (const path of paths) {
		const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${path}`, {
			headers: { 'User-Agent': 'wannabe-jaxa-jobs' },
		});
		if (!rawRes.ok) continue;
		const raw = await rawRes.text();
		const title = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? path;
		const sources: string[] = [];
		let inSources = false;
		for (const line of raw.split('\n')) {
			if (/^sources:\s*$/.test(line)) {
				inSources = true;
				continue;
			}
			if (inSources && /^\s+-\s+/.test(line)) {
				sources.push(line.replace(/^\s+-\s+/, '').trim());
				continue;
			}
			if (inSources && /^[A-Za-z]/.test(line)) break;
		}
		for (const url of sources) {
			if (!isOfficialUrl(url)) continue;
			await enqueueDocument(db, {
				url,
				title: `${title} (source)`,
				sourceType: 'official',
				projectSlug: 'unassigned',
			});
			n++;
		}
	}
	return n;
}

async function ingestOne(env: Env, doc: PendingDoc): Promise<'ingested' | 'failed' | 'skipped'> {
	if (!isOfficialUrl(doc.url) && doc.source_type !== 'paper') {
		await env.DB.prepare(`UPDATE documents SET status='skipped', error=? WHERE id=?`)
			.bind('not allowlisted', doc.id)
			.run();
		return 'skipped';
	}

	let text: string | null = null;
	if (doc.source_type === 'paper' && doc.url.includes('ntrs.nasa.gov')) {
		// Abstract already queued as title+body via documents.title holding abstract prefix
		text = doc.title;
	} else {
		text = await fetchPageText(doc.url);
	}
	if (!text || text.length < 40) {
		await env.DB.prepare(`UPDATE documents SET status='failed', error=? WHERE id=?`)
			.bind('empty body', doc.id)
			.run();
		return 'failed';
	}

	const hash = contentHash(text);
	const chunks = chunkText(text, 800).slice(0, 8);
	const vectors = await embedTexts(env.AI, chunks);
	const occurredAt = doc.occurred_at || new Date().toISOString().slice(0, 10);
	const project = doc.project_slug || 'unassigned';

	const upserts = [];
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i]!;
		const values = vectors[i];
		if (!values) continue;
		const chunkId = `${hash}-${i}`;
		await env.CHUNKS.put(`chunks/${chunkId}.txt`, chunk, {
			customMetadata: { url: doc.url, project, kind: doc.source_type },
		});
		upserts.push({
			id: chunkId,
			values,
			metadata: {
				project,
				kind: doc.source_type,
				occurred_at: occurredAt,
				url: doc.url.slice(0, 1024),
				r2: `chunks/${chunkId}.txt`,
			},
		});
	}
	if (upserts.length) {
		await env.VECTORIZE.upsert(upserts);
	}

	await upsertEvent(env.DB, {
		projectSlug: project,
		kind: doc.source_type === 'paper' ? 'paper' : doc.source_type === 'wiki' ? 'wiki' : 'official',
		occurredAt,
		url: doc.url,
		title: doc.title || doc.url,
		docId: doc.id,
	});

	await env.DB.prepare(
		`UPDATE documents SET status='ingested', content_hash=?, ingested_at=?, error=NULL WHERE id=?`,
	)
		.bind(hash, new Date().toISOString(), doc.id)
		.run();

	return 'ingested';
}

export class IngestCorpusWorkflow extends WorkflowEntrypoint<Env> {
	async run(_event: WorkflowEvent<unknown>, step: WorkflowStep) {
		await step.do('sync projects', async () => {
			await syncProjectsTable(this.env.DB);
		});

		await step.do('enqueue seeds', async () => {
			for (const seed of CORPUS_SEEDS) {
				await enqueueDocument(this.env.DB, {
					url: seed.url,
					title: seed.title,
					sourceType: seed.kind,
					projectSlug: seed.project,
					occurredAt: seed.occurredAt ?? null,
				});
			}
			return CORPUS_SEEDS.length;
		});

		await step.do('enqueue wiki sources', async () => queueWikiSources(this.env.DB));

		await step.do('enqueue ntrs abstracts', async () => {
			let n = 0;
			for (const q of NTRS_QUERIES) {
				const hits = await searchNtrs(q, 3);
				for (const hit of hits) {
					await enqueueDocument(this.env.DB, {
						url: hit.url,
						title: `${hit.title}\n\n${hit.abstract}`,
						sourceType: 'paper',
						projectSlug: 'unassigned',
						occurredAt: hit.published ?? null,
					});
					n++;
				}
			}
			return n;
		});

		const pending = await step.do('load pending', async () => {
			const { results } = await this.env.DB.prepare(
				`SELECT id, url, title, source_type, project_slug, occurred_at
         FROM documents WHERE status='pending' ORDER BY id LIMIT ?`,
			)
				.bind(BATCH)
				.all<PendingDoc>();
			return results ?? [];
		});

		for (const doc of pending) {
			await step.do(`ingest ${doc.id}`, { retries: { limit: 1, delay: '15 seconds' } }, async () =>
				ingestOne(this.env, doc),
			);
		}

		return { processed: pending.length };
	}
}
