/** Allowlist helpers for project catalog slugs (no keyword classification). */

import { PROJECTS, type ProjectSlug } from '../../src/config/projects.ts';

const CATALOG = new Set(PROJECTS.map((p) => p.slug));

export function catalogSlugs(): ProjectSlug[] {
	return PROJECTS.map((p) => p.slug);
}

export function catalogPromptLines(): string {
	return PROJECTS.filter((p) => p.slug !== 'unassigned')
		.map((p) => `- ${p.slug}: ${p.nameJa} / ${p.nameEn}`)
		.join('\n');
}

/** Keep only known catalog slugs; empty → unassigned. Never invent. */
export function filterCatalogSlugs(raw: unknown): ProjectSlug[] {
	if (!Array.isArray(raw)) return ['unassigned'];
	const out: ProjectSlug[] = [];
	const seen = new Set<string>();
	for (const x of raw) {
		if (typeof x !== 'string') continue;
		const slug = x.trim();
		if (!CATALOG.has(slug as ProjectSlug) || seen.has(slug)) continue;
		seen.add(slug);
		out.push(slug as ProjectSlug);
	}
	return out.length ? out : ['unassigned'];
}

export function isCatalogSlug(slug: string): slug is ProjectSlug {
	return CATALOG.has(slug as ProjectSlug);
}
