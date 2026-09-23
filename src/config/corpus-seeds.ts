import type { ProjectSlug } from './projects.ts';

export type SeedKind = 'official' | 'paper';

export interface CorpusSeed {
	url: string;
	title: string;
	project: ProjectSlug;
	kind: SeedKind;
	/** ISO date if known */
	occurredAt?: string;
}

/** Official pages to seed the timeline RAG (abstracts / page text, not PDFs). */
export const CORPUS_SEEDS: CorpusSeed[] = [
	{
		url: 'https://www.jaxa.jp/projects/iss_human/',
		title: 'JAXA 有人宇宙活動',
		project: 'iss-kibo',
		kind: 'official',
	},
	{
		url: 'https://iss.jaxa.jp/',
		title: 'JAXA ISS',
		project: 'iss-kibo',
		kind: 'official',
	},
	{
		url: 'https://www.nasa.gov/humans-in-space/artemis/',
		title: 'NASA Artemis',
		project: 'artemis',
		kind: 'official',
		occurredAt: '2017-01-01',
	},
	{
		url: 'https://www.nasa.gov/mission/gateway/',
		title: 'NASA Gateway',
		project: 'gateway',
		kind: 'official',
	},
	{
		url: 'https://www8.cao.go.jp/space/plan/plan.html',
		title: '内閣府 宇宙基本計画',
		project: 'artemis',
		kind: 'official',
	},
	{
		url: 'https://www8.cao.go.jp/space/budget/budget.html',
		title: '内閣府 宇宙関係予算',
		project: 'iss-kibo',
		kind: 'official',
	},
	{
		url: 'https://www.mext.go.jp/a_menu/kaihatu/space/',
		title: '文部科学省 宇宙開発利用',
		project: 'artemis',
		kind: 'official',
	},
	{
		url: 'https://humans-in-space.jaxa.jp/biz-lab/tech/pressurized-rover/',
		title: 'JAXA 有人与圧ローバー',
		project: 'pressurized-rover',
		kind: 'official',
	},
];

/** Fixed queries for NTRS abstract search (human spaceflight / Japan-relevant). */
export const NTRS_QUERIES = [
	'International Space Station Japan Kibo',
	'Artemis Gateway Japan',
	'pressurized rover lunar surface Japan',
	'commercial LEO destination post ISS',
];
