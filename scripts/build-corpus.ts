import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { NewsFile, NewsItem } from '../src/utils/news-types.ts';
import { getLatestFactCheck } from '../src/utils/fact-checks.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'src/content/docs');
const NEWS_PATH = path.join(ROOT, 'src/data/news.json');
const OUT = path.join(ROOT, 'public/corpus');
const SCHEMA_VERSION = 1;
const SITE = 'https://wannabe-jaxa-astronaut.pages.dev';

interface Chunk {
	id: string;
	type: 'wiki' | 'news';
	title: string;
	text: string;
	url: string;
	sourceUrls: string[];
	lang: string;
	region: string | null;
	folder: string | null;
	publishedAt: string | null;
	retrievedAt: string;
	factCheck: { verdict: string; date: string } | null;
	titleOriginal?: string;
	titleJa?: string;
}

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) {
			if (ent.name === '_template') continue;
			out.push(...walk(p));
		} else if (/\.mdx?$/.test(ent.name)) out.push(p);
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
		data[key] = val.replace(/^["']|["']$/g, '');
	}
	return { data, body };
}

function stripMdxImports(body: string): string {
	return body
		.replace(/^import\s.+;?\s*$/gm, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function chunkWikiBody(title: string, body: string): { heading: string; text: string }[] {
	const clean = stripMdxImports(body);
	const parts = clean.split(/\n(?=##\s+)/);
	const chunks: { heading: string; text: string }[] = [];
	for (const part of parts) {
		const lines = part.trim();
		if (!lines) continue;
		const hm = lines.match(/^##\s+(.+)\n?/);
		const heading = hm ? hm[1]!.trim() : title;
		const text = lines.replace(/^##\s+.+\n?/, '').trim() || lines;
		const max = 1200;
		if (text.length <= max) {
			chunks.push({ heading, text: `${title} / ${heading}\n\n${text}` });
			continue;
		}
		for (let i = 0, c = 0; i < text.length; i += max, c++) {
			chunks.push({
				heading: `${heading} (${c})`,
				text: `${title} / ${heading}\n\n${text.slice(i, i + max)}`,
			});
		}
	}
	if (!chunks.length) chunks.push({ heading: title, text: title });
	return chunks;
}

function docsIdFromFile(file: string): string {
	const rel = path.relative(DOCS, file).replace(/\\/g, '/');
	return rel.replace(/\.mdx?$/, '').replace(/\/index$/, '') || 'index';
}

function siteUrlForDocs(id: string): string {
	if (id === 'index') return `${SITE}/`;
	return `${SITE}/${id}/`;
}

function buildWikiChunks(): Chunk[] {
	const retrievedAt = new Date().toISOString();
	const chunks: Chunk[] = [];
	for (const file of walk(DOCS)) {
		const raw = fs.readFileSync(file, 'utf8');
		const { data, body } = parseFrontmatter(raw);
		if (data.draft === 'true' || data.draft === true) continue;
		const id = docsIdFromFile(file);
		const title = String(data.title ?? id);
		const sources = Array.isArray(data.sources) ? (data.sources as string[]) : [];
		const folder = id.includes('/') ? id.split('/')[0]! : id === 'about' ? null : null;
		const latest = getLatestFactCheck(id);
		const sections = chunkWikiBody(title, body);
		sections.forEach((sec, i) => {
			chunks.push({
				id: `wiki:${id}#c${i}`,
				type: 'wiki',
				title: `${title} — ${sec.heading}`,
				text: sec.text,
				url: siteUrlForDocs(id),
				sourceUrls: sources,
				lang: 'ja',
				region: null,
				folder,
				publishedAt: typeof data.reviewed === 'string' ? data.reviewed : null,
				retrievedAt,
				factCheck: latest ? { verdict: latest.verdict, date: latest.date } : null,
			});
		});
	}
	return chunks;
}

function buildNewsChunks(news: NewsFile): Chunk[] {
	return (news.items as NewsItem[]).map((item) => ({
		id: `news:${createHash('sha256').update(item.url).digest('hex').slice(0, 16)}`,
		type: 'news' as const,
		title: item.titleJa || item.titleOriginal,
		text: [
			`原語 (${item.lang}): ${item.titleOriginal}`,
			item.summaryOriginal,
			`日本語: ${item.titleJa}`,
			item.summaryJa,
			item.url,
		].join('\n'),
		url: `${SITE}/news/`,
		sourceUrls: [item.url],
		lang: item.lang,
		region: item.region,
		folder: null,
		publishedAt: item.publishedAt,
		retrievedAt: item.retrievedAt,
		factCheck: null,
		titleOriginal: item.titleOriginal,
		titleJa: item.titleJa,
	}));
}

function main() {
	const news: NewsFile = fs.existsSync(NEWS_PATH)
		? (JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8')) as NewsFile)
		: { updatedAt: new Date(0).toISOString(), xConfigured: false, items: [] };

	const wiki = buildWikiChunks();
	const newsChunks = buildNewsChunks(news);
	const all = [...wiki, ...newsChunks];

	fs.mkdirSync(OUT, { recursive: true });
	const toJsonl = (rows: Chunk[]) => rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');

	fs.writeFileSync(path.join(OUT, 'chunks.jsonl'), toJsonl(all), 'utf8');
	fs.writeFileSync(path.join(OUT, 'wiki.jsonl'), toJsonl(wiki), 'utf8');
	fs.writeFileSync(path.join(OUT, 'news.jsonl'), toJsonl(newsChunks), 'utf8');
	fs.writeFileSync(
		path.join(OUT, 'manifest.json'),
		`${JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				schemaVersion: SCHEMA_VERSION,
				chunkCount: all.length,
				wikiCount: wiki.length,
				newsCount: newsChunks.length,
				files: ['chunks.jsonl', 'wiki.jsonl', 'news.jsonl'],
			},
			null,
			2,
		)}\n`,
		'utf8',
	);
	console.log(`[corpus] ${all.length} chunks (wiki=${wiki.length}, news=${newsChunks.length}) -> ${OUT}`);
}

main();
