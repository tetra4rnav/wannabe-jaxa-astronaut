import type { ProjectRow } from '../_lib/timeline-types';

interface Env {
	DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	if (!context.env.DB) {
		return Response.json({ projects: [], error: 'DB unbound' }, { status: 503 });
	}
	const { results } = await context.env.DB.prepare(
		`SELECT slug, name_ja, name_en, wiki_docs_id, start_date, end_date
     FROM projects WHERE slug != 'unassigned' ORDER BY name_ja`,
	).all<ProjectRow>();

	return Response.json(
		{ projects: results ?? [] },
		{ headers: { 'Cache-Control': 'public, max-age=120' } },
	);
};
