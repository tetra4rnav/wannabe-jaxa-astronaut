import { useEffect, useState } from 'react';
import type { NewsFile, NewsItem } from '@/utils/news-types';
import { NewsCards } from '@/components/NewsCards';

type Props = {
	initialNews?: NewsFile | null;
	showAll?: boolean;
	limit?: number;
	showMeta?: boolean;
};

const empty: NewsFile = {
	updatedAt: '',
	xConfigured: false,
	items: [],
};

export function NewsFeed({
	initialNews = null,
	showAll = false,
	limit,
	showMeta = true,
}: Props) {
	const [news, setNews] = useState<NewsFile | null>(initialNews);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (initialNews) return;
		let cancelled = false;
		fetch('/news.json')
			.then(async (res) => {
				if (!res.ok) throw new Error(`news.json ${res.status}`);
				return res.json() as Promise<NewsFile>;
			})
			.then((data) => {
				if (!cancelled) setNews(data);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			cancelled = true;
		};
	}, [initialNews]);

	if (error) {
		return <p className="text-sm text-muted-foreground">ニュースを読み込めませんでした（{error}）。</p>;
	}
	if (!news) {
		return <p className="text-sm text-muted-foreground">ニュースを読み込み中…</p>;
	}

	let items = (news.items ?? empty.items) as NewsItem[];
	if (typeof limit === 'number') items = items.slice(0, limit);

	return (
		<div>
			{showMeta ? (
				<p className="mb-4 text-sm text-muted-foreground">
					X API: {news.xConfigured ? '設定済み' : <strong>未設定</strong>}
					（未設定時は RSS / HTML のみ）。最終更新:{' '}
					{news.updatedAt ? (
						<time dateTime={news.updatedAt}>{news.updatedAt}</time>
					) : (
						'—'
					)}{' '}
					· <a href="/news.md">news.md</a> · <a href="/news.json">news.json</a>
				</p>
			) : null}
			<NewsCards items={items} showAll={showAll || Boolean(limit)} />
		</div>
	);
}
