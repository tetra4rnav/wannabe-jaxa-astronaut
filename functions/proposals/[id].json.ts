import { loadProposalsFromD1 } from '../_lib/d1-proposals';

interface Env {
	DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const id = context.params.id;
	if (!id || typeof id !== 'string') {
		return Response.json({ error: 'missing id' }, { status: 400 });
	}
	try {
		const file = await loadProposalsFromD1(context.env.DB);
		const decoded = decodeURIComponent(id);
		const item = (file.items ?? []).find((p) => p.id === decoded || p.newsId === decoded);
		if (!item) return Response.json({ error: 'not found' }, { status: 404 });
		return Response.json(item, {
			headers: { 'Cache-Control': 'public, max-age=60' },
		});
	} catch {
		return Response.json({ error: 'unavailable' }, { status: 500 });
	}
};
