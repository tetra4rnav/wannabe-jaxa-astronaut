import type { NewsSecrets } from './secrets.ts';

const cache = new Map<string, string>();

async function deeplTranslate(
	text: string,
	sourceLang: string,
	apiKey?: string,
): Promise<string | null> {
	if (!apiKey) return null;
	const endpoint = apiKey.endsWith(':fx')
		? 'https://api-free.deepl.com/v2/translate'
		: 'https://api.deepl.com/v2/translate';
	const body = new URLSearchParams();
	body.set('auth_key', apiKey);
	body.set('text', text);
	body.set('target_lang', 'JA');
	if (sourceLang && sourceLang !== 'ja') {
		const map: Record<string, string> = { en: 'EN', ru: 'RU', zh: 'ZH' };
		if (map[sourceLang]) body.set('source_lang', map[sourceLang]!);
	}
	try {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
		});
		if (!res.ok) {
			console.warn(`[translate] DeepL ${res.status}`);
			return null;
		}
		const data = (await res.json()) as { translations?: { text: string }[] };
		return data.translations?.[0]?.text ?? null;
	} catch (err) {
		console.warn('[translate] DeepL failed', err);
		return null;
	}
}

async function myMemoryTranslate(text: string, sourceLang: string): Promise<string | null> {
	const langpair = `${sourceLang}|ja`;
	const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const data = (await res.json()) as { responseData?: { translatedText?: string } };
		const out = data.responseData?.translatedText;
		if (!out || out.toLowerCase().includes('myMEMORY warning'.toLowerCase())) return null;
		return out;
	} catch {
		return null;
	}
}

export async function translateToJa(
	text: string,
	sourceLang: string,
	secrets: NewsSecrets = {},
): Promise<{ text: string; machineTranslated: boolean }> {
	const trimmed = text.trim();
	if (!trimmed) return { text: '', machineTranslated: false };
	if (sourceLang === 'ja') return { text: trimmed, machineTranslated: false };

	const key = `${sourceLang}::${trimmed}`;
	if (cache.has(key)) return { text: cache.get(key)!, machineTranslated: true };

	const deepl = await deeplTranslate(trimmed, sourceLang, secrets.DEEPL_API_KEY);
	if (deepl) {
		cache.set(key, deepl);
		return { text: deepl, machineTranslated: true };
	}
	const mm = await myMemoryTranslate(trimmed, sourceLang);
	if (mm) {
		cache.set(key, mm);
		return { text: mm, machineTranslated: true };
	}
	return { text: trimmed, machineTranslated: false };
}
