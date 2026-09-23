import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type {
	ProjectConfig,
	ProjectPhase,
	ProjectRelation,
	ProjectRelationType,
	ProjectRole,
} from '@/config/projects';

type Props = {
	initialSlug?: string | null;
};

const ROLES: ProjectRole[] = ['seed', 'related', 'retired'];
const PHASES: ProjectPhase[] = ['ongoing', 'planned'];
const REL_TYPES: ProjectRelationType[] = ['partner', 'depends_on', 'successor'];

const emptyForm = (): ProjectConfig => ({
	slug: '' as ProjectConfig['slug'],
	nameJa: '',
	nameEn: '',
	keywords: [],
	role: 'related',
	phase: 'planned',
	relations: [],
	countries: [],
	kindJa: '',
});

export function CatalogSection({ initialSlug }: Props) {
	const [projects, setProjects] = useState<ProjectConfig[]>([]);
	const [form, setForm] = useState<ProjectConfig>(emptyForm());
	const [creating, setCreating] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const load = async () => {
		setLoading(true);
		try {
			const res = await fetch('/admin/api/catalog/projects');
			if (!res.ok) throw new Error(await res.text());
			const data = (await res.json()) as { projects: ProjectConfig[] };
			setProjects(data.projects ?? []);
		} catch (e) {
			setStatus(e instanceof Error ? e.message : 'load failed');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	useEffect(() => {
		if (!initialSlug || !projects.length) return;
		const p = projects.find((x) => x.slug === initialSlug);
		if (p) {
			setForm({ ...p, relations: [...(p.relations ?? [])] });
			setCreating(false);
		}
	}, [initialSlug, projects]);

	const slugOptions = useMemo(() => projects.map((p) => p.slug), [projects]);

	const startCreate = () => {
		setCreating(true);
		setForm(emptyForm());
		setStatus(null);
	};

	const startEdit = (p: ProjectConfig) => {
		setCreating(false);
		setForm({ ...p, relations: [...(p.relations ?? [])] });
		setStatus(null);
		const url = new URL(window.location.href);
		url.searchParams.set('section', 'catalog');
		url.searchParams.set('slug', p.slug);
		window.history.replaceState({}, '', url);
	};

	const save = async () => {
		setStatus(null);
		try {
			if (creating) {
				if (!form.slug.trim()) throw new Error('slug は必須です');
				const res = await fetch('/admin/api/catalog/projects', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form),
				});
				if (!res.ok) throw new Error(await res.text());
			} else {
				const res = await fetch(`/admin/api/catalog/projects/${encodeURIComponent(form.slug)}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form),
				});
				if (!res.ok) throw new Error(await res.text());
			}
			setStatus('保存しました');
			setCreating(false);
			await load();
		} catch (e) {
			setStatus(e instanceof Error ? e.message : 'save failed');
		}
	};

	const retire = async () => {
		if (creating || !form.slug) return;
		setStatus(null);
		try {
			const res = await fetch(
				`/admin/api/catalog/projects/${encodeURIComponent(form.slug)}/retire`,
				{ method: 'POST' },
			);
			if (!res.ok) throw new Error(await res.text());
			setStatus('引退にしました');
			await load();
			const updated = await res.json();
			setForm(updated as ProjectConfig);
		} catch (e) {
			setStatus(e instanceof Error ? e.message : 'retire failed');
		}
	};

	const setRel = (index: number, patch: Partial<ProjectRelation>) => {
		const relations = [...(form.relations ?? [])];
		relations[index] = { ...relations[index], ...patch } as ProjectRelation;
		setForm({ ...form, relations });
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-lg font-semibold">カタログ</h2>
				<Button type="button" onClick={startCreate}>
					新規
				</Button>
			</div>

			{loading ? (
				<p className="text-sm text-muted-foreground">読み込み中…</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>slug</TableHead>
							<TableHead>名前</TableHead>
							<TableHead>種別</TableHead>
							<TableHead>role</TableHead>
							<TableHead>phase</TableHead>
							<TableHead>関係</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects.map((p) => (
							<TableRow key={p.slug}>
								<TableCell className="font-mono text-xs">{p.slug}</TableCell>
								<TableCell>{p.nameJa}</TableCell>
								<TableCell>{p.kindJa ?? '—'}</TableCell>
								<TableCell>
									<Badge variant="outline">{p.role ?? '—'}</Badge>
								</TableCell>
								<TableCell>{p.phase ?? '—'}</TableCell>
								<TableCell>{p.relations?.length ?? 0}</TableCell>
								<TableCell>
									<Button type="button" variant="ghost" size="sm" onClick={() => startEdit(p)}>
										編集
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<section className="space-y-3 rounded-md border border-border p-4">
				<h3 className="font-medium">{creating ? '新規プロジェクト' : `編集: ${form.slug || '—'}`}</h3>
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="text-sm">
						slug
						<input
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm"
							value={form.slug}
							disabled={!creating}
							onChange={(e) => setForm({ ...form, slug: e.target.value as ProjectConfig['slug'] })}
						/>
					</label>
					<label className="text-sm">
						kindJa
						<input
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={form.kindJa ?? ''}
							onChange={(e) => setForm({ ...form, kindJa: e.target.value })}
						/>
					</label>
					<label className="text-sm">
						nameJa
						<input
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={form.nameJa}
							onChange={(e) => setForm({ ...form, nameJa: e.target.value })}
						/>
					</label>
					<label className="text-sm">
						nameEn
						<input
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={form.nameEn}
							onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
						/>
					</label>
					<label className="text-sm">
						role
						<select
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={form.role ?? 'related'}
							onChange={(e) => setForm({ ...form, role: e.target.value as ProjectRole })}
						>
							{ROLES.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
							))}
						</select>
					</label>
					<label className="text-sm">
						phase
						<select
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={form.phase ?? 'planned'}
							onChange={(e) => setForm({ ...form, phase: e.target.value as ProjectPhase })}
						>
							{PHASES.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</label>
					<label className="text-sm sm:col-span-2">
						countries（カンマ区切り）
						<input
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={(form.countries ?? []).join(',')}
							onChange={(e) =>
								setForm({
									...form,
									countries: e.target.value
										.split(',')
										.map((s) => s.trim())
										.filter(Boolean) as ProjectConfig['countries'],
								})
							}
						/>
					</label>
					<label className="text-sm sm:col-span-2">
						keywords（カンマ区切り）
						<input
							className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
							value={(form.keywords ?? []).join(',')}
							onChange={(e) =>
								setForm({
									...form,
									keywords: e.target.value
										.split(',')
										.map((s) => s.trim())
										.filter(Boolean),
								})
							}
						/>
					</label>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium">関係</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								setForm({
									...form,
									relations: [
										...(form.relations ?? []),
										{ type: 'partner', target: (slugOptions[0] ?? 'artemis') as ProjectRelation['target'] },
									],
								})
							}
						>
							行を追加
						</Button>
					</div>
					{(form.relations ?? []).map((r, i) => (
						<div key={i} className="flex flex-wrap gap-2">
							<select
								className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
								value={r.type}
								onChange={(e) => setRel(i, { type: e.target.value as ProjectRelationType })}
							>
								{REL_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
							<select
								className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
								value={r.target}
								onChange={(e) =>
									setRel(i, { target: e.target.value as ProjectRelation['target'] })
								}
							>
								{slugOptions.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									setForm({
										...form,
										relations: (form.relations ?? []).filter((_, j) => j !== i),
									})
								}
							>
								削除
							</Button>
						</div>
					))}
				</div>

				<div className="flex flex-wrap gap-2">
					<Button type="button" onClick={() => void save()}>
						保存
					</Button>
					{!creating && form.slug ? (
						<Button type="button" variant="outline" onClick={() => void retire()}>
							引退
						</Button>
					) : null}
				</div>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</section>
		</div>
	);
}
