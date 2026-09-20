-- Project timeline RAG schema
CREATE TABLE IF NOT EXISTS projects (
	slug TEXT PRIMARY KEY,
	name_ja TEXT NOT NULL,
	name_en TEXT NOT NULL,
	wiki_docs_id TEXT,
	start_date TEXT,
	end_date TEXT
);

CREATE TABLE IF NOT EXISTS documents (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	url TEXT NOT NULL UNIQUE,
	title TEXT,
	source_type TEXT NOT NULL CHECK (source_type IN ('official', 'paper', 'wiki', 'news')),
	project_slug TEXT NOT NULL,
	content_hash TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ingested', 'failed', 'skipped')),
	occurred_at TEXT,
	ingested_at TEXT,
	error TEXT
);

CREATE TABLE IF NOT EXISTS events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	project_slug TEXT NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('news', 'official', 'paper', 'wiki')),
	occurred_at TEXT NOT NULL,
	url TEXT NOT NULL,
	title TEXT NOT NULL,
	news_id TEXT,
	doc_id INTEGER,
	UNIQUE (project_slug, url, kind)
);

CREATE INDEX IF NOT EXISTS idx_events_project_date ON events (project_slug, occurred_at);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
