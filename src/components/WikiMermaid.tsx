import { useEffect } from 'react';

export function WikiMermaid() {
	useEffect(() => {
		const blocks = [
			...document.querySelectorAll<HTMLElement>(
				'.wiki-prose pre[data-language="mermaid"], .wiki-prose pre > code.language-mermaid',
			),
		];
		if (blocks.length === 0) return;

		let cancelled = false;
		void import('mermaid').then(({ default: mermaid }) => {
			if (cancelled) return;
			const dark = document.documentElement.classList.contains('dark');
			mermaid.initialize({
				startOnLoad: false,
				theme: dark ? 'dark' : 'neutral',
				securityLevel: 'strict',
			});
			blocks.forEach((node, i) => {
				const source = node.textContent ?? '';
				const host = document.createElement('div');
				host.className = 'mermaid my-4 overflow-x-auto';
				const renderId = `mermaid-${i}-svg`;
				const pre = node.tagName === 'CODE' ? node.closest('pre') : node;
				(pre ?? node).replaceWith(host);
				void mermaid.render(renderId, source).then(({ svg }) => {
					if (!cancelled) host.innerHTML = svg;
				});
			});
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return null;
}
