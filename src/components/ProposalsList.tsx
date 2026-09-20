import { useEffect, useMemo, useState } from 'react';
import { PROJECT_BY_SLUG } from '@/config/projects';
import type { ProposalsFile, WikiProposal } from '@/utils/proposal-types';

const actionLabel: Record<string, string> = {
	update: '更新',
	create: '新規',
	'add-project': 'プロジェクト追加',
	skip: 'スキップ',
};

export function ProposalsList({ newsId }: { newsId?: string | null }) {
	const [file, setFile] = useState<ProposalsFile | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch('/proposals.json')
			.then(async (res) => {
				if (!res.ok) throw new Error(String(res.status));
				return res.json() as Promise<ProposalsFile>;
			})
			.then((data) => {
				if (!cancelled) setFile(data);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const items = useMemo(() => {
		const list = file?.items ?? [];
		if (!newsId) return list;
		return list.filter((p) => p.newsId === newsId || p.id === newsId);
	}, [file, newsId]);

	if (error) {
		return (
			<p className="text-sm text-muted-foreground">
				提案を読み込めません（{error}）。KV バインドと ProposeWiki ジョブを確認してください。
			</p>
		);
	}
	if (!file) {
		return <p className="text-sm text-muted-foreground">読み込み中…</p>;
	}
	if (!items.length) {
		return (
			<p className="text-sm text-muted-foreground">
				{newsId
					? 'このニュース向けの提案はまだありません。'
					: 'まだ提案がありません。FetchNews / ProposeWiki の実行後に増えます。'}
			</p>
		);
	}

	return (
		<ul className="not-content space-y-6">
			{items.map((p) => (
				<li key={p.id} id={p.id} className="border-b border-border pb-6">
					<ProposalCard proposal={p} />
				</li>
			))}
		</ul>
	);
}

function ProposalCard({ proposal: p }: { proposal: WikiProposal }) {
	return (
		<article>
			<p className="text-xs text-muted-foreground">
				<time dateTime={p.createdAt}>{p.createdAt.slice(0, 10)}</time>
				{' · '}
				{actionLabel[p.action] ?? p.action}
				{p.model ? ` · ${p.model}` : ''}
			</p>
			<h2 className="mt-1 text-lg font-medium">
				{p.proposedTitle || p.newsTitle || p.id}
			</h2>
			<p className="mt-1 text-sm">
				ニュース:{' '}
				<a href={p.newsUrl} rel="noopener noreferrer">
					{p.newsTitle}
				</a>
				{' · '}
				<a href={`/news/`}>ニュース一覧</a>
			</p>
			{(p.projectSlugs ?? []).filter((s) => s !== 'unassigned').length > 0 ? (
				<p className="mt-1 text-sm text-muted-foreground">
					プロジェクト:{' '}
					{(p.projectSlugs ?? [])
						.filter((s) => s !== 'unassigned')
						.map((slug) => {
							const name = PROJECT_BY_SLUG[slug]?.nameJa ?? slug;
							return (
								<a key={slug} className="mr-2" href={`/projects/${slug}/`}>
									{name}
								</a>
							);
						})}
				</p>
			) : null}
			{p.targetDocsId ? (
				<p className="mt-2 text-sm">
					対象 Wiki: <code>{p.targetDocsId}</code>
					{' · '}
					<a href={`/${p.targetDocsId}/`}>ページを開く</a>
				</p>
			) : null}
			{p.headings?.length ? (
				<ul className="mt-2 list-disc pl-5 text-sm">
					{p.headings.map((h) => (
						<li key={h}>{h}</li>
					))}
				</ul>
			) : null}
			{p.relation ? <p className="mt-2 text-sm">{p.relation}</p> : null}
			{p.timelineNote ? (
				<p className="mt-1 text-sm text-muted-foreground">時系列: {p.timelineNote}</p>
			) : null}
			{p.rationale ? (
				<p className="mt-1 text-sm text-muted-foreground">{p.rationale}</p>
			) : null}
			{p.evidenceUrls?.length ? (
				<div className="mt-2">
					<p className="text-xs uppercase tracking-wide text-muted-foreground">根拠 URL</p>
					<ul className="mt-1 list-disc pl-5 text-sm">
						{p.evidenceUrls.map((u) => (
							<li key={u}>
								<a href={u} rel="noopener noreferrer">
									{u}
								</a>
							</li>
						))}
					</ul>
				</div>
			) : null}
			<p className="mt-2 text-xs text-muted-foreground">
				Wiki 本文は自動では書きません。人が公式 URL を出典に Markdown を書いてください。
			</p>
		</article>
	);
}
