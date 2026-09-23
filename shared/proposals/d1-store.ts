import type { ProposalsFile, WikiProposal } from '../../src/utils/proposal-types.ts';

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
		action: row.action as WikiProposal['action'],
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

export async function upsertProposalInD1(
	db: D1Database,
	proposal: WikiProposal,
): Promise<ProposalsFile> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO proposals (
         id, created_at, news_id, news_url, news_title, project_slugs_json,
         action, target_docs_id, proposed_title, headings_json, evidence_urls_json,
         timeline_note, relation, rationale, model, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         created_at=excluded.created_at,
         news_id=excluded.news_id,
         news_url=excluded.news_url,
         news_title=excluded.news_title,
         project_slugs_json=excluded.project_slugs_json,
         action=excluded.action,
         target_docs_id=excluded.target_docs_id,
         proposed_title=excluded.proposed_title,
         headings_json=excluded.headings_json,
         evidence_urls_json=excluded.evidence_urls_json,
         timeline_note=excluded.timeline_note,
         relation=excluded.relation,
         rationale=excluded.rationale,
         model=excluded.model,
         updated_at=excluded.updated_at`,
		)
		.bind(
			proposal.id,
			proposal.createdAt,
			proposal.newsId,
			proposal.newsUrl,
			proposal.newsTitle,
			JSON.stringify(proposal.projectSlugs),
			proposal.action,
			proposal.targetDocsId,
			proposal.proposedTitle,
			JSON.stringify(proposal.headings),
			JSON.stringify(proposal.evidenceUrls),
			proposal.timelineNote,
			proposal.relation,
			proposal.rationale,
			proposal.model,
			now,
		)
		.run();

	// Cap at 200 by deleting oldest beyond limit
	await db
		.prepare(
			`DELETE FROM proposals WHERE id NOT IN (
         SELECT id FROM proposals ORDER BY created_at DESC LIMIT 200
       )`,
		)
		.run();

	return loadProposalsFromD1(db);
}

export async function proposalStats(db: D1Database): Promise<{
	total: number;
	recent: WikiProposal[];
}> {
	const totalRow = await db.prepare(`SELECT COUNT(*) AS n FROM proposals`).first<{ n: number }>();
	const { results } = await db
		.prepare(`SELECT * FROM proposals ORDER BY created_at DESC LIMIT 8`)
		.all<ProposalRow>();
	return {
		total: Number(totalRow?.n ?? 0),
		recent: (results ?? []).map(rowToProposal),
	};
}
