import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';
import type { FactCheckEntry, FactCheckFile } from '../../../src/utils/fact-check-types.ts';
import { factCheckKvKey } from '../../../shared/news/format.ts';
import type { Env } from '../env.ts';

const REPO = 'tetra4rnav/wannabe-jaxa-astronaut';
const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

type WikiDoc = { id: string; title: string; sources: string[]; body: string };

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

async function callAi(env: Env, prompt: string, model: string): Promise<string | null> {
	try {
		// Workers AI model id is configured via env; types are model-literal unions.
		const result = (await env.AI.run(model as Parameters<Ai['run']>[0], {
			messages: [
				{
					role: 'system',
					content:
						'You are a fact-checker for a JAXA-unofficial wiki. Reply ONLY with JSON: {"verdict":"pass"|"needs-update"|"failed","summary":"...","issues":["..."]}',
				},
				{ role: 'user', content: prompt },
			],
		})) as { response?: string };
		return result.response ?? null;
	} catch (err) {
		console.warn('[fact-check] AI failed', err);
		return null;
	}
}

export class FactCheckWorkflow extends WorkflowEntrypoint<Env> {
	async run(_event: WorkflowEvent<unknown>, step: WorkflowStep) {
		const model = this.env.CF_AI_MODEL || DEFAULT_MODEL;
		const docs = await step.do('list wiki docs', async () => listWikiDocs());

		for (const doc of docs) {
			await step.do(`check ${doc.id}`, { retries: { limit: 1, delay: '20 seconds' } }, async () => {
				const prompt = `Article title: ${doc.title}\nSources:\n${doc.sources.join('\n')}\n\nBody:\n${doc.body}\n\nCheck claims against the listed official sources. Do not invent facts.`;
				const response = await callAi(this.env, prompt, model);
				let verdict: FactCheckEntry['verdict'] = 'needs-update';
				let summary = 'モデル応答を解析できませんでした';
				let issues: string[] = [];
				if (response) {
					try {
						const jsonMatch = response.match(/\{[\s\S]*\}/);
						const parsed = JSON.parse(jsonMatch?.[0] ?? response) as {
							verdict?: FactCheckEntry['verdict'];
							summary?: string;
							issues?: string[];
						};
						if (parsed.verdict) verdict = parsed.verdict;
						if (parsed.summary) summary = parsed.summary;
						if (Array.isArray(parsed.issues)) issues = parsed.issues;
					} catch {
						summary = response.slice(0, 400);
					}
				} else {
					verdict = 'failed';
					summary = 'Workers AI 呼び出し失敗';
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
					model,
					verdict,
					summary,
					issues,
				});
				await this.env.STORE.put(key, JSON.stringify(data));
				return { id: doc.id, verdict };
			});
		}
	}
}
