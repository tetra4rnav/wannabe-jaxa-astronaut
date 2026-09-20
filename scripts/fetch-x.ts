import { NEWS_KEYWORDS } from '../src/config/feeds.ts';
import { X_ACCOUNTS } from '../src/config/x-accounts.ts';
import type { NewsItem } from '../src/utils/news-types.ts';
import { hashId, matchesKeywords, truncate } from './lib.ts';
import { translateToJa } from './translate.ts';

export interface FetchXResult {
	configured: boolean;
	items: NewsItem[];
}

/**
 * X API v2 recent tweets for allowlisted official accounts.
 * Skips entirely when X_BEARER_TOKEN is unset.
 */
export async function fetchX(): Promise<FetchXResult> {
	const token = process.env.X_BEARER_TOKEN;
	if (!token) {
		console.log('[x] X_BEARER_TOKEN unset — skipping X fetch');
		return { configured: false, items: [] };
	}

	const items: NewsItem[] = [];
	const retrievedAt = new Date().toISOString();

	for (const account of X_ACCOUNTS) {
		try {
			const userRes = await fetch(
				`https://api.x.com/2/users/by/username/${encodeURIComponent(account.handle)}`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			if (!userRes.ok) {
				console.warn(`[x] user lookup @${account.handle} -> ${userRes.status}`);
				continue;
			}
			const userData = (await userRes.json()) as { data?: { id: string } };
			const userId = userData.data?.id;
			if (!userId) continue;

			const tweetUrl = new URL(`https://api.x.com/2/users/${userId}/tweets`);
			tweetUrl.searchParams.set('max_results', '10');
			tweetUrl.searchParams.set('tweet.fields', 'created_at,text');
			tweetUrl.searchParams.set('exclude', 'retweets,replies');

			const tweetRes = await fetch(tweetUrl, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!tweetRes.ok) {
				console.warn(`[x] tweets @${account.handle} -> ${tweetRes.status}`);
				continue;
			}
			const tweetData = (await tweetRes.json()) as {
				data?: { id: string; text: string; created_at?: string }[];
			};
			for (const tw of tweetData.data ?? []) {
				const text = truncate(tw.text, 240);
				if (!matchesKeywords(text, NEWS_KEYWORDS)) continue;
				const url = `https://x.com/${account.handle}/status/${tw.id}`;
				const titleOriginal = truncate(text, 120);
				const title = await translateToJa(titleOriginal, account.lang);
				const summary = await translateToJa(text, account.lang);
				items.push({
					id: hashId(url),
					url,
					kind: 'x',
					lang: account.lang,
					region: account.region,
					sourceLabel: account.label,
					sourceId: account.id,
					accountHandle: account.handle,
					publishedAt: tw.created_at ? new Date(tw.created_at).toISOString() : retrievedAt,
					retrievedAt,
					titleOriginal,
					summaryOriginal: text,
					titleJa: title.text,
					summaryJa: summary.text,
					machineTranslated: title.machineTranslated || summary.machineTranslated,
				});
			}
			console.log(`[x] @${account.handle}: ok`);
		} catch (err) {
			console.warn(`[x] @${account.handle} failed`, err);
		}
	}

	return { configured: true, items };
}
