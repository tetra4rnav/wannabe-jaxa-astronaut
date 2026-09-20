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
	/** Catalog project slugs from LLM classifier (includes unassigned) */
	projectSlugs?: string[];
	/** LLM gate: news-like and trustworthy as official-adjacent RAG evidence */
	ingestAsSource?: boolean;
	/** ISO timestamp when LLM classification last ran */
	llmClassifiedAt?: string;
	/** Short LLM rationale (debug / badge context) */
	llmReason?: string;
}

export interface NewsFile {
	updatedAt: string;
	xConfigured: boolean;
	items: NewsItem[];
}
