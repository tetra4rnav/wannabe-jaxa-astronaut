import { useEffect, useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Summary = {
	documents: { counts: Record<string, number>; recent: DocRow[] };
	news: { total: number; gated: number; ungated: number; recent: NewsRow[] };
	proposals: { total: number; recent: PropRow[] };
};

type DocRow = {
	id: number;
	url: string;
	title: string | null;
	project_slug: string;
	status: string;
	error: string | null;
};

type NewsRow = {
	id: string;
	titleJa: string;
	ingestAsSource?: boolean;
	publishedAt: string;
};

type PropRow = {
	id: string;
	proposedTitle: string;
	action: string;
	createdAt: string;
};

type FactCheckRow = {
	docsId: string;
	verdict: string;
	summary: string;
	date: string;
};

export function RagAuditSection() {
	const [summary, setSummary] = useState<Summary | null>(null);
	const [factChecks, setFactChecks] = useState<FactCheckRow[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void (async () => {
			try {
				const [sRes, fRes] = await Promise.all([
					fetch('/admin/api/audit/summary'),
					fetch('/admin/api/audit/fact-checks'),
				]);
				if (!sRes.ok) throw new Error(await sRes.text());
				setSummary((await sRes.json()) as Summary);
				if (fRes.ok) {
					const data = (await fRes.json()) as { items: FactCheckRow[] };
					setFactChecks(data.items ?? []);
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : 'load failed');
			}
		})();
	}, []);

	if (error) return <p className="text-sm text-destructive">{error}</p>;
	if (!summary) return <p className="text-sm text-muted-foreground">読み込み中…</p>;

	const counts = summary.documents.counts;

	return (
		<div className="space-y-10">
			<div>
				<h2 className="mb-2 text-lg font-semibold">RAG監査</h2>
				<p className="text-sm text-muted-foreground">
					閲覧のみ。再取込やジョブ起動は VER / Worker の手順に従ってください。
				</p>
			</div>

			<section className="space-y-3">
				<h3 className="font-medium">コーパス取込（documents）</h3>
				<div className="flex flex-wrap gap-2 text-sm">
					{Object.entries(counts).map(([k, v]) => (
						<Badge key={k} variant="outline">
							{k}: {v}
						</Badge>
					))}
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>status</TableHead>
							<TableHead>project</TableHead>
							<TableHead>url</TableHead>
							<TableHead>error</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{summary.documents.recent.map((d) => (
							<TableRow key={d.id}>
								<TableCell>{d.status}</TableCell>
								<TableCell className="font-mono text-xs">{d.project_slug}</TableCell>
								<TableCell className="max-w-xs truncate text-xs">
									<a href={d.url} target="_blank" rel="noreferrer">
										{d.title || d.url}
									</a>
								</TableCell>
								<TableCell className="max-w-xs truncate text-xs text-muted-foreground">
									{d.error ?? '—'}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</section>

			<section className="space-y-3">
				<h3 className="font-medium">フィードゲート（news_items）</h3>
				<p className="text-sm text-muted-foreground">
					総数 {summary.news.total} · ゲート通過 {summary.news.gated} · その他{' '}
					{summary.news.ungated}
				</p>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>タイトル</TableHead>
							<TableHead>gate</TableHead>
							<TableHead>published</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{summary.news.recent.map((n) => (
							<TableRow key={n.id}>
								<TableCell className="text-sm">{n.titleJa || n.id}</TableCell>
								<TableCell>{n.ingestAsSource ? 'yes' : 'no'}</TableCell>
								<TableCell className="text-xs text-muted-foreground">
									{n.publishedAt.slice(0, 10)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</section>

			<section className="space-y-3">
				<h3 className="font-medium">Wiki 提案（proposals）</h3>
				<p className="text-sm text-muted-foreground">件数 {summary.proposals.total}</p>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>title</TableHead>
							<TableHead>action</TableHead>
							<TableHead>created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{summary.proposals.recent.map((p) => (
							<TableRow key={p.id}>
								<TableCell className="text-sm">{p.proposedTitle}</TableCell>
								<TableCell>{p.action}</TableCell>
								<TableCell className="text-xs text-muted-foreground">
									{p.createdAt.slice(0, 10)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</section>

			<section className="space-y-3">
				<h3 className="font-medium">ファクトチェック（KV）</h3>
				{factChecks.length === 0 ? (
					<p className="text-sm text-muted-foreground">まだありません。</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>docsId</TableHead>
								<TableHead>verdict</TableHead>
								<TableHead>summary</TableHead>
								<TableHead>date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{factChecks.map((f) => (
								<TableRow key={f.docsId}>
									<TableCell className="font-mono text-xs">{f.docsId}</TableCell>
									<TableCell>{f.verdict}</TableCell>
									<TableCell className="max-w-md truncate text-xs">{f.summary}</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{f.date.slice(0, 10)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</section>
		</div>
	);
}
