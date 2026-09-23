import type { APIRoute } from 'astro';
import type { ProjectConfig } from '../../../../../config/projects';
import { assertAdminAccess, getDb } from '../../../../../lib/admin-access';
import { loadCatalog, upsertProjectConfig } from '../../../../../../shared/timeline/catalog';

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
	const denied = assertAdminAccess(context);
	if (denied) return denied;
	const db = await getDb();
	if (!db) return new Response('DB unavailable', { status: 503 });

	const slug = context.params.slug;
	if (!slug) return new Response('missing slug', { status: 400 });

	let body: Partial<ProjectConfig>;
	try {
		body = (await context.request.json()) as Partial<ProjectConfig>;
	} catch {
		return new Response('invalid JSON', { status: 400 });
	}
	if (body.slug && body.slug !== slug) {
		return new Response('slug rename forbidden', { status: 400 });
	}

	const catalog = await loadCatalog(db);
	const current = catalog.find((p) => p.slug === slug);
	if (!current) return new Response('not found', { status: 404 });

	const next: ProjectConfig = {
		...current,
		...body,
		slug: current.slug,
		keywords: body.keywords ?? current.keywords,
		relations: body.relations ?? current.relations,
	};
	await upsertProjectConfig(db, next);
	const updated = (await loadCatalog(db)).find((p) => p.slug === slug);
	return Response.json(updated);
};
