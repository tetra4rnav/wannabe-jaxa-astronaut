import { PROPOSALS_KV_KEY, type ProposalsFile } from './_lib/store';

interface Env {
	STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const raw = await context.env.STORE?.get(PROPOSALS_KV_KEY);
	if (raw) {
		return new Response(raw, {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=60',
			},
		});
	}
	const empty: ProposalsFile = { updatedAt: new Date(0).toISOString(), items: [] };
	return Response.json(empty, {
		headers: { 'Cache-Control': 'public, max-age=60' },
	});
};
