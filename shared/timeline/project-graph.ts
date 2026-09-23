import {
	PROJECTS,
	type ProjectConfig,
	type ProjectRelationType,
} from '../../src/config/projects.ts';

export type ExpandRetrievalOpts = {
	/** Hop depth; product default is 1. */
	maxHops?: number;
	/** Override catalog (tests). Defaults to PROJECTS. */
	catalog?: ProjectConfig[];
};

type EdgeIndex = {
	/** slug → targets for outbound edges of a given type */
	outbound: Map<string, Map<ProjectRelationType, string[]>>;
	/** partner only: slug → partners that point at this slug */
	inboundPartner: Map<string, string[]>;
};

function buildEdgeIndex(catalog: ProjectConfig[]): EdgeIndex {
	const outbound = new Map<string, Map<ProjectRelationType, string[]>>();
	const inboundPartner = new Map<string, string[]>();

	const pushOut = (from: string, type: ProjectRelationType, to: string) => {
		let byType = outbound.get(from);
		if (!byType) {
			byType = new Map();
			outbound.set(from, byType);
		}
		const list = byType.get(type) ?? [];
		list.push(to);
		byType.set(type, list);
	};

	for (const p of catalog) {
		if (p.slug === 'unassigned') continue;
		for (const rel of p.relations ?? []) {
			if (!rel.target || rel.target === 'unassigned') continue;
			pushOut(p.slug, rel.type, rel.target);
			if (rel.type === 'partner') {
				const inbound = inboundPartner.get(rel.target) ?? [];
				inbound.push(p.slug);
				inboundPartner.set(rel.target, inbound);
			}
		}
	}

	return { outbound, inboundPartner };
}

function neighborsAtHop1(slug: string, index: EdgeIndex): string[] {
	const next = new Set<string>();
	const out = index.outbound.get(slug);

	for (const target of out?.get('depends_on') ?? []) next.add(target);
	for (const target of out?.get('successor') ?? []) next.add(target);
	for (const target of out?.get('partner') ?? []) next.add(target);
	for (const from of index.inboundPartner.get(slug) ?? []) next.add(from);

	next.delete('unassigned');
	next.delete(slug);
	return [...next];
}

/**
 * Expand classified project slugs via catalog relations for Vectorize retrieve.
 * maxHops=1, asymmetric: outbound depends_on / successor; undirected partner;
 * never expand unassigned; retired targets allowed.
 */
export function expandRetrievalSlugs(
	slugs: readonly string[],
	opts: ExpandRetrievalOpts = {},
): string[] {
	const maxHops = opts.maxHops ?? 1;
	const catalog = opts.catalog ?? PROJECTS;
	const index = buildEdgeIndex(catalog);

	const seeds = [
		...new Set(slugs.filter((s) => s && s !== 'unassigned')),
	];
	if (!seeds.length) return [];

	const result = new Set<string>(seeds);
	if (maxHops < 1) return [...result];

	let frontier = [...seeds];
	for (let hop = 0; hop < maxHops; hop++) {
		const nextFrontier: string[] = [];
		for (const slug of frontier) {
			for (const n of neighborsAtHop1(slug, index)) {
				if (!result.has(n)) {
					result.add(n);
					nextFrontier.push(n);
				}
			}
		}
		frontier = nextFrontier;
		if (!frontier.length) break;
	}

	return [...result];
}
