export type WikiProposalAction = 'update' | 'create' | 'add-project' | 'skip';

export type WikiProposal = {
	id: string;
	createdAt: string;
	newsId: string;
	newsUrl: string;
	newsTitle: string;
	projectSlugs: string[];
	action: WikiProposalAction;
	/** Existing Starlight docs id, or proposed path for create */
	targetDocsId: string | null;
	proposedTitle: string;
	headings: string[];
	/** Allowlisted official URLs only */
	evidenceUrls: string[];
	/** Where this sits on the project timeline relative to prior official material */
	timelineNote: string;
	/** How the news relates to prior official chunks (not a finished article brief) */
	relation: string;
	rationale: string;
	model: string;
};

export type ProposalsFile = {
	updatedAt: string;
	items: WikiProposal[];
};

export const PROPOSALS_KV_KEY = 'proposals:file';

export function proposalIdForNews(newsId: string): string {
	return `prop-${newsId}`;
}
