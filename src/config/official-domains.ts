/** Domains allowed as Wiki primary sources. News-only outlets are NOT listed here. */
export const OFFICIAL_DOMAINS = [
	'jaxa.jp',
	'isas.jaxa.jp',
	'exploration.jaxa.jp',
	'human-spaceflight.jaxa.jp',
	'global.jaxa.jp',
	'cao.go.jp',
	'www8.cao.go.jp',
	'mext.go.jp',
	'www.mext.go.jp',
	'nasa.gov',
	'www.nasa.gov',
	'esa.int',
	'www.esa.int',
	'roscosmos.ru',
	'www.roscosmos.ru',
	'cmse.gov.cn',
	'www.cmse.gov.cn',
	'en.cmse.gov.cn',
	'cnsa.gov.cn',
	'www.cnsa.gov.cn',
	'spacex.com',
	'www.spacex.com',
	'unoosa.org',
	'www.unoosa.org',
	'state.gov',
	'www.state.gov',
] as const;

export function isOfficialUrl(url: string): boolean {
	try {
		const host = new URL(url).hostname.toLowerCase();
		return OFFICIAL_DOMAINS.some(
			(d) => host === d || host.endsWith(`.${d}`),
		);
	} catch {
		return false;
	}
}
