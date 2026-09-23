import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProjectConfig } from '../../src/config/projects.ts';
import { expandRetrievalSlugs } from './project-graph.ts';

/** Minimal catalog covering walk rules without depending on display-only fields. */
const FIXTURE: ProjectConfig[] = [
	{
		slug: 'iss-kibo',
		nameJa: 'ISS',
		nameEn: 'ISS',
		role: 'seed',
		phase: 'ongoing',
		keywords: [],
	},
	{
		slug: 'htv',
		nameJa: 'HTV',
		nameEn: 'HTV',
		role: 'retired',
		keywords: [],
		relations: [{ type: 'depends_on', target: 'iss-kibo' }],
	},
	{
		slug: 'artemis',
		nameJa: 'Artemis',
		nameEn: 'Artemis',
		role: 'seed',
		phase: 'ongoing',
		keywords: [],
	},
	{
		slug: 'gateway',
		nameJa: 'Gateway',
		nameEn: 'Gateway',
		role: 'related',
		phase: 'planned',
		keywords: [],
		relations: [{ type: 'partner', target: 'artemis' }],
	},
	{
		slug: 'pressurized-rover',
		nameJa: 'Rover',
		nameEn: 'Rover',
		role: 'seed',
		phase: 'planned',
		keywords: [],
		relations: [{ type: 'depends_on', target: 'artemis' }],
	},
	{
		slug: 'commercial-leo',
		nameJa: 'Commercial LEO',
		nameEn: 'Commercial LEO',
		role: 'related',
		phase: 'planned',
		keywords: [],
		relations: [{ type: 'successor', target: 'iss-kibo' }],
	},
	{
		slug: 'unassigned',
		nameJa: 'Unassigned',
		nameEn: 'Unassigned',
		keywords: [],
	},
];

function expand(slugs: string[]) {
	return new Set(expandRetrievalSlugs(slugs, { catalog: FIXTURE, maxHops: 1 }));
}

describe('expandRetrievalSlugs', () => {
	it('includes self and outbound depends_on (pressurized-rover → artemis)', () => {
		const got = expand(['pressurized-rover']);
		assert.ok(got.has('pressurized-rover'));
		assert.ok(got.has('artemis'));
		assert.equal(got.has('gateway'), false);
	});

	it('includes outbound successor (commercial-leo → iss-kibo)', () => {
		const got = expand(['commercial-leo']);
		assert.ok(got.has('commercial-leo'));
		assert.ok(got.has('iss-kibo'));
	});

	it('treats partner as undirected (artemis ↔ gateway)', () => {
		assert.ok(expand(['gateway']).has('artemis'));
		assert.ok(expand(['artemis']).has('gateway'));
	});

	it('does not follow inbound depends_on alone (artemis does not pull rover)', () => {
		const got = expand(['artemis']);
		assert.ok(got.has('artemis'));
		assert.ok(got.has('gateway')); // inbound partner only
		assert.equal(got.has('pressurized-rover'), false);
	});

	it('does not follow inbound successor (iss-kibo does not pull commercial-leo)', () => {
		const got = expand(['iss-kibo']);
		assert.ok(got.has('iss-kibo'));
		assert.equal(got.has('commercial-leo'), false);
		assert.equal(got.has('htv'), false);
	});

	it('allows retired relation targets', () => {
		// Flip: walk from a slug that depends_on a retired target via fixture tweak
		const withRetiredTarget: ProjectConfig[] = [
			...FIXTURE.filter((p) => p.slug !== 'pressurized-rover'),
			{
				slug: 'pressurized-rover',
				nameJa: 'Rover',
				nameEn: 'Rover',
				role: 'seed',
				phase: 'planned',
				keywords: [],
				relations: [{ type: 'depends_on', target: 'htv' }],
			},
		];
		const got = new Set(
			expandRetrievalSlugs(['pressurized-rover'], {
				catalog: withRetiredTarget,
				maxHops: 1,
			}),
		);
		assert.ok(got.has('htv'));
	});

	it('never expands or retains unassigned', () => {
		assert.deepEqual(expandRetrievalSlugs(['unassigned'], { catalog: FIXTURE }), []);
		const mixed = expand(['unassigned', 'artemis']);
		assert.equal(mixed.has('unassigned'), false);
		assert.ok(mixed.has('artemis'));
	});

	it('works against the live PROJECTS catalog partner/successor edges', () => {
		const rover = new Set(expandRetrievalSlugs(['pressurized-rover']));
		assert.ok(rover.has('pressurized-rover'));
		assert.ok(rover.has('artemis'));

		const leo = new Set(expandRetrievalSlugs(['commercial-leo']));
		assert.ok(leo.has('iss-kibo'));

		const artemis = new Set(expandRetrievalSlugs(['artemis']));
		assert.ok(artemis.has('gateway'));
		assert.equal(artemis.has('commercial-leo'), false);
	});
});
