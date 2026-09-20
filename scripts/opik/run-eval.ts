/**
 * Offline Opik evaluation harness for LLM judgments.
 * Always validates fixture contracts locally.
 * When OPIK_API_KEY + OPIK_WORKSPACE are set, logs a synthetic suite trace batch to Opik Cloud.
 *
 * Usage: npx tsx scripts/opik/run-eval.ts
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS } from '../../src/config/projects.ts';

const __dir = dirname(fileURLToPath(import.meta.url));
const catalog = new Set(PROJECTS.map((p) => p.slug));

type NewsFixture = {
	id: string;
	expect: {
		ingestAsSource?: boolean;
		projectSlugsSubsetOfCatalog?: boolean;
		preferredProjectsAnyOf?: string[];
	};
	assertions: string[];
};

type FactFixture = {
	id: string;
	expect: { verdictIn: string[] };
	assertions: string[];
};

function loadJson<T>(name: string): T {
	return JSON.parse(readFileSync(join(__dir, 'fixtures', name), 'utf8')) as T;
}

function assert(cond: boolean, msg: string, failures: string[]) {
	if (!cond) failures.push(msg);
}

async function maybeLogOpikSuite(suiteName: string, items: { id: string; assertions: string[] }[]) {
	const apiKey = process.env.OPIK_API_KEY;
	const workspace = process.env.OPIK_WORKSPACE;
	const projectName = process.env.OPIK_PROJECT_NAME || 'wannabe-jaxa-astronaut';
	if (!apiKey || !workspace) {
		console.log(`[opik:eval] skip cloud upload for ${suiteName} (set OPIK_API_KEY + OPIK_WORKSPACE)`);
		return;
	}
	const base = 'https://www.comet.com/opik/api/v1/private';
	const headers = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		'Comet-Workspace': workspace,
		authorization: apiKey,
	};
	const start = new Date().toISOString();
	const id = crypto.randomUUID();
	const res = await fetch(`${base}/traces`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			id,
			name: `test-suite:${suiteName}`,
			project_name: projectName,
			start_time: start,
			end_time: new Date().toISOString(),
			input: { suite: suiteName, itemCount: items.length },
			output: {
				items: items.map((i) => ({ id: i.id, assertions: i.assertions })),
				mode: 'fixture-contract',
			},
			tags: [`suite:${suiteName}`, 'judgment:offline-eval'],
			metadata: { kind: 'offline-fixture-suite' },
		}),
	});
	if (!res.ok) {
		console.warn(`[opik:eval] upload failed ${res.status}`, await res.text().catch(() => ''));
		return;
	}
	console.log(`[opik:eval] logged suite trace ${id} to project ${projectName}`);
}

function validateNewsFixtures(failures: string[]) {
	const fixtures = loadJson<NewsFixture[]>('news-ingest-gate.json');
	for (const f of fixtures) {
		assert(Array.isArray(f.assertions) && f.assertions.length > 0, `${f.id}: assertions required`, failures);
		if (f.expect.preferredProjectsAnyOf) {
			for (const slug of f.expect.preferredProjectsAnyOf) {
				assert(catalog.has(slug as never), `${f.id}: preferred slug ${slug} not in catalog`, failures);
			}
		}
		assert(
			typeof f.expect.ingestAsSource === 'boolean',
			`${f.id}: expect.ingestAsSource boolean required`,
			failures,
		);
	}
	console.log(`[opik:eval] news-ingest-gate fixtures: ${fixtures.length} ok (contract)`);
	return fixtures;
}

function validateFactFixtures(failures: string[]) {
	const fixtures = loadJson<FactFixture[]>('fact-check.json');
	for (const f of fixtures) {
		assert(Array.isArray(f.assertions) && f.assertions.length > 0, `${f.id}: assertions required`, failures);
		assert(
			Array.isArray(f.expect.verdictIn) && f.expect.verdictIn.length > 0,
			`${f.id}: verdictIn required`,
			failures,
		);
		for (const v of f.expect.verdictIn) {
			assert(
				v === 'pass' || v === 'needs-update' || v === 'failed',
				`${f.id}: bad verdict ${v}`,
				failures,
			);
		}
	}
	console.log(`[opik:eval] fact-check fixtures: ${fixtures.length} ok (contract)`);
	return fixtures;
}

async function main() {
	const failures: string[] = [];
	const news = validateNewsFixtures(failures);
	const facts = validateFactFixtures(failures);
	await maybeLogOpikSuite(
		'news-ingest-gate',
		news.map((f) => ({ id: f.id, assertions: f.assertions })),
	);
	await maybeLogOpikSuite(
		'fact-check',
		facts.map((f) => ({ id: f.id, assertions: f.assertions })),
	);

	const realFailures = failures.filter(Boolean);
	if (realFailures.length) {
		console.error('[opik:eval] FAILED');
		for (const f of realFailures) console.error(' -', f);
		process.exit(1);
	}
	console.log('[opik:eval] OK');
	console.log(`[opik:eval] Online rules: Opik project → Evaluation Rules; filter tags judgment:news-ingest-gate and judgment:fact-check; map input/output; Custom LLM-as-Judge.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
