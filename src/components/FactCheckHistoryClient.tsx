import { useEffect, useState } from 'react';
import type { FactCheckEntry, FactCheckFile } from '@/utils/fact-check-types';

type Props = {
	docsId: string;
};

const verdictLabel: Record<string, string> = {
	pass: '合格',
	'needs-update': '要更新',
	failed: '失敗',
};

export function FactCheckHistoryClient({ docsId }: Props) {
	const [entries, setEntries] = useState<FactCheckEntry[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		const id = encodeURIComponent(docsId);
		fetch(`/fact-checks/${id}.json`)
			.then(async (res) => {
				if (!res.ok) throw new Error(String(res.status));
				return res.json() as Promise<FactCheckFile>;
			})
			.then((data) => {
				if (!cancelled) setEntries(Array.isArray(data.entries) ? data.entries : []);
			})
			.catch(() => {
				if (!cancelled) setEntries([]);
			});
		return () => {
			cancelled = true;
		};
	}, [docsId]);

	return (
		<section className="fact-check" aria-labelledby="fact-check-heading">
			<h2 id="fact-check-heading">ファクトチェック履歴</h2>
			{entries === null ? (
				<p className="mt-hint">読み込み中…</p>
			) : entries.length === 0 ? (
				<p className="mt-hint">未実施</p>
			) : (
				<ul>
					{entries.map((e, i) => (
						<li key={`${e.date}-${i}`}>
							<strong>{e.date}</strong>
							{' — '}
							{verdictLabel[e.verdict] ?? e.verdict}
							{e.model ? `（${e.model}）` : ''}
							{e.summary ? <p>{e.summary}</p> : null}
							{e.issues?.length ? (
								<ul>
									{e.issues.map((issue) => (
										<li key={issue}>{issue}</li>
									))}
								</ul>
							) : null}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
