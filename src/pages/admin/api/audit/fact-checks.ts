import type { APIRoute } from 'astro';
import { assertAdminAccess, getStore } from '../../../../lib/admin-access';
import type { FactCheckFile } from '../../../../utils/fact-check-types';

export const prerender = false;

const KNOWN_PREFIX = 'fact-check:';

export const GET: APIRoute = async (context) => {
	const denied = await assertAdminAccess(context);
	if (denied) return denied;
	const store = await getStore();
	if (!store) return Response.json({ items: [] });

	const items: {
		docsId: string;
		verdict: string;
		summary: string;
		date: string;
	}[] = [];

	try {
		let cursor: string | undefined;
		do {
			const listed = await store.list({ prefix: KNOWN_PREFIX, cursor, limit: 100 });
			for (const key of listed.keys) {
				const raw = await store.get(key.name);
				if (!raw) continue;
				try {
					const file = JSON.parse(raw) as FactCheckFile;
					const latest = file.entries?.[file.entries.length - 1];
					if (!latest) continue;
					items.push({
						docsId: file.id || key.name.slice(KNOWN_PREFIX.length),
						verdict: latest.verdict,
						summary: latest.summary,
						date: latest.date,
					});
				} catch {
					/* skip */
				}
			}
			cursor = listed.list_complete ? undefined : listed.cursor;
		} while (cursor);
	} catch {
		return Response.json({ items: [] });
	}

	items.sort((a, b) => (a.date < b.date ? 1 : -1));
	return Response.json({ items: items.slice(0, 50) });
};
