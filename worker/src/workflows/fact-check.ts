import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import type { FactCheckEntry, FactCheckFile } from '../../../src/utils/fact-check-types.ts';
import { factCheckKvKey } from '../../../shared/news/format.ts';
import { runJudgment, type FeedbackScore } from '../../../shared/opik/run-judgment.ts';
import type { Env } from '../env.ts';

const REPO = 'tetra4rnav/wannabe-jaxa-astronaut';

type WikiDoc = { id: string; title: string; sources: string[]; body: string };

const SYSTEM =
	'You are a fact-checker for a JAXA-unofficial wiki. Reply ONLY with JSON: {"verdict":"pass"|"needs-update"|"failed","summary":"...","issues":["..."]}';

function parseFm(raw: string): { title: string; sources: string[]; body: string } {
	if (!raw.startsWith('---')) return { title: '', sources: [], body: raw };
	const end = raw.indexOf('\n---', 3);
	const fm = raw.slice(3, end);
	const body = raw.slice(end + 4);
	const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? '';
	const sources: string[] = [];
	let inSources = false;
	for (const line of fm.split('\n')) {
		if (/^sources:\s*$/.test(line)) {
			inSources = true;
			continue;
		}
		if (inSources && /^\s+-\s+/.test(line)) {
			sources.push(line.replace(/^\s+-\s+/, '').trim());
			continue;
		}
		if (inSources && /^[A-Za-z]/.test(line)) inSources = false;
	}
	return { title, sources, body: body.slice(0, 6000) };
}

async function listWikiDocs(): Promise<WikiDoc[]> {
	const treeRes = await fetch(
		`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`,
		{ headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'wannabe-jaxa-jobs' } },
	);
	if (!treeRes.ok) throw new Error(`GitHub tree ${treeRes.status}`);
	const tree = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
	const paths = (tree.tree ?? [])
		.filter(
			(t) =>
				t.type === 'blob' &&
				t.path.startsWith('src/content/docs/') &&
				/\.mdx?$/.test(t.path) &&
				!t.path.includes('/_template/') &&
				!t.path.endsWith('/index.md') &&
				!t.path.endsWith('/index.mdx') &&
				!t.path.endsWith('/about.md'),
		)
		.map((t) => t.path);

	const docs: WikiDoc[] = [];
	for (const path of paths) {
		const rawRes = await fetch(
			`https://raw.githubusercontent.com/${REPO}/main/${path}`,
			{ headers: { 'User-Agent': 'wannabe-jaxa-jobs' } },
		);
		if (!rawRes.ok) continue;
		const raw = await rawRes.text();
		const id = path
			.replace(/^src\/content\/docs\//, '')
			.replace(/\.mdx?$/, '')
			.replace(/\/index$/, '');
		if (id === 'about' || id === 'index') continue;
		const { title, sources, body } = parseFm(raw);
		if (!sources.length) continue;
		docs.push({ id, title, sources, body });
	}
	return docs;
}

function factCheckScores(parsed: unknown | null): FeedbackScore[] {
	if (!parsed || typeof parsed !== 'object') {
		return [{ name: 'schema_ok', value: 0, reason: 'no object' }];
	}
	const o = parsed as Record<string, unknown>;
	const verdictOk =
		o.verdict === 'pass' || o.verdict === 'needs-update' || o.verdict === 'failed';
	const schemaOk = verdictOk && typeof o.summary === 'string' && Array.isArray(o.issues);
	return [
		{ name: 'schema_ok', value: schemaOk ? 1 : 0 },
		{ name: 'verdict_enum_ok', value: verdictOk ? 1 : 0 },
	];
}

export class FactCheckWorkflow extends WorkflowEntrypoint<Env> {
	async run(_event: WorkflowEvent<unknown>, step: WorkflowStep) {
		const docs = await step.do('list wiki docs', async () => listWikiDocs());

		for (const doc of docs) {
			await step.do(`check ${doc.id}`, { retries: { limit: 1, delay: '20 seconds' } }, async () => {
				const user = `Article title: ${doc.title}\nSources:\n${doc.sources.join('\n')}\n\nBody:\n${doc.body}\n\nCheck claims against the listed official sources. Do not invent facts.`;
				const result = await runJudgment(this.env, {
					name: `fact-check:${doc.id}`,
					tags: ['judgment:fact-check'],
					input: { docsId: doc.id, title: doc.title, sources: doc.sources },
					system: SYSTEM,
					user,
					score: (_raw, parsed) => factCheckScores(parsed),
				});

				let verdict: FactCheckEntry['verdict'] = 'needs-update';
				let summary = 'モデル応答を解析できませんでした';
				let issues: string[] = [];
				if (result.parsed && typeof result.parsed === 'object') {
					const parsed = result.parsed as {
						verdict?: FactCheckEntry['verdict'];
						summary?: string;
						issues?: string[];
					};
					if (parsed.verdict) verdict = parsed.verdict;
					if (parsed.summary) summary = parsed.summary;
					if (Array.isArray(parsed.issues)) issues = parsed.issues;
				} else if (!result.raw) {
					verdict = 'failed';
					summary = 'Workers AI 呼び出し失敗';
				} else {
					summary = result.raw.slice(0, 400);
				}

				const key = factCheckKvKey(doc.id);
				const prevRaw = await this.env.STORE.get(key);
				let data: FactCheckFile = { id: doc.id, entries: [] };
				if (prevRaw) {
					try {
						data = JSON.parse(prevRaw) as FactCheckFile;
						if (!Array.isArray(data.entries)) data.entries = [];
					} catch {
						/* reset */
					}
				}
				data.id = doc.id;
				data.entries.push({
					date: new Date().toISOString().slice(0, 10),
					model: result.model,
					verdict,
					summary,
					issues,
				});
				await this.env.STORE.put(key, JSON.stringify(data));
				return { id: doc.id, verdict, traceId: result.traceId };
			});
		}
	}
}
