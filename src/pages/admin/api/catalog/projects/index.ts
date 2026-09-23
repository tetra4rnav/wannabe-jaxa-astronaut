import type { APIRoute } from 'astro';
import type { ProjectConfig } from '../../../../../config/projects';
import { assertAdminAccess, getDb } from '../../../../../lib/admin-access';
import {
	ensureCatalogSeeded,
	loadCatalog,
	upsertProjectConfig,
} from '../../../../../../shared/timeline/catalog';

export const prerender = false;

export const GET: APIRoute = async (context) => {
	const denied = assertAdminAccess(context);
	if (denied) return denied;
	const db = await getDb();
	if (!db) return new Response('DB unavailable', { status: 503 });
	await ensureCatalogSeeded(db);
	const projects = await loadCatalog(db);
	return Response.json({ projects });
};

export const POST: APIRoute = async (context) => {
	const denied = assertAdminAccess(context);
	if (denied) return denied;
	const db = await getDb();
	if (!db) return new Response('DB unavailable', { status: 503 });
	await ensureCatalogSeeded(db);

	let body: ProjectConfig;
	try {
		body = (await context.request.json()) as ProjectConfig;
	} catch {
		return new Response('invalid JSON', { status: 400 });
	}
	if (!body.slug || !body.nameJa || !body.nameEn) {
		return new Response('slug, nameJa, nameEn required', { status: 400 });
	}
	const existing = await loadCatalog(db);
	if (existing.some((p) => p.slug === body.slug)) {
		return new Response('slug conflict', { status: 409 });
	}
	await upsertProjectConfig(db, {
		...body,
		keywords: body.keywords ?? [],
	});
	const created = (await loadCatalog(db)).find((p) => p.slug === body.slug);
	return Response.json(created, { status: 201 });
};
