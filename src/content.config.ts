import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
	docs: defineCollection({
		loader: glob({
			pattern: '**/*.{md,mdx}',
			base: './src/content/docs',
			generateId: ({ entry }) => entry.replace(/\\/g, '/').replace(/\.(md|mdx)$/i, ''),
		}),
		schema: z.object({
			title: z.string(),
			description: z.string().optional(),
			sources: z.array(z.string().url()).optional(),
			reviewed: z.string().optional(),
			draft: z.boolean().optional(),
		}),
	}),
};
