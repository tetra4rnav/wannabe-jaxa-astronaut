import { PROPOSALS_KV_KEY, type ProposalsFile } from '../_lib/store';

interface Env {
	STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const id = context.params.id;
	if (!id || typeof id !== 'string') {
		return Response.json({ error: 'missing id' }, { status: 400 });
	}
	const raw = await context.env.STORE?.get(PROPOSALS_KV_KEY);
	if (!raw) {
		return Response.json({ error: 'not found' }, { status: 404 });
	}
	try {
		const file = JSON.parse(raw) as ProposalsFile;
		const decoded = decodeURIComponent(id);
		const item = (file.items ?? []).find((p) => p.id === decoded || p.newsId === decoded);
		if (!item) return Response.json({ error: 'not found' }, { status: 404 });
		return Response.json(item, {
			headers: { 'Cache-Control': 'public, max-age=60' },
		});
	} catch {
		return Response.json({ error: 'invalid store' }, { status: 500 });
	}
};
