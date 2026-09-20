/**
 * Weekly LLM fact-check against official sources via Cloudflare Workers AI.
 * Appends to src/data/fact-checks/<id>.json. Does NOT rewrite wiki bodies.
 * Skips when CF_ACCOUNT_ID / CF_API_TOKEN are unset.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FactCheckEntry, FactCheckFile } from '../src/utils/fact-checks.ts';
import { factCheckPath } from '../src/utils/fact-checks.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'src/content/docs');

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) {
			if (ent.name === '_template') continue;
			out.push(...walk(p));
		} else if (/\.mdx?$/.test(ent.name) && ent.name !== 'index.md' && ent.name !== 'index.mdx') {
			out.push(p);
		}
	}
	return out;
}

function docsId(file: string): string {
	return path
		.relative(DOCS, file)
		.replace(/\\/g, '/')
		.replace(/\.mdx?$/, '')
		.replace(/\/index$/, '');
}

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

async function callWorkersAi(prompt: string): Promise<string | null> {
	const accountId = process.env.CF_ACCOUNT_ID;
	const token = process.env.CF_API_TOKEN;
	if (!accountId || !token) return null;
	const model = process.env.CF_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messages: [
				{
					role: 'system',
					content:
						'You are a fact-checker for a JAXA-unofficial wiki. Reply ONLY with JSON: {"verdict":"pass"|"needs-update"|"failed","summary":"...","issues":["..."]}',
				},
				{ role: 'user', content: prompt },
			],
		}),
	});
	if (!res.ok) {
		console.warn(`[fact-check] Workers AI ${res.status}`);
		return null;
	}
	const data = (await res.json()) as { result?: { response?: string } };
	return data.result?.response ?? null;
}

function appendEntry(id: string, entry: FactCheckEntry) {
	const file = factCheckPath(id);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	let data: FactCheckFile = { id, entries: [] };
	if (fs.existsSync(file)) {
		data = JSON.parse(fs.readFileSync(file, 'utf8')) as FactCheckFile;
		if (!Array.isArray(data.entries)) data.entries = [];
	}
	data.id = id;
	data.entries.push(entry);
	fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
	const accountId = process.env.CF_ACCOUNT_ID;
	const token = process.env.CF_API_TOKEN;
	if (!accountId || !token) {
		console.log('[fact-check] CF_ACCOUNT_ID / CF_API_TOKEN unset — skipping');
		return;
	}

	const model = process.env.CF_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
	const files = walk(DOCS).filter((f) => !f.endsWith(`${path.sep}about.md`));

	for (const file of files) {
		const id = docsId(file);
		if (id === 'about' || id === 'index') continue;
		const raw = fs.readFileSync(file, 'utf8');
		const { title, sources, body } = parseFm(raw);
		if (!sources.length) continue;

		const prompt = `Article title: ${title}\nSources:\n${sources.join('\n')}\n\nBody:\n${body}\n\nCheck claims against the listed official sources. Do not invent facts.`;
		const response = await callWorkersAi(prompt);
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

		appendEntry(id, {
			date: new Date().toISOString().slice(0, 10),
			model,
			verdict,
			summary,
			issues,
		});
		console.log(`[fact-check] ${id}: ${verdict}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
