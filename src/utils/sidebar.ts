import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/docs');
const SKIP = new Set(['_template']);

function readTitle(dir: string): string {
	const candidates = ['index.md', 'index.mdx'];
	for (const name of candidates) {
		const file = path.join(DOCS_ROOT, dir, name);
		if (!fs.existsSync(file)) continue;
		const text = fs.readFileSync(file, 'utf8');
		const match = text.match(/^title:\s*["']?(.+?)["']?\s*$/m);
		if (match) return match[1].trim();
	}
	return dir;
}

/** Scan docs folders so new themes appear in the sidebar without editing astro.config. */
export function wikiSidebar() {
	if (!fs.existsSync(DOCS_ROOT)) return [];
	return fs
		.readdirSync(DOCS_ROOT, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !SKIP.has(d.name) && !d.name.startsWith('.'))
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((d) => ({
			label: readTitle(d.name),
			items: [{ autogenerate: { directory: d.name } }],
		}));
}
