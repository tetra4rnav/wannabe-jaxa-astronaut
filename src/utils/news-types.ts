export type NewsKind = 'rss' | 'html-list' | 'x';
export type NewsLang = 'ja' | 'en' | 'ru' | 'zh';
export type NewsRegion = 'japan' | 'usa' | 'europe' | 'spacex' | 'russia' | 'china';

export interface NewsItem {
	id: string;
	url: string;
	kind: NewsKind;
	lang: NewsLang;
	region: NewsRegion;
	sourceLabel: string;
	sourceId: string;
	publishedAt: string;
	retrievedAt: string;
	titleOriginal: string;
	summaryOriginal: string;
	titleJa: string;
	summaryJa: string;
	/** Present for X posts */
	accountHandle?: string;
	machineTranslated: boolean;
	/** Catalog project slugs from classifier (includes unassigned) */
	projectSlugs?: string[];
}

export interface NewsFile {
	updatedAt: string;
	xConfigured: boolean;
	items: NewsItem[];
}
