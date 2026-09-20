export type FactCheckVerdict = 'pass' | 'needs-update' | 'failed';

export interface FactCheckEntry {
	date: string;
	model: string;
	verdict: FactCheckVerdict;
	summary: string;
	issues: string[];
}

export interface FactCheckFile {
	id: string;
	entries: FactCheckEntry[];
}
