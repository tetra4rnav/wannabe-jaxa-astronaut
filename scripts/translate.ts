import { secretsFromProcess } from '../shared/news/secrets.ts';
import { translateToJa as translate } from '../shared/news/translate.ts';

export async function translateToJa(text: string, sourceLang: string) {
	return translate(text, sourceLang, secretsFromProcess());
}
