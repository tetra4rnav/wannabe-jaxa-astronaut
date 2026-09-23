import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Moon, PanelLeft, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GITHUB_REPO, SITE_HEADER } from '@/lib/site';
import type { NavGroup } from '@/lib/docs';

type Props = {
	groups: NavGroup[];
	currentPath: string;
};

function GitHubIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.295 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
		</svg>
	);
}

const COOKIE = 'sidebar_state';
const WIDTH_OPEN = '16rem';
const WIDTH_CLOSED = '0px';

function readCookieOpen(): boolean {
	if (typeof document === 'undefined') return true;
	const row = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
	if (!row) return true;
	return row.split('=')[1] !== 'false';
}

function writeCookieOpen(open: boolean) {
	document.cookie = `${COOKIE}=${open}; path=/; max-age=31536000; SameSite=Lax`;
}

function applyWidth(open: boolean, mobile: boolean) {
	const width = mobile || !open ? WIDTH_CLOSED : WIDTH_OPEN;
	document.documentElement.style.setProperty('--sidebar-current-width', width);
	document.documentElement.dataset.sidebar = open ? 'open' : 'closed';
}

function isActive(href: string, currentPath: string): boolean {
	if (href === '/') return currentPath === '/';
	return currentPath === href || currentPath.startsWith(href);
}

function groupContainsPath(group: NavGroup, currentPath: string): boolean {
	return group.items.some((item) => isActive(item.href, currentPath));
}

function ModeToggle() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		setDark(document.documentElement.classList.contains('dark'));
	}, []);

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="relative text-current hover:bg-transparent/10 hover:text-current"
			aria-label={dark ? 'ライトテーマ' : 'ダークテーマ'}
			onClick={() => {
				const next = !document.documentElement.classList.contains('dark');
				document.documentElement.classList.toggle('dark', next);
				setDark(next);
			}}
		>
			<Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
		</Button>
	);
}

function NavGroupDetails({
	label,
	openByDefault,
	children,
}: {
	label: string;
	openByDefault: boolean;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(openByDefault);

	useEffect(() => {
		setOpen(openByDefault);
	}, [openByDefault]);

	return (
		<details
			className="group/nav"
			open={open}
			onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
		>
			<summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase select-none [&::-webkit-details-marker]:hidden">
				<ChevronDown className="size-3.5 shrink-0 -rotate-90 transition-transform group-open/nav:rotate-0" />
				<span className="truncate">{label}</span>
			</summary>
			{children}
		</details>
	);
}

function NavList({
	groups,
	currentPath,
	onNavigate,
}: {
	groups: NavGroup[];
	currentPath: string;
	onNavigate?: () => void;
}) {
	const [query, setQuery] = useState('');
	const q = query.trim().toLowerCase();

	const filtered = useMemo(() => {
		if (!q) return groups;
		return groups
			.map((group) => ({
				...group,
				items: group.items.filter((item) => item.title.toLowerCase().includes(q)),
			}))
			.filter((group) => group.items.length > 0);
	}, [groups, q]);

	return (
		<div className="flex flex-col gap-3 px-3 py-4">
			<label className="relative block px-1">
				<span className="sr-only">ナビを検索</span>
				<Search
					className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="検索…"
					className="w-full rounded-md border border-sidebar-border bg-sidebar px-8 py-1.5 text-sm text-sidebar-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
				/>
			</label>
			<nav className="flex flex-col gap-1" aria-label="サイトナビ">
				{filtered.length === 0 ? (
					<p className="px-2 text-sm text-muted-foreground">該当なし</p>
				) : (
					filtered.map((group) => {
						const openByDefault = Boolean(q) || groupContainsPath(group, currentPath);
						return (
							<NavGroupDetails
								key={group.label}
								label={group.label}
								openByDefault={openByDefault}
							>
								<ul className="mt-0.5 mb-2 flex flex-col gap-0.5">
									{group.items.map((item) => {
										const active = isActive(item.href, currentPath);
										return (
											<li key={item.href}>
												<a
													href={item.href}
													onClick={onNavigate}
													className={cn(
														'block rounded-md px-2 py-1.5 text-sm no-underline transition-colors',
														active
															? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
															: 'text-sidebar-foreground hover:bg-sidebar-accent/70',
													)}
												>
													{item.title}
												</a>
											</li>
										);
									})}
								</ul>
							</NavGroupDetails>
						);
					})
				)}
			</nav>
		</div>
	);
}

export function SiteChrome({ groups, currentPath }: Props) {
	const [open, setOpen] = useState(true);
	const [mobile, setMobile] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		const sync = () => {
			const isMobile = mq.matches;
			setMobile(isMobile);
			const nextOpen = isMobile ? false : readCookieOpen();
			setOpen(nextOpen);
			applyWidth(nextOpen, isMobile);
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	}, []);

	useEffect(() => {
		applyWidth(open, mobile);
		if (!mobile) writeCookieOpen(open);
	}, [open, mobile]);

	const toggle = () => setOpen((v) => !v);

	return (
		<>
			<header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-transparent bg-[var(--header)] px-3 text-[var(--header-foreground)]">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="text-current hover:bg-transparent/10 hover:text-current"
					aria-label="サイドメニュー"
					aria-expanded={open}
					onClick={toggle}
				>
					<PanelLeft className="size-4" />
				</Button>
				<a
					href="/"
					className="truncate text-sm font-semibold tracking-tight text-current no-underline"
				>
					{SITE_HEADER}
				</a>
				<div className="ml-auto flex items-center gap-1">
					<a
						href={GITHUB_REPO}
						className="inline-flex size-9 items-center justify-center rounded-md text-current no-underline hover:bg-transparent/10"
						aria-label="GitHub"
						rel="noopener noreferrer"
					>
						<GitHubIcon className="size-4" />
					</a>
					<ModeToggle />
				</div>
			</header>

			{mobile ? (
				open ? (
					<div className="fixed inset-0 z-50 md:hidden">
						<button
							type="button"
							className="absolute inset-0 bg-black/40"
							aria-label="メニューを閉じる"
							onClick={() => setOpen(false)}
						/>
						<aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-sidebar text-sidebar-foreground shadow-lg">
							<div className="flex h-14 items-center border-b px-4 text-sm font-medium">
								メニュー
							</div>
							<div className="flex-1 overflow-y-auto">
								<NavList
									groups={groups}
									currentPath={currentPath}
									onNavigate={() => setOpen(false)}
								/>
							</div>
						</aside>
					</div>
				) : null
			) : (
				<aside
					className={cn(
						'fixed top-14 bottom-0 left-0 z-30 hidden overflow-hidden border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex md:flex-col',
						open ? 'w-64' : 'w-0 border-r-0',
					)}
					aria-hidden={!open}
				>
					<div className="w-64 flex-1 overflow-y-auto">
						<NavList groups={groups} currentPath={currentPath} />
					</div>
				</aside>
			)}
		</>
	);
}
