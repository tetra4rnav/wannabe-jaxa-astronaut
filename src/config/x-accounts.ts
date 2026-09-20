import type { FeedLang, FeedRegion } from './feeds.ts';

export interface XAccountConfig {
	id: string;
	handle: string;
	label: string;
	lang: FeedLang;
	region: FeedRegion;
}

/** Official agency / program accounts only. Add handles here to monitor more. */
export const X_ACCOUNTS: XAccountConfig[] = [
	{ id: 'jaxa-jp', handle: 'JAXA_jp', label: 'JAXA（日本語）', lang: 'ja', region: 'japan' },
	{ id: 'jaxa-en', handle: 'JAXA_en', label: 'JAXA（English）', lang: 'en', region: 'japan' },
	{ id: 'nasa', handle: 'NASA', label: 'NASA', lang: 'en', region: 'usa' },
	{ id: 'nasa-astronauts', handle: 'NASA_Astronauts', label: 'NASA Astronauts', lang: 'en', region: 'usa' },
	{ id: 'space_station', handle: 'Space_Station', label: 'ISS', lang: 'en', region: 'usa' },
	{ id: 'esa', handle: 'esa', label: 'ESA', lang: 'en', region: 'europe' },
	{ id: 'spacex', handle: 'SpaceX', label: 'SpaceX', lang: 'en', region: 'spacex' },
	{ id: 'roscosmos', handle: 'roscosmos', label: 'Роскосмос', lang: 'ru', region: 'russia' },
];
