import type { NewsFile } from '../../src/utils/news-types.ts';
import { fetchFeeds } from './fetch-feeds.ts';
import { fetchX } from './fetch-x.ts';
import { isQualityItem, mergeByUrl } from './lib.ts';
import type { NewsSecrets } from './secrets.ts';
import { translateToJa } from './translate.ts';

/** Ensure JA fields exist; skip re-translation when already present for same URL. */
async function ensureJa(file: NewsFile, secrets: NewsSecrets): Promise<NewsFile> {
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
			: await translateToJa(item.titleOriginal, item.lang, secrets);
		const summary = item.summaryJa
			? { text: item.summaryJa, machineTranslated: item.machineTranslated }
			: await translateToJa(item.summaryOriginal, item.lang, secrets);
		items.push({
			...item,
			titleJa: title.text,
			summaryJa: summary.text,
			machineTranslated: title.machineTranslated || summary.machineTranslated,
		});
	}
	return { ...file, items };
}

/** Merge feeds + X into an existing NewsFile. No filesystem I/O. */
export async function runFetchNews(
	existing: NewsFile,
	secrets: NewsSecrets = {},
): Promise<NewsFile> {
	const [feedItems, xResult] = await Promise.all([fetchFeeds(secrets), fetchX(secrets)]);
	let merged: NewsFile = {
		updatedAt: new Date().toISOString(),
		xConfigured: xResult.configured,
		items: mergeByUrl(existing.items, [...feedItems, ...xResult.items])
			.filter(isQualityItem)
			.slice(0, 200),
	};
	return ensureJa(merged, secrets);
}

export function emptyNewsFile(): NewsFile {
	return { updatedAt: new Date(0).toISOString(), xConfigured: false, items: [] };
}
