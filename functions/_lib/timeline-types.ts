export type TimelineEvent = {
	id: number;
	project_slug: string;
	kind: string;
	occurred_at: string;
	url: string;
	title: string;
	news_id: string | null;
};

export type ProjectRow = {
	slug: string;
	name_ja: string;
	name_en: string;
	wiki_docs_id: string | null;
	start_date: string | null;
	end_date: string | null;
};
