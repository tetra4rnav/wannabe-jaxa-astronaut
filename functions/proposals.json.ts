import { loadProposalsFromD1 } from './_lib/d1-proposals';
import type { ProposalsFile } from './_lib/store';

interface Env {
	DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	try {
		const file = await loadProposalsFromD1(context.env.DB);
		return Response.json(file, {
			headers: { 'Cache-Control': 'public, max-age=60' },
		});
	} catch {
		const empty: ProposalsFile = { updatedAt: new Date(0).toISOString(), items: [] };
		return Response.json(empty, {
			headers: { 'Cache-Control': 'public, max-age=60' },
		});
	}
};
