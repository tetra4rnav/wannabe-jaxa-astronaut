import { PROJECTS, type ProjectSlug } from '../../src/config/projects.ts';

/** Keyword classifier against the human catalog. Never invents slugs. */
export function classifyProjects(text: string): ProjectSlug[] {
	const hay = text.toLowerCase();
	const hits: ProjectSlug[] = [];
	for (const p of PROJECTS) {
		if (p.keywords.some((k) => hay.includes(k.toLowerCase()))) {
			hits.push(p.slug);
		}
	}
	return hits.length ? hits : ['unassigned'];
}

export function classifyNewsItem(item: {
	titleOriginal: string;
	summaryOriginal: string;
	titleJa?: string;
	summaryJa?: string;
}): ProjectSlug[] {
	return classifyProjects(
		[item.titleOriginal, item.summaryOriginal, item.titleJa ?? '', item.summaryJa ?? ''].join(
			'\n',
		),
	);
}
