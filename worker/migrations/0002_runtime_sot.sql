-- Runtime SoT: full catalog, news feed, proposals (ADR-20260923-1 / issue #12)

ALTER TABLE projects ADD COLUMN role TEXT;
ALTER TABLE projects ADD COLUMN phase TEXT;
ALTER TABLE projects ADD COLUMN kind_ja TEXT;
ALTER TABLE projects ADD COLUMN countries_json TEXT;
ALTER TABLE projects ADD COLUMN keywords_json TEXT;

CREATE TABLE IF NOT EXISTS project_relations (
	from_slug TEXT NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('partner', 'depends_on', 'successor')),
	to_slug TEXT NOT NULL,
	PRIMARY KEY (from_slug, type, to_slug)
);

CREATE TABLE IF NOT EXISTS news_items (
	id TEXT PRIMARY KEY,
	url TEXT NOT NULL,
	kind TEXT NOT NULL,
	lang TEXT NOT NULL,
	region TEXT NOT NULL,
	source_label TEXT NOT NULL,
	source_id TEXT NOT NULL,
	published_at TEXT NOT NULL,
	retrieved_at TEXT NOT NULL,
	title_original TEXT NOT NULL,
	summary_original TEXT NOT NULL,
	title_ja TEXT NOT NULL,
	summary_ja TEXT NOT NULL,
	account_handle TEXT,
	machine_translated INTEGER NOT NULL DEFAULT 0,
	project_slugs_json TEXT,
	ingest_as_source INTEGER,
	llm_classified_at TEXT,
	llm_reason TEXT,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items (published_at DESC);

CREATE TABLE IF NOT EXISTS proposals (
	id TEXT PRIMARY KEY,
	created_at TEXT NOT NULL,
	news_id TEXT NOT NULL,
	news_url TEXT NOT NULL,
	news_title TEXT NOT NULL,
	project_slugs_json TEXT NOT NULL,
	action TEXT NOT NULL,
	target_docs_id TEXT,
	proposed_title TEXT NOT NULL,
	headings_json TEXT NOT NULL,
	evidence_urls_json TEXT NOT NULL,
	timeline_note TEXT NOT NULL,
	relation TEXT NOT NULL,
	rationale TEXT NOT NULL,
	model TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals (created_at DESC);
