// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://wannabe-jaxa-astronaut.diaphana.io',
	output: 'server',
	adapter: cloudflare({
		imageService: 'compile',
		prerenderEnvironment: 'node',
	}),
	session: false,
	integrations: [react(), sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
