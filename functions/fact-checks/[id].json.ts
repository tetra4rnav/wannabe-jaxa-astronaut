import { factCheckKvKey, type FactCheckFile } from '../_lib/store';

interface Env {
	STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const id = context.params.id;
	if (!id || typeof id !== 'string') {
		return new Response(JSON.stringify({ error: 'missing id' }), { status: 400 });
	}

	const key = factCheckKvKey(decodeURIComponent(id));
	const raw = await context.env.STORE?.get(key);
	if (raw) {
		return new Response(raw, {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=120',
			},
		});
	}

	const empty: FactCheckFile = { id: decodeURIComponent(id), entries: [] };
	return new Response(JSON.stringify(empty), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
