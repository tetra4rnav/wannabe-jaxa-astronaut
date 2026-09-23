import type { APIRoute } from 'astro';
import { assertAdminAccess, getDb } from '../../../../../../lib/admin-access';
import { loadCatalog, retireProject } from '../../../../../../../shared/timeline/catalog';

export const prerender = false;

export const POST: APIRoute = async (context) => {
	const denied = assertAdminAccess(context);
	if (denied) return denied;
	const db = await getDb();
	if (!db) return new Response('DB unavailable', { status: 503 });

	const slug = context.params.slug;
	if (!slug) return new Response('missing slug', { status: 400 });

	const catalog = await loadCatalog(db);
	if (!catalog.some((p) => p.slug === slug)) {
		return new Response('not found', { status: 404 });
	}
	await retireProject(db, slug);
	const updated = (await loadCatalog(db)).find((p) => p.slug === slug);
	return Response.json(updated);
};
