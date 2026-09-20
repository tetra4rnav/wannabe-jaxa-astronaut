import type { ProposalsFile, WikiProposal } from '../../src/utils/proposal-types.ts';
import { PROPOSALS_KV_KEY } from '../../src/utils/proposal-types.ts';

export { PROPOSALS_KV_KEY };

export async function loadProposals(store: KVNamespace): Promise<ProposalsFile> {
	const raw = await store.get(PROPOSALS_KV_KEY);
	if (!raw) return { updatedAt: new Date(0).toISOString(), items: [] };
	try {
		const parsed = JSON.parse(raw) as ProposalsFile;
		if (!Array.isArray(parsed.items)) parsed.items = [];
		return parsed;
	} catch {
		return { updatedAt: new Date(0).toISOString(), items: [] };
	}
}

export async function upsertProposal(
	store: KVNamespace,
	proposal: WikiProposal,
): Promise<ProposalsFile> {
	const file = await loadProposals(store);
	const idx = file.items.findIndex((p) => p.newsId === proposal.newsId || p.id === proposal.id);
	if (idx >= 0) file.items[idx] = proposal;
	else file.items.unshift(proposal);
	file.items = file.items.slice(0, 200);
	file.updatedAt = new Date().toISOString();
	await store.put(PROPOSALS_KV_KEY, JSON.stringify(file));
	return file;
}
