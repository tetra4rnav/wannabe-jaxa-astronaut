import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NewsFile, NewsItem } from '../src/utils/news-types.ts';
import { mergeByUrl } from './lib.ts';
import { fetchFeeds } from './fetch-feeds.ts';
import { fetchX } from './fetch-x.ts';
import { translateToJa } from './translate.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEWS_PATH = path.join(ROOT, 'src/data/news.json');

/** Drop stale HTML-list noise kept by merge (nav hubs, mega titles). */
function isQualityItem(item: NewsItem): boolean {
	const title = item.titleOriginal.replace(/\s+/g, ' ').trim();
	if (title.length < 8 || title.length > 100) return false;
	if (item.kind !== 'html-list') return true;
	if (item.region === 'china') {
		try {
			const u = new URL(item.url);
			const article =
				/content\.html?$/i.test(u.pathname) ||
				/\/c\d+\//.test(u.pathname) ||
				/\/t\d{8,}/i.test(u.pathname);
			if (!article || /\/(kpjy|dmt|hdjl)\//i.test(u.pathname)) return false;
		} catch {
			return false;
		}
	}
	return true;
}

function loadNews(): NewsFile {
	if (!fs.existsSync(NEWS_PATH)) {
		return { updatedAt: new Date(0).toISOString(), xConfigured: false, items: [] };
	}
	return JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8')) as NewsFile;
}

/** Ensure JA fields exist; skip re-translation when already present for same URL. */
async function ensureJa(file: NewsFile): Promise<NewsFile> {
	const items = [];
	for (const item of file.items) {
		if (item.lang === 'ja') {
			items.push({
				...item,
				titleJa: item.titleJa || item.titleOriginal,
				summaryJa: item.summaryJa || item.summaryOriginal,
				machineTranslated: false,
			});
			continue;
		}
		if (item.titleJa && item.summaryJa) {
			items.push(item);
			continue;
		}
		const title = item.titleJa
			? { text: item.titleJa, machineTranslated: item.machineTranslated }
			: await translateToJa(item.titleOriginal, item.lang);
		const summary = item.summaryJa
			? { text: item.summaryJa, machineTranslated: item.machineTranslated }
			: await translateToJa(item.summaryOriginal, item.lang);
		items.push({
			...item,
			titleJa: title.text,
			summaryJa: summary.text,
			machineTranslated: title.machineTranslated || summary.machineTranslated,
		});
	}
	return { ...file, items };
}

async function main() {
	const existing = loadNews();
	const [feedItems, xResult] = await Promise.all([fetchFeeds(), fetchX()]);
	let merged: NewsFile = {
		updatedAt: new Date().toISOString(),
		xConfigured: xResult.configured,
		items: mergeByUrl(existing.items, [...feedItems, ...xResult.items])
			.filter(isQualityItem)
			.slice(0, 200),
	};
	merged = await ensureJa(merged);
	fs.mkdirSync(path.dirname(NEWS_PATH), { recursive: true });
	fs.writeFileSync(NEWS_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
	console.log(
		`[fetch-news] wrote ${merged.items.length} items (xConfigured=${merged.xConfigured}) -> ${NEWS_PATH}`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
