import {
	PROJECTS,
	type CountryCode,
	type ProjectConfig,
	type ProjectPhase,
	type ProjectRelation,
	type ProjectRelationType,
	type ProjectRole,
} from '../../src/config/projects.ts';

type ProjectRow = {
	slug: string;
	name_ja: string;
	name_en: string;
	wiki_docs_id: string | null;
	start_date: string | null;
	end_date: string | null;
	role: string | null;
	phase: string | null;
	kind_ja: string | null;
	countries_json: string | null;
	keywords_json: string | null;
};

type RelationRow = {
	from_slug: string;
	type: string;
	to_slug: string;
};

function parseJsonArray(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const v = JSON.parse(raw);
		return Array.isArray(v) ? v.map(String) : [];
	} catch {
		return [];
	}
}

function rowToConfig(row: ProjectRow, relations: ProjectRelation[]): ProjectConfig {
	const role = row.role as ProjectRole | null;
	const phase = row.phase as ProjectPhase | null;
	const countries = parseJsonArray(row.countries_json).filter(Boolean) as CountryCode[];
	return {
		slug: row.slug as ProjectConfig['slug'],
		nameJa: row.name_ja,
		nameEn: row.name_en,
		wikiDocsId: row.wiki_docs_id ?? undefined,
		startDate: row.start_date ?? undefined,
		endDate: row.end_date,
		keywords: parseJsonArray(row.keywords_json),
		phase: phase ?? undefined,
		role: role ?? undefined,
		relations: relations.length ? relations : undefined,
		countries: countries.length ? countries : undefined,
		kindJa: row.kind_ja ?? undefined,
	};
}

/** Load catalog from D1; empty / missing DB → TypeScript seed. */
export async function loadCatalog(db?: D1Database | null): Promise<ProjectConfig[]> {
	if (!db) return PROJECTS.map((p) => ({ ...p, relations: p.relations?.map((r) => ({ ...r })) }));

	try {
		const { results: projectRows } = await db
			.prepare(
				`SELECT slug, name_ja, name_en, wiki_docs_id, start_date, end_date,
            role, phase, kind_ja, countries_json, keywords_json
     FROM projects ORDER BY slug`,
			)
			.all<ProjectRow>();

		if (!projectRows?.length) return PROJECTS.map((p) => ({ ...p }));

		const { results: relRows } = await db
			.prepare(`SELECT from_slug, type, to_slug FROM project_relations`)
			.all<RelationRow>();

		const byFrom = new Map<string, ProjectRelation[]>();
		for (const r of relRows ?? []) {
			const type = r.type as ProjectRelationType;
			if (type !== 'partner' && type !== 'depends_on' && type !== 'successor') continue;
			const list = byFrom.get(r.from_slug) ?? [];
			list.push({ type, target: r.to_slug as ProjectRelation['target'] });
			byFrom.set(r.from_slug, list);
		}

		return projectRows.map((row) => rowToConfig(row, byFrom.get(row.slug) ?? []));
	} catch {
		return PROJECTS.map((p) => ({ ...p }));
	}
}

export function listInScopeFrom(catalog: ProjectConfig[]): ProjectConfig[] {
	return catalog.filter((p) => p.role === 'seed' || p.role === 'related');
}

export function projectBySlugFrom(catalog: ProjectConfig[]): Record<string, ProjectConfig> {
	return Object.fromEntries(catalog.map((p) => [p.slug, p]));
}

export async function countProjects(db: D1Database): Promise<number> {
	const row = await db.prepare(`SELECT COUNT(*) AS n FROM projects`).first<{ n: number }>();
	return Number(row?.n ?? 0);
}

/** Seed D1 from TypeScript only when projects table is empty. */
export async function ensureCatalogSeeded(db: D1Database): Promise<'seeded' | 'skipped'> {
	const n = await countProjects(db);
	if (n > 0) return 'skipped';

	for (const p of PROJECTS) {
		await db
			.prepare(
				`INSERT INTO projects (
           slug, name_ja, name_en, wiki_docs_id, start_date, end_date,
           role, phase, kind_ja, countries_json, keywords_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				p.slug,
				p.nameJa,
				p.nameEn,
				p.wikiDocsId ?? null,
				p.startDate ?? null,
				p.endDate ?? null,
				p.role ?? null,
				p.phase ?? null,
				p.kindJa ?? null,
				p.countries ? JSON.stringify(p.countries) : null,
				JSON.stringify(p.keywords ?? []),
			)
			.run();

		for (const rel of p.relations ?? []) {
			await db
				.prepare(
					`INSERT OR IGNORE INTO project_relations (from_slug, type, to_slug) VALUES (?, ?, ?)`,
				)
				.bind(p.slug, rel.type, rel.target)
				.run();
		}
	}
	return 'seeded';
}

export async function upsertProjectConfig(db: D1Database, p: ProjectConfig): Promise<void> {
	await db
		.prepare(
			`INSERT INTO projects (
         slug, name_ja, name_en, wiki_docs_id, start_date, end_date,
         role, phase, kind_ja, countries_json, keywords_json
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         name_ja=excluded.name_ja,
         name_en=excluded.name_en,
         wiki_docs_id=excluded.wiki_docs_id,
         start_date=excluded.start_date,
         end_date=excluded.end_date,
         role=excluded.role,
         phase=excluded.phase,
         kind_ja=excluded.kind_ja,
         countries_json=excluded.countries_json,
         keywords_json=excluded.keywords_json`,
		)
		.bind(
			p.slug,
			p.nameJa,
			p.nameEn,
			p.wikiDocsId ?? null,
			p.startDate ?? null,
			p.endDate ?? null,
			p.role ?? null,
			p.phase ?? null,
			p.kindJa ?? null,
			p.countries ? JSON.stringify(p.countries) : null,
			JSON.stringify(p.keywords ?? []),
		)
		.run();

	await db.prepare(`DELETE FROM project_relations WHERE from_slug = ?`).bind(p.slug).run();
	for (const rel of p.relations ?? []) {
		await db
			.prepare(`INSERT INTO project_relations (from_slug, type, to_slug) VALUES (?, ?, ?)`)
			.bind(p.slug, rel.type, rel.target)
			.run();
	}
}

export async function retireProject(db: D1Database, slug: string): Promise<void> {
	await db.prepare(`UPDATE projects SET role = 'retired' WHERE slug = ?`).bind(slug).run();
}

/** @deprecated Prefer ensureCatalogSeeded — kept name for call-site migration */
export async function syncProjectsTable(db: D1Database): Promise<void> {
	await ensureCatalogSeeded(db);
}
