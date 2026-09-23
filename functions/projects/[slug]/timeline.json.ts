import type { TimelineEvent } from '../../_lib/timeline-types';

interface Env {
	DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const slug = context.params.slug;
	if (!slug || typeof slug !== 'string') {
		return Response.json({ error: 'missing slug' }, { status: 400 });
	}
	if (!context.env.DB) {
		return Response.json({ slug, events: [], error: 'DB unbound' }, { status: 503 });
	}

	const { results } = await context.env.DB.prepare(
		`SELECT id, project_slug, kind, occurred_at, url, title, news_id
     FROM events WHERE project_slug = ? ORDER BY occurred_at DESC LIMIT 200`,
	)
		.bind(slug)
		.all<TimelineEvent>();

	return Response.json(
		{ slug, events: results ?? [] },
		{ headers: { 'Cache-Control': 'public, max-age=60' } },
	);
};
