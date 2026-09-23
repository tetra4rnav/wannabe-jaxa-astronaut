import type { NavGroup } from '@/lib/docs';

export const ADMIN_SECTIONS = [
	{ id: 'catalog', label: 'カタログ', href: '/admin/?section=catalog' },
	{ id: 'rag-audit', label: 'RAG監査', href: '/admin/?section=rag-audit' },
] as const;

export type AdminSectionId = (typeof ADMIN_SECTIONS)[number]['id'];

export function adminNavGroups(): NavGroup[] {
	return [
		{
			label: '管理',
			items: ADMIN_SECTIONS.map((s) => ({ href: s.href, title: s.label })),
		},
		{
			label: 'サイト',
			items: [{ href: '/', title: '公開サイトへ' }],
		},
	];
}

export function parseAdminSection(raw: string | null): AdminSectionId {
	if (raw === 'rag-audit') return 'rag-audit';
	return 'catalog';
}
