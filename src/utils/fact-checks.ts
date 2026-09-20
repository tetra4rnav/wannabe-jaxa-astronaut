import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FactCheckEntry, FactCheckFile } from './fact-check-types.ts';

export type { FactCheckEntry, FactCheckFile, FactCheckVerdict } from './fact-check-types.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/fact-checks');

export function factCheckPath(docsId: string): string {
	const safe = docsId.replace(/\\/g, '/').replace(/^\//, '');
	return path.join(ROOT, `${safe}.json`);
}

export function getFactCheckEntries(docsId: string): FactCheckEntry[] {
	const file = factCheckPath(docsId);
	if (!fs.existsSync(file)) return [];
	try {
		const data = JSON.parse(fs.readFileSync(file, 'utf8')) as FactCheckFile;
		return Array.isArray(data.entries) ? data.entries : [];
	} catch {
		return [];
	}
}

export function getLatestFactCheck(docsId: string): FactCheckEntry | null {
	const entries = getFactCheckEntries(docsId);
	return entries.length ? entries[entries.length - 1]! : null;
}

export function formatFactCheckMarkdown(docsId: string): string {
	const entries = getFactCheckEntries(docsId);
	if (!entries.length) return '## ファクトチェック履歴\n\n未実施\n';
	const lines = ['## ファクトチェック履歴', ''];
	for (const e of entries) {
		lines.push(`- **${e.date}** — ${e.verdict}${e.model ? ` (${e.model})` : ''}: ${e.summary}`);
		for (const issue of e.issues ?? []) {
			lines.push(`  - ${issue}`);
		}
	}
	lines.push('');
	return lines.join('\n');
}
