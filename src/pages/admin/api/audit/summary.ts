import type { APIRoute } from 'astro';
import { assertAdminAccess, getDb } from '../../../../lib/admin-access';
import { newsGateStats } from '../../../../../shared/news/d1-store';
import { proposalStats } from '../../../../../shared/proposals/d1-store';
import { documentStatusCounts, recentDocuments } from '../../../../../shared/timeline/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
	const denied = assertAdminAccess(context);
	if (denied) return denied;
	const db = await getDb();
	if (!db) return new Response('DB unavailable', { status: 503 });

	try {
		const [counts, recentDocs, news, proposals] = await Promise.all([
			documentStatusCounts(db),
			recentDocuments(db, ['pending', 'failed', 'skipped'], 12),
			newsGateStats(db),
			proposalStats(db),
		]);
		return Response.json({
			documents: { counts, recent: recentDocs },
			news: {
				total: news.total,
				gated: news.gated,
				ungated: news.ungated,
				recent: news.recent.map((n) => ({
					id: n.id,
					titleJa: n.titleJa,
					ingestAsSource: n.ingestAsSource,
					publishedAt: n.publishedAt,
				})),
			},
			proposals: {
				total: proposals.total,
				recent: proposals.recent.map((p) => ({
					id: p.id,
					proposedTitle: p.proposedTitle,
					action: p.action,
					createdAt: p.createdAt,
				})),
			},
		});
	} catch (e) {
		return new Response(e instanceof Error ? e.message : 'audit failed', { status: 500 });
	}
};
