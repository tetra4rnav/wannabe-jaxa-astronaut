import { fetchX as fetch } from '../shared/news/fetch-x.ts';
import { secretsFromProcess } from '../shared/news/secrets.ts';

export type { FetchXResult } from '../shared/news/fetch-x.ts';

export async function fetchX() {
	return fetch(secretsFromProcess());
}
