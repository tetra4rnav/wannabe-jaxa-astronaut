import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOfficialUrl } from '../src/config/official-domains.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'src/content/docs');

interface Issue {
	file: string;
	message: string;
}

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) {
			if (ent.name === '_template') continue;
			out.push(...walk(p));
		} else if (/\.mdx?$/.test(ent.name)) {
			out.push(p);
		}
	}
	return out;
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
	if (!raw.startsWith('---')) return { data: {}, body: raw };
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return { data: {}, body: raw };
	const fm = raw.slice(3, end).trim();
	const body = raw.slice(end + 4);
	const data: Record<string, unknown> = {};
	let listKey: string | null = null;
	for (const line of fm.split('\n')) {
		if (/^\s+-\s+/.test(line) && listKey) {
			const arr = (data[listKey] as string[]) ?? [];
			arr.push(line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim());
			data[listKey] = arr;
			continue;
		}
		listKey = null;
		const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
		if (!m) continue;
		const key = m[1]!;
		let val = m[2]!.trim();
		if (val === '') {
			listKey = key;
			data[key] = [];
			continue;
		}
		val = val.replace(/^["']|["']$/g, '');
		data[key] = val;
	}
	return { data, body };
}

function extractUrls(text: string): string[] {
	const urls = new Set<string>();
	const md = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
	const bare = /https?:\/\/[^\s)\]>"']+/g;
	let m: RegExpExecArray | null;
	while ((m = md.exec(text))) urls.add(m[2]!);
	while ((m = bare.exec(text))) urls.add(m[0]!.replace(/[.,;]+$/, ''));
	return [...urls];
}

function main() {
	const files = walk(DOCS);
	const issues: Issue[] = [];

	for (const file of files) {
		const rel = path.relative(DOCS, file).replace(/\\/g, '/');
		const raw = fs.readFileSync(file, 'utf8');
		const { data, body } = parseFrontmatter(raw);
		const base = path.basename(rel);
		const isIndex = base === 'index.md' || base === 'index.mdx';
		const isAbout = rel === 'about.md';
		const isHome = rel === 'index.md' || rel === 'index.mdx';

		if (isHome || isAbout || isIndex) {
			// Folder indexes / about / home: sources optional
			const urls = extractUrls(body);
			for (const url of urls) {
				if (!isOfficialUrl(url) && !url.includes('github.com/jh1cid/wannabe-jaxa-astronaut')) {
					// Internal links ok; external must be official on wiki pages that aren't news
					if (url.startsWith('http') && !url.includes('localhost')) {
						// Allow github repo links and relative already filtered
						if (!url.includes('github.com')) {
							issues.push({ file: rel, message: `非公式ドメインへのリンク: ${url}` });
						}
					}
				}
			}
			continue;
		}

		const sources = data.sources;
		if (!Array.isArray(sources) || sources.length === 0) {
			issues.push({ file: rel, message: 'sources が必須です' });
		} else {
			for (const s of sources) {
				if (typeof s !== 'string' || !isOfficialUrl(s)) {
					issues.push({ file: rel, message: `sources が許可ドメイン外: ${s}` });
				}
			}
		}
		if (!data.reviewed) {
			issues.push({ file: rel, message: 'reviewed が必須です' });
		}

		for (const url of extractUrls(body)) {
			if (!isOfficialUrl(url) && !url.includes('github.com/jh1cid/wannabe-jaxa-astronaut')) {
				issues.push({ file: rel, message: `本文の非公式リンク: ${url}` });
			}
		}
	}

	if (issues.length) {
		console.error('wiki:audit FAILED');
		for (const i of issues) console.error(`- ${i.file}: ${i.message}`);
		process.exit(1);
	}
	console.log(`wiki:audit OK (${files.length} files)`);
}

main();
