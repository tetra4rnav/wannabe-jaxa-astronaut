import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { formatFactCheckMarkdown } from '../utils/fact-checks';

export const prerender = true;

const DOCS = path.join(process.cwd(), 'src/content/docs');

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

function toSlug(file: string): string {
	const rel = path.relative(DOCS, file).replace(/\\/g, '/');
	const noExt = rel.replace(/\.mdx?$/, '');
	if (noExt === 'index') return 'index';
	return noExt.replace(/\/index$/, '');
}

export function getStaticPaths() {
	return walk(DOCS).map((file) => ({
		params: { slug: toSlug(file) },
		props: { file },
	}));
}

export const GET: APIRoute = ({ props }) => {
	const file = (props as { file: string }).file;
	const raw = fs.readFileSync(file, 'utf8');
	const id = toSlug(file);
	const extra =
		id === 'index' || id === 'about'
			? ''
			: `\n\n${formatFactCheckMarkdown(id)}`;
	const body = `${raw.trimEnd()}\n${extra}\n`;
	return new Response(body, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
