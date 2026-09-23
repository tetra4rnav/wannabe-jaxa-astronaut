import type { ProposalsFile, WikiProposal } from '../../src/utils/proposal-types.ts';
import {
	loadProposalsFromD1,
	upsertProposalInD1,
} from './d1-store.ts';

/** @deprecated KV key removed; kept for import compatibility during cutover */
export const PROPOSALS_KV_KEY = 'proposals:file';

export async function loadProposals(db: D1Database): Promise<ProposalsFile> {
	return loadProposalsFromD1(db);
}

export async function upsertProposal(
	db: D1Database,
	proposal: WikiProposal,
): Promise<ProposalsFile> {
	return upsertProposalInD1(db, proposal);
}
