export type FeedLang = 'ja' | 'en' | 'ru' | 'zh';
export type FeedRegion = 'japan' | 'usa' | 'europe' | 'spacex' | 'russia' | 'china';
export type FeedKind = 'rss' | 'html-list';

export interface FeedConfig {
	id: string;
	label: string;
	url: string;
	lang: FeedLang;
	region: FeedRegion;
	kind: FeedKind;
	/** CSS-ish selectors for html-list scraping (title link only). */
	linkSelector?: string;
}

export const FEEDS: FeedConfig[] = [
	{
		id: 'jaxa-press',
		label: 'JAXA プレスリリース',
		url: 'https://www.jaxa.jp/press/index_j.html',
		lang: 'ja',
		region: 'japan',
		kind: 'html-list',
		linkSelector: 'a',
	},
	{
		id: 'nasa-breaking',
		label: 'NASA Breaking News',
		url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
		lang: 'en',
		region: 'usa',
		kind: 'rss',
	},
	{
		id: 'nasa-image',
		label: 'NASA Image of the Day',
		url: 'https://www.nasa.gov/rss/dyn/lg_image_of_the_day.rss',
		lang: 'en',
		region: 'usa',
		kind: 'rss',
	},
	{
		id: 'esa-news',
		label: 'ESA News',
		url: 'https://www.esa.int/rssfeed/Our_Activities/Human_and_Robotic_Exploration',
		lang: 'en',
		region: 'europe',
		kind: 'rss',
	},
	{
		id: 'spacex-updates',
		label: 'SpaceX Updates',
		url: 'https://www.spacex.com/updates/',
		lang: 'en',
		region: 'spacex',
		kind: 'html-list',
		linkSelector: 'a',
	},
	{
		id: 'roscosmos-news',
		label: 'Роскосмос',
		url: 'https://www.roscosmos.ru/news/',
		lang: 'ru',
		region: 'russia',
		kind: 'html-list',
		linkSelector: 'a',
	},
	{
		id: 'cmse-news',
		label: '中国载人航天',
		url: 'https://www.cmse.gov.cn/xwzx/zhxw/',
		lang: 'zh',
		region: 'china',
		kind: 'html-list',
		linkSelector: 'a',
	},
	{
		id: 'cnsa-news',
		label: '国家航天局',
		url: 'https://www.cnsa.gov.cn/n6758823/n6758838/',
		lang: 'zh',
		region: 'china',
		kind: 'html-list',
		linkSelector: 'a',
	},
];

/** Keywords used to keep human-spaceflight–relevant items. */
export const NEWS_KEYWORDS = [
	'有人',
	'宇宙飛行士',
	'ISS',
	'国際宇宙ステーション',
	'アルテミス',
	'ゲートウェイ',
	'与圧ローバ',
	'月面',
	'astronaut',
	'Artemis',
	'Crew Dragon',
	'Starship',
	'human spaceflight',
	'Союз',
	'МКС',
	'Роскосмос',
	'космонавт',
	'神舟',
	'天宫',
	'嫦娥',
	'天舟',
	'载人',
	'航天员',
];
