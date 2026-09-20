import { PROJECTS } from '../../src/config/projects.ts';

export async function syncProjectsTable(db: D1Database): Promise<void> {
	for (const p of PROJECTS) {
		await db
			.prepare(
				`INSERT INTO projects (slug, name_ja, name_en, wiki_docs_id, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           name_ja=excluded.name_ja,
           name_en=excluded.name_en,
           wiki_docs_id=excluded.wiki_docs_id,
           start_date=excluded.start_date,
           end_date=excluded.end_date`,
			)
			.bind(
				p.slug,
				p.nameJa,
				p.nameEn,
				p.wikiDocsId ?? null,
				p.startDate ?? null,
				p.endDate ?? null,
			)
			.run();
	}
}

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
