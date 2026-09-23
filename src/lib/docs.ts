import { getCollection, type CollectionEntry } from 'astro:content';

export type WikiDoc = CollectionEntry<'docs'>;

export type NavItem = {
	href: string;
	title: string;
};

export type NavGroup = {
	label: string;
	items: NavItem[];
};

export function docIdToSlug(id: string): string {
	return id
		.replace(/\\/g, '/')
		.replace(/\.(md|mdx)$/i, '')
		.replace(/\/index$/, '')
		.replace(/^index$/, '');
}

export function isExcludedWiki(id: string, draft?: boolean): boolean {
	if (draft) return true;
	const normalized = id.replace(/\\/g, '/');
	if (normalized.includes('_template')) return true;
	return docIdToSlug(id) === '';
}

export function slugToHref(slug: string): string {
	return slug ? `/${slug}/` : '/';
}

export function slugToMdHref(slug: string): string {
	return slug ? `/${slug}.md` : '/index.md';
}

export async function getPublishedDocs(): Promise<WikiDoc[]> {
	const docs = await getCollection('docs');
	return docs.filter((doc) => !isExcludedWiki(doc.id, doc.data.draft));
}

export async function getSidebarNav(): Promise<NavGroup[]> {
	const docs = await getPublishedDocs();
	const site: NavGroup = {
		label: 'このサイト',
		items: [
			{ href: '/news/', title: 'ニュース' },
			{ href: '/projects/', title: 'プロジェクト時系列' },
			{ href: '/proposals/', title: 'Wiki 構築提案' },
			{ href: '/about/', title: 'このサイトについて' },
			{ href: '/sitemap/', title: 'サイトマップ' },
		],
	};

	const folders = new Set<string>();
	for (const doc of docs) {
		const pathId = doc.id.replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
		const parts = pathId.split('/');
		if (parts.length >= 2) folders.add(parts[0]!);
	}

	const wikiGroups: NavGroup[] = [...folders].sort().map((folder) => {
		const pages = docs
			.filter((doc) => {
				const pathId = doc.id.replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
				const slug = docIdToSlug(doc.id);
				return slug === folder || pathId === `${folder}/index` || pathId.startsWith(`${folder}/`);
			})
			.sort((a, b) => {
				const sa = docIdToSlug(a.id);
				const sb = docIdToSlug(b.id);
				if (sa === folder) return -1;
				if (sb === folder) return 1;
				return sa.localeCompare(sb, 'ja');
			});
		const index = pages.find((p) => docIdToSlug(p.id) === folder);
		return {
			label: index?.data.title ?? folder,
			items: pages.map((doc) => {
				const slug = docIdToSlug(doc.id);
				return {
					href: slugToHref(slug),
					title: doc.data.title,
				};
			}),
		};
	});

	return [site, ...wikiGroups];
}

export type WikiTheme = {
	href: string;
	title: string;
	description?: string;
};

/** Folder index pages for the home Wiki section. */
export async function getWikiThemes(): Promise<WikiTheme[]> {
	const docs = await getPublishedDocs();
	const folders = new Set<string>();
	for (const doc of docs) {
		const pathId = doc.id.replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
		const parts = pathId.split('/');
		if (parts.length >= 2) folders.add(parts[0]!);
	}

	const themes: WikiTheme[] = [];
	for (const folder of folders) {
		const index = docs.find((doc) => docIdToSlug(doc.id) === folder);
		if (!index) continue;
		themes.push({
			href: slugToHref(folder),
			title: index.data.title,
			description: index.data.description,
		});
	}
	return themes.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}
