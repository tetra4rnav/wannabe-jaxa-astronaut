import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PROJECT_BY_SLUG } from '@/config/projects';
import type { NewsItem } from '@/utils/news-types';

type Props = {
	item: NewsItem;
};

export function NewsDetail({ item }: Props) {
	return (
		<Card className="overflow-hidden" data-region={item.region} data-kind={item.kind}>
			<CardHeader className="gap-2">
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">{item.sourceLabel}</Badge>
					<Badge variant="outline">{item.region}</Badge>
					<Badge variant="outline">{item.kind}</Badge>
					{(item.projectSlugs ?? [])
						.filter((s) => s !== 'unassigned')
						.map((slug) => {
							const project = PROJECT_BY_SLUG[slug];
							const label = project?.nameJa ?? slug;
							return (
								<a key={slug} href={`/projects/${slug}/`}>
									<Badge variant="outline">{label}</Badge>
								</a>
							);
						})}
					{item.ingestAsSource ? <Badge variant="outline">根拠候補</Badge> : null}
					{item.machineTranslated ? (
						<Badge
							variant="outline"
							className="border-amber-600/50 text-amber-800 dark:border-amber-500/50 dark:text-amber-200"
						>
							機械翻訳
						</Badge>
					) : null}
				</div>
				<p className="text-xs text-muted-foreground">
					<time dateTime={item.publishedAt}>{item.publishedAt.slice(0, 10)}</time>
					{item.accountHandle ? ` · @${item.accountHandle}` : ''}
					{item.llmReason ? ` · ${item.llmReason}` : ''}
				</p>
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 md:grid-cols-2">
					<div lang={item.lang}>
						<p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
							原語 ({item.lang})
						</p>
						<CardTitle className="mb-2 text-base">{item.titleOriginal}</CardTitle>
						<p className="text-sm text-muted-foreground whitespace-pre-wrap">
							{item.summaryOriginal}
						</p>
					</div>
					<div lang="ja">
						<p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">日本語</p>
						<CardTitle className="mb-2 text-base">{item.titleJa}</CardTitle>
						<p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.summaryJa}</p>
					</div>
				</div>
				<p className="mt-6 flex flex-wrap gap-4">
					<a
						className="text-sm text-primary underline-offset-4 hover:underline"
						href={item.url}
						rel="noopener noreferrer"
					>
						原文・公式リンク
					</a>
					<a
						className="text-sm text-primary underline-offset-4 hover:underline"
						href={`/proposals/?news=${encodeURIComponent(item.id)}`}
					>
						Wiki 提案
					</a>
				</p>
			</CardContent>
		</Card>
	);
}
