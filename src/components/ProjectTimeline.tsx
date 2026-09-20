import { useEffect, useState } from 'react';

type EventRow = {
	id: number;
	kind: string;
	occurred_at: string;
	url: string;
	title: string;
};

const kindLabel: Record<string, string> = {
	news: 'ニュース',
	official: '公式',
	paper: '論文要旨',
	wiki: 'Wiki',
};

export function ProjectTimeline({ slug }: { slug: string }) {
	const [events, setEvents] = useState<EventRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch(`/projects/${encodeURIComponent(slug)}/timeline.json`)
			.then(async (res) => {
				if (!res.ok) throw new Error(String(res.status));
				return res.json() as Promise<{ events: EventRow[]; error?: string }>;
			})
			.then((data) => {
				if (cancelled) return;
				if (data.error) setError(data.error);
				setEvents(data.events ?? []);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			cancelled = true;
		};
	}, [slug]);

	if (error) {
		return (
			<p className="text-sm text-muted-foreground">
				時系列を読み込めません（{error}）。D1 バインドと取り込みジョブを確認してください。
			</p>
		);
	}
	if (!events) {
		return <p className="text-sm text-muted-foreground">読み込み中…</p>;
	}
	if (!events.length) {
		return (
			<p className="text-sm text-muted-foreground">
				まだ出来事がありません。IngestCorpus / FetchNews の実行後に増えます。
			</p>
		);
	}

	return (
		<ol className="not-content space-y-4 border-l border-border pl-4">
			{events.map((e) => (
				<li key={e.id} className="relative">
					<span className="absolute -left-[1.15rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
					<p className="text-xs text-muted-foreground">
						<time dateTime={e.occurred_at}>{e.occurred_at.slice(0, 10)}</time>
						{' · '}
						{kindLabel[e.kind] ?? e.kind}
					</p>
					<p className="font-medium">
						<a href={e.url} rel="noopener noreferrer">
							{e.title}
						</a>
					</p>
				</li>
			))}
		</ol>
	);
}
