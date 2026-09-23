export {
	ensureCatalogSeeded,
	syncProjectsTable,
	loadCatalog,
	upsertProjectConfig,
	retireProject,
} from './catalog.ts';

export async function upsertEvent(
	db: D1Database,
	row: {
		projectSlug: string;
		kind: 'news' | 'official' | 'paper' | 'wiki';
		occurredAt: string;
		url: string;
		title: string;
		newsId?: string | null;
		docId?: number | null;
	},
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO events (project_slug, kind, occurred_at, url, title, news_id, doc_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_slug, url, kind) DO UPDATE SET
         occurred_at=excluded.occurred_at,
         title=excluded.title,
         news_id=COALESCE(excluded.news_id, events.news_id),
         doc_id=COALESCE(excluded.doc_id, events.doc_id)`,
		)
		.bind(
			row.projectSlug,
			row.kind,
			row.occurredAt,
			row.url,
			row.title,
			row.newsId ?? null,
			row.docId ?? null,
		)
		.run();
}

export async function enqueueDocument(
	db: D1Database,
	row: {
		url: string;
		title: string;
		sourceType: 'official' | 'paper' | 'wiki' | 'news';
		projectSlug: string;
		occurredAt?: string | null;
	},
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO documents (url, title, source_type, project_slug, occurred_at, status)
       VALUES (?, ?, ?, ?, ?, 'pending')
       ON CONFLICT(url) DO UPDATE SET
         title=excluded.title,
         project_slug=excluded.project_slug,
         occurred_at=COALESCE(excluded.occurred_at, documents.occurred_at)`,
		)
		.bind(row.url, row.title, row.sourceType, row.projectSlug, row.occurredAt ?? null)
		.run();
}

export async function documentStatusCounts(db: D1Database): Promise<Record<string, number>> {
	const { results } = await db
		.prepare(`SELECT status, COUNT(*) AS n FROM documents GROUP BY status`)
		.all<{ status: string; n: number }>();
	const out: Record<string, number> = {
		pending: 0,
		ingested: 0,
		failed: 0,
		skipped: 0,
	};
	for (const r of results ?? []) {
		out[r.status] = Number(r.n);
	}
	return out;
}

export async function recentDocuments(
	db: D1Database,
	statuses: string[],
	limit = 10,
): Promise<
	{
		id: number;
		url: string;
		title: string | null;
		project_slug: string;
		status: string;
		error: string | null;
	}[]
> {
	const placeholders = statuses.map(() => '?').join(',');
	const { results } = await db
		.prepare(
			`SELECT id, url, title, project_slug, status, error FROM documents
       WHERE status IN (${placeholders})
       ORDER BY id DESC LIMIT ?`,
		)
		.bind(...statuses, limit)
		.all();
	return (results ?? []) as {
		id: number;
		url: string;
		title: string | null;
		project_slug: string;
		status: string;
		error: string | null;
	}[];
}
