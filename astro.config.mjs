// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import { wikiSidebar } from './src/utils/sidebar.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://wannabe-jaxa-astronaut.jh1cid.workers.dev',
	integrations: [
		starlight({
			title: 'JAXA宇宙飛行士志望Wiki',
			description:
				'JAXA非公式。公式出典のみのWikiと、各国公式ニュースの原語＋日本語対照サイト。',
			locales: {
				root: {
					label: '日本語',
					lang: 'ja',
				},
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/tetra4rnav/wannabe-jaxa-astronaut',
				},
			],
			customCss: ['./src/styles/custom.css'],
			components: {
				Header: './src/components/Header.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				Footer: './src/components/Footer.astro',
			},
			head: [
				{
					tag: 'meta',
					attrs: {
						name: 'robots',
						content: 'index, follow',
					},
				},
			],
			sidebar: [
				{
					label: 'このサイト',
					items: [
						{ label: 'ホーム', slug: '' },
						{ label: 'このサイトについて', slug: 'about' },
					],
				},
				...wikiSidebar(),
			],
			plugins: [
				starlightLlmsTxt({
					projectName: 'JAXA宇宙飛行士志望Wiki',
					description:
						'JAXA非公式の日本語静的サイト。Wikiは公式一次資料のみ。編集の正本は Git 上の Markdown（src/content/docs）。RAG 用コーパスは /corpus/。',
					details: `重要な制約:
- 本サイトは JAXA / 宇宙機関の公式サイトではありません。
- Wiki 本文・数字は許可ドメイン上の公式一次資料のみを根拠にします（Wikipedia・報道・SNSは出典にしない）。
- エージェントは HTML を直接編集せず、リポジトリの Markdown を監査・加筆してください。手順は AGENTS.md を参照。
- 外部 RAG は /corpus/chunks.jsonl を取り込み、サイト内 Vectorize / チャット API はありません。`,
					optionalLinks: [
						{
							label: 'エージェント契約 (AGENTS.md)',
							url: 'https://github.com/tetra4rnav/wannabe-jaxa-astronaut/blob/main/AGENTS.md',
							description: 'Wiki の読み書き・監査ルール',
						},
						{
							label: 'RAG コーパス manifest',
							url: '/corpus/manifest.json',
							description: 'チャンク数・スキーマ版',
						},
						{
							label: 'ニュース JSON',
							url: '/news.json',
							description: '原語＋日本語のニュース一覧',
						},
					],
					exclude: ['_template/**'],
				}),
			],
		}),
	],
});
