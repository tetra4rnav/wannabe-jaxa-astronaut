import { CatalogSection } from './sections/CatalogSection';
import { RagAuditSection } from './sections/RagAuditSection';
import type { AdminSectionId } from '@/lib/admin-nav';

type Props = {
	section: AdminSectionId;
	slug?: string | null;
};

export function AdminApp({ section, slug }: Props) {
	if (section === 'rag-audit') return <RagAuditSection />;
	return <CatalogSection initialSlug={slug} />;
}
