import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewsItem } from '@/utils/news-types';

type Props = {
	items: NewsItem[];
	showAll?: boolean;
};

export function NewsCards({ items, showAll = false }: Props) {
	const list = showAll ? items : items.slice(0, 5);
	if (list.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				まだニュースがありません。
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-4">
			{list.map((item) => (
				<Card
					key={item.id}
					className="overflow-hidden"
					data-region={item.region}
					data-kind={item.kind}
				>
					<CardHeader className="gap-2">
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">{item.sourceLabel}</Badge>
							<Badge variant="outline">{item.region}</Badge>
							<Badge variant="outline">{item.kind}</Badge>
							{item.machineTranslated ? (
								<Badge variant="outline" className="border-amber-500/50 text-amber-200">
									機械翻訳
								</Badge>
							) : null}
						</div>
						<p className="text-xs text-muted-foreground">
							<time dateTime={item.publishedAt}>{item.publishedAt.slice(0, 10)}</time>
							{item.accountHandle ? ` · @${item.accountHandle}` : ''}
						</p>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							<div lang={item.lang}>
								<p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
									原語 ({item.lang})
								</p>
								<CardTitle className="mb-2 text-sm">{item.titleOriginal}</CardTitle>
								<p className="text-sm text-muted-foreground">{item.summaryOriginal}</p>
							</div>
							<div lang="ja">
								<p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
									日本語
								</p>
								<CardTitle className="mb-2 text-sm">{item.titleJa}</CardTitle>
								<p className="text-sm text-muted-foreground">{item.summaryJa}</p>
							</div>
						</div>
						<p className="mt-4">
							<a
								className="text-sm text-primary underline-offset-4 hover:underline"
								href={item.url}
								rel="noopener noreferrer"
							>
								原文・公式リンク
							</a>
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
