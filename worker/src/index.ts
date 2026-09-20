import type { Env } from './env.ts';
import { FactCheckWorkflow } from './workflows/fact-check.ts';
import { FetchNewsWorkflow } from './workflows/fetch-news.ts';

export { FetchNewsWorkflow, FactCheckWorkflow };

function unauthorized(): Response {
	return new Response('Unauthorized', { status: 401 });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === '/__scheduled') {
			return new Response('Not Found', { status: 404 });
		}

		if (request.method === 'POST' && url.pathname === '/run') {
			const secret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
			if (!env.RUN_SECRET || secret !== env.RUN_SECRET) return unauthorized();
			const body = (await request.json().catch(() => ({}))) as { job?: string };
			const job = body.job ?? url.searchParams.get('job') ?? 'fetch-news';
			if (job === 'fetch-news') {
				const instance = await env.FETCH_NEWS.create();
				return Response.json({ ok: true, job, id: instance.id });
			}
			if (job === 'fact-check') {
				const instance = await env.FACT_CHECK.create();
				return Response.json({ ok: true, job, id: instance.id });
			}
			return Response.json({ ok: false, error: 'unknown job' }, { status: 400 });
		}

		if (url.pathname === '/' || url.pathname === '/health') {
			return Response.json({
				ok: true,
				service: 'wannabe-jaxa-jobs',
				jobs: ['fetch-news', 'fact-check'],
			});
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
