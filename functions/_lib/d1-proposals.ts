/** Colocated under functions/ for Pages Functions bundler (no imports outside functions/). */
import type { ProposalsFile, WikiProposal } from './store';

type ProposalRow = {
	id: string;
	created_at: string;
	news_id: string;
	news_url: string;
	news_title: string;
	project_slugs_json: string;
	action: string;
	target_docs_id: string | null;
	proposed_title: string;
	headings_json: string;
	evidence_urls_json: string;
	timeline_note: string;
	relation: string;
	rationale: string;
	model: string;
	updated_at: string;
};

function parseStringArray(raw: string): string[] {
	try {
		const v = JSON.parse(raw);
		return Array.isArray(v) ? v.map(String) : [];
	} catch {
		return [];
	}
}

function rowToProposal(row: ProposalRow): WikiProposal {
	return {
		id: row.id,
		createdAt: row.created_at,
		newsId: row.news_id,
		newsUrl: row.news_url,
		newsTitle: row.news_title,
		projectSlugs: parseStringArray(row.project_slugs_json),
		action: row.action,
		targetDocsId: row.target_docs_id,
		proposedTitle: row.proposed_title,
		headings: parseStringArray(row.headings_json),
		evidenceUrls: parseStringArray(row.evidence_urls_json),
		timelineNote: row.timeline_note,
		relation: row.relation,
		rationale: row.rationale,
		model: row.model,
	};
}

export async function loadProposalsFromD1(db: D1Database, limit = 200): Promise<ProposalsFile> {
	const { results } = await db
		.prepare(`SELECT * FROM proposals ORDER BY created_at DESC LIMIT ?`)
		.bind(limit)
		.all<ProposalRow>();
	const items = (results ?? []).map(rowToProposal);
	return {
		updatedAt: items[0]?.createdAt ?? new Date(0).toISOString(),
		items,
	};
}
