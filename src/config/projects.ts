export type ProjectSlug =
	| 'iss-kibo'
	| 'htv'
	| 'artemis'
	| 'gateway'
	| 'pressurized-rover'
	| 'astronaut-selection'
	| 'space-basic-plan'
	| 'h3'
	| 'commercial-leo'
	| 'unassigned';

export interface ProjectConfig {
	slug: ProjectSlug;
	nameJa: string;
	nameEn: string;
	/** Optional Starlight docs id */
	wikiDocsId?: string;
	startDate?: string;
	endDate?: string | null;
	/** Lowercase keywords / phrases for classifier */
	keywords: string[];
}

/**
 * Human-owned program catalog. Classifiers may only emit these slugs
 * (plus unassigned). Do not invent new slugs in LLM output.
 */
export const PROJECTS: ProjectConfig[] = [
	{
		slug: 'iss-kibo',
		nameJa: 'ISS / きぼう',
		nameEn: 'ISS / Kibo',
		wikiDocsId: 'policy/japan-human-spaceflight',
		startDate: '1998-11-20',
		keywords: [
			'iss',
			'国際宇宙ステーション',
			'きぼう',
			'kibo',
			'station',
			'мкс',
			'天宫', // cross-ref noise filtered by region elsewhere
		],
	},
	{
		slug: 'htv',
		nameJa: 'HTV / HTV-X',
		nameEn: 'HTV / HTV-X',
		startDate: '2009-09-10',
		keywords: ['htv', 'こうのとり', 'htv-x', 'kounotori'],
	},
	{
		slug: 'artemis',
		nameJa: 'アルテミス',
		nameEn: 'Artemis',
		wikiDocsId: 'policy/japan-human-spaceflight',
		startDate: '2017-01-01',
		keywords: ['artemis', 'アルテミス', 'orion', 'sls'],
	},
	{
		slug: 'gateway',
		nameJa: 'ゲートウェイ',
		nameEn: 'Lunar Gateway',
		startDate: '2019-01-01',
		keywords: ['gateway', 'ゲートウェイ', 'lunar gateway'],
	},
	{
		slug: 'pressurized-rover',
		nameJa: '有人与圧ローバ',
		nameEn: 'Pressurized rover',
		wikiDocsId: 'society/lunar-society',
		keywords: ['与圧ローバ', 'pressurized rover', 'lunar rover', '月面ローバ'],
	},
	{
		slug: 'astronaut-selection',
		nameJa: '宇宙飛行士選抜',
		nameEn: 'Astronaut selection',
		wikiDocsId: 'astronauts/overview',
		keywords: [
			'宇宙飛行士',
			'astronaut',
			'選抜',
			'candidate',
			'космонавт',
			'航天员',
		],
	},
	{
		slug: 'space-basic-plan',
		nameJa: '宇宙基本計画',
		nameEn: 'Basic Plan on Space Policy',
		wikiDocsId: 'policy/space-basic-plan',
		keywords: ['宇宙基本計画', 'space basic plan', '宇宙政策', '宇宙予算'],
	},
	{
		slug: 'h3',
		nameJa: 'H3',
		nameEn: 'H3 launch vehicle',
		keywords: ['h3', 'h-iiia', 'h-iia', 'ロケット'],
	},
	{
		slug: 'commercial-leo',
		nameJa: '商業低軌道',
		nameEn: 'Commercial LEO',
		keywords: ['commercial leo', '商業低軌道', 'axiom', 'starlab', 'ポストiss', 'post-iss'],
	},
	{
		slug: 'unassigned',
		nameJa: '未分類',
		nameEn: 'Unassigned',
		keywords: [],
	},
];

export const PROJECT_BY_SLUG: Record<string, ProjectConfig> = Object.fromEntries(
	PROJECTS.map((p) => [p.slug, p]),
);

export function listCatalogProjects(): ProjectConfig[] {
	return PROJECTS.filter((p) => p.slug !== 'unassigned');
}
