import { PROJECTS, type ProjectConfig, type ProjectSlug } from '../../src/config/projects.ts';
import { listInScopeFrom } from './catalog.ts';

/** Sync helpers over an explicit catalog (D1-loaded or seed). */
export function catalogSlugsFrom(catalog: ProjectConfig[]): string[] {
	return catalog.map((p) => p.slug);
}

export function inScopeSlugsFrom(catalog: ProjectConfig[]): string[] {
	return listInScopeFrom(catalog).map((p) => p.slug);
}

export function catalogPromptLinesFrom(catalog: ProjectConfig[]): string {
	return listInScopeFrom(catalog)
		.map((p) => `- ${p.slug}: ${p.nameJa} / ${p.nameEn}`)
		.join('\n');
}

export function filterCatalogSlugsFrom(raw: unknown, catalog: ProjectConfig[]): ProjectSlug[] {
	const inScope = new Set(listInScopeFrom(catalog).map((p) => p.slug));
	if (!Array.isArray(raw)) return ['unassigned'];
	const out: ProjectSlug[] = [];
	const seen = new Set<string>();
	for (const x of raw) {
		if (typeof x !== 'string') continue;
		const slug = x.trim();
		if (!inScope.has(slug) || seen.has(slug)) continue;
		seen.add(slug);
		out.push(slug as ProjectSlug);
	}
	return out.length ? out : ['unassigned'];
}

/** @deprecated Prefer *From(catalog) with loadCatalog(db) */
export function catalogSlugs(): ProjectSlug[] {
	return PROJECTS.map((p) => p.slug);
}

/** @deprecated Prefer inScopeSlugsFrom */
export function inScopeSlugs(): ProjectSlug[] {
	return listInScopeFrom(PROJECTS).map((p) => p.slug);
}

/** @deprecated Prefer catalogPromptLinesFrom */
export function catalogPromptLines(): string {
	return catalogPromptLinesFrom(PROJECTS);
}

/** @deprecated Prefer filterCatalogSlugsFrom */
export function filterCatalogSlugs(raw: unknown): ProjectSlug[] {
	return filterCatalogSlugsFrom(raw, PROJECTS);
}

export function isCatalogSlug(slug: string, catalog: ProjectConfig[] = PROJECTS): boolean {
	return catalog.some((p) => p.slug === slug);
}

export function isInScopeSlug(slug: string, catalog: ProjectConfig[] = PROJECTS): boolean {
	return listInScopeFrom(catalog).some((p) => p.slug === slug);
}
