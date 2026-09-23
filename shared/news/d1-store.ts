import type { NewsFile, NewsItem } from '../../src/utils/news-types.ts';

type NewsRow = {
	id: string;
	url: string;
	kind: string;
	lang: string;
	region: string;
	source_label: string;
	source_id: string;
	published_at: string;
	retrieved_at: string;
	title_original: string;
	summary_original: string;
	title_ja: string;
	summary_ja: string;
	account_handle: string | null;
	machine_translated: number;
	project_slugs_json: string | null;
	ingest_as_source: number | null;
	llm_classified_at: string | null;
	llm_reason: string | null;
	updated_at: string;
};

function parseSlugs(raw: string | null): string[] | undefined {
	if (!raw) return undefined;
	try {
		const v = JSON.parse(raw);
		return Array.isArray(v) ? v.map(String) : undefined;
	} catch {
		return undefined;
	}
}

function rowToItem(row: NewsRow): NewsItem {
	return {
		id: row.id,
		url: row.url,
		kind: row.kind as NewsItem['kind'],
		lang: row.lang as NewsItem['lang'],
		region: row.region as NewsItem['region'],
		sourceLabel: row.source_label,
		sourceId: row.source_id,
		publishedAt: row.published_at,
		retrievedAt: row.retrieved_at,
		titleOriginal: row.title_original,
		summaryOriginal: row.summary_original,
		titleJa: row.title_ja,
		summaryJa: row.summary_ja,
		accountHandle: row.account_handle ?? undefined,
		machineTranslated: Boolean(row.machine_translated),
		projectSlugs: parseSlugs(row.project_slugs_json),
		ingestAsSource:
			row.ingest_as_source === null || row.ingest_as_source === undefined
				? undefined
				: Boolean(row.ingest_as_source),
		llmClassifiedAt: row.llm_classified_at ?? undefined,
		llmReason: row.llm_reason ?? undefined,
	};
}

export async function loadNewsFromD1(db: D1Database, limit = 200): Promise<NewsFile> {
	const { results } = await db
		.prepare(
			`SELECT * FROM news_items ORDER BY published_at DESC LIMIT ?`,
		)
		.bind(limit)
		.all<NewsRow>();

	const items = (results ?? []).map(rowToItem);
	const updatedAt =
		items.reduce((max, i) => (i.retrievedAt > max ? i.retrievedAt : max), '') ||
		new Date(0).toISOString();

	return {
		updatedAt,
		xConfigured: items.some((i) => i.kind === 'x'),
		items,
	};
}

export async function replaceNewsInD1(db: D1Database, file: NewsFile): Promise<void> {
	const items = file.items.slice(0, 200);
	const now = file.updatedAt || new Date().toISOString();

	// Full replace to match previous whole-file semantics
	await db.prepare(`DELETE FROM news_items`).run();

	for (const item of items) {
		await db
			.prepare(
				`INSERT INTO news_items (
           id, url, kind, lang, region, source_label, source_id,
           published_at, retrieved_at, title_original, summary_original,
           title_ja, summary_ja, account_handle, machine_translated,
           project_slugs_json, ingest_as_source, llm_classified_at, llm_reason, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				item.id,
				item.url,
				item.kind,
				item.lang,
				item.region,
				item.sourceLabel,
				item.sourceId,
				item.publishedAt,
				item.retrievedAt,
				item.titleOriginal,
				item.summaryOriginal,
				item.titleJa,
				item.summaryJa,
				item.accountHandle ?? null,
				item.machineTranslated ? 1 : 0,
				item.projectSlugs ? JSON.stringify(item.projectSlugs) : null,
				item.ingestAsSource === undefined ? null : item.ingestAsSource ? 1 : 0,
				item.llmClassifiedAt ?? null,
				item.llmReason ?? null,
				now,
			)
			.run();
	}
}

export async function newsGateStats(db: D1Database): Promise<{
	total: number;
	gated: number;
	ungated: number;
	recent: NewsItem[];
}> {
	const totalRow = await db.prepare(`SELECT COUNT(*) AS n FROM news_items`).first<{ n: number }>();
	const gatedRow = await db
		.prepare(`SELECT COUNT(*) AS n FROM news_items WHERE ingest_as_source = 1`)
		.first<{ n: number }>();
	const total = Number(totalRow?.n ?? 0);
	const gated = Number(gatedRow?.n ?? 0);
	const { results } = await db
		.prepare(`SELECT * FROM news_items ORDER BY published_at DESC LIMIT 8`)
		.all<NewsRow>();
	return {
		total,
		gated,
		ungated: Math.max(0, total - gated),
		recent: (results ?? []).map(rowToItem),
	};
}
