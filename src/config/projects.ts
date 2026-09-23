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

export type ProjectPhase = 'ongoing' | 'planned';
export type ProjectRole = 'seed' | 'related' | 'retired';
export type ProjectRelationType = 'partner' | 'depends_on' | 'successor';

export interface ProjectRelation {
	type: ProjectRelationType;
	target: ProjectSlug;
}

export interface ProjectConfig {
	slug: ProjectSlug;
	nameJa: string;
	nameEn: string;
	/** Optional wiki docs id (legacy; Wiki is deferred) */
	wikiDocsId?: string;
	startDate?: string;
	endDate?: string | null;
	/** Lowercase keywords / phrases for display and feed heuristics */
	keywords: string[];
	/** Present for seed / related only */
	phase?: ProjectPhase;
	/** omitted for unassigned */
	role?: ProjectRole;
	relations?: ProjectRelation[];
}

/**
 * Human-owned program catalog. Classifiers may only emit in-scope slugs
 * (seed / related) or unassigned. Do not invent new slugs in LLM output.
 * Retired slugs stay for page generation and old event links.
 */
export const PROJECTS: ProjectConfig[] = [
	{
		slug: 'iss-kibo',
		nameJa: 'ISS / きぼう',
		nameEn: 'ISS / Kibo',
		wikiDocsId: 'policy/japan-human-spaceflight',
		startDate: '1998-11-20',
		phase: 'ongoing',
		role: 'seed',
		keywords: [
			'iss',
			'国際宇宙ステーション',
			'きぼう',
			'kibo',
			'station',
			'мкс',
			'天宫',
		],
	},
	{
		slug: 'htv',
		nameJa: 'HTV / HTV-X',
		nameEn: 'HTV / HTV-X',
		startDate: '2009-09-10',
		role: 'retired',
		keywords: ['htv', 'こうのとり', 'htv-x', 'kounotori'],
	},
	{
		slug: 'artemis',
		nameJa: 'アルテミス',
		nameEn: 'Artemis',
		wikiDocsId: 'policy/japan-human-spaceflight',
		startDate: '2017-01-01',
		phase: 'ongoing',
		role: 'seed',
		keywords: ['artemis', 'アルテミス', 'orion', 'sls'],
	},
	{
		slug: 'gateway',
		nameJa: 'ゲートウェイ',
		nameEn: 'Lunar Gateway',
		startDate: '2019-01-01',
		phase: 'planned',
		role: 'related',
		relations: [{ type: 'partner', target: 'artemis' }],
		keywords: ['gateway', 'ゲートウェイ', 'lunar gateway'],
	},
	{
		slug: 'pressurized-rover',
		nameJa: '有人与圧ローバ',
		nameEn: 'Pressurized rover',
		wikiDocsId: 'society/lunar-society',
		phase: 'planned',
		role: 'seed',
		relations: [
			{ type: 'partner', target: 'artemis' },
			{ type: 'depends_on', target: 'artemis' },
		],
		keywords: ['与圧ローバ', 'pressurized rover', 'lunar rover', '月面ローバ'],
	},
	{
		slug: 'astronaut-selection',
		nameJa: '宇宙飛行士選抜',
		nameEn: 'Astronaut selection',
		wikiDocsId: 'astronauts/overview',
		role: 'retired',
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
		role: 'retired',
		keywords: ['宇宙基本計画', 'space basic plan', '宇宙政策', '宇宙予算'],
	},
	{
		slug: 'h3',
		nameJa: 'H3',
		nameEn: 'H3 launch vehicle',
		role: 'retired',
		keywords: ['h3', 'h-iiia', 'h-iia', 'ロケット'],
	},
	{
		slug: 'commercial-leo',
		nameJa: '商業低軌道',
		nameEn: 'Commercial LEO',
		phase: 'planned',
		role: 'related',
		relations: [{ type: 'successor', target: 'iss-kibo' }],
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

/** Seed + related — visitor lists and new classification targets. */
export function listInScopeProjects(): ProjectConfig[] {
	return PROJECTS.filter((p) => p.role === 'seed' || p.role === 'related');
}

/** All named projects including retired — static `/projects/{slug}/` pages. */
export function listProjectPages(): ProjectConfig[] {
	return PROJECTS.filter((p) => p.slug !== 'unassigned');
}

/** @deprecated Prefer listInScopeProjects for UI lists. */
export function listCatalogProjects(): ProjectConfig[] {
	return listInScopeProjects();
}

export function relationLabelJa(type: ProjectRelationType): string {
	switch (type) {
		case 'partner':
			return '連携';
		case 'depends_on':
			return '依存';
		case 'successor':
			return '後継';
	}
}

export function phaseLabelJa(phase: ProjectPhase): string {
	return phase === 'ongoing' ? '進行中' : '計画中';
}
