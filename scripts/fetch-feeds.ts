import { fetchFeeds as fetch } from '../shared/news/fetch-feeds.ts';
import { secretsFromProcess } from '../shared/news/secrets.ts';

export async function fetchFeeds() {
	return fetch(secretsFromProcess());
}
