import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NewsFile } from '../src/utils/news-types.ts';
import { emptyNewsFile, runFetchNews } from '../shared/news/run-fetch-news.ts';
import { secretsFromProcess } from '../shared/news/secrets.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEWS_PATH = path.join(ROOT, 'src/data/news.json');

function loadNews(): NewsFile {
	if (!fs.existsSync(NEWS_PATH)) return emptyNewsFile();
	return JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8')) as NewsFile;
}

async function main() {
	const merged = await runFetchNews(loadNews(), secretsFromProcess());
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
