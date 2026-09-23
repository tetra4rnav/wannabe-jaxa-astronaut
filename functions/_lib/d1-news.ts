/** Colocated under functions/ for Pages Functions bundler (no imports outside functions/). */
import type { NewsFile, NewsItem } from './store';

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
		kind: row.kind,
		lang: row.lang,
		region: row.region,
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
		.prepare(`SELECT * FROM news_items ORDER BY published_at DESC LIMIT ?`)
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
