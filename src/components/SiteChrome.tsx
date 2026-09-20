import { useEffect, useState } from 'react';
import { Moon, PanelLeft, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GITHUB_REPO, SITE_TITLE } from '@/lib/site';
import type { NavGroup } from '@/lib/docs';

type Props = {
	groups: NavGroup[];
	currentPath: string;
};

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
			className="relative"
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

function NavList({
	groups,
	currentPath,
	onNavigate,
}: {
	groups: NavGroup[];
	currentPath: string;
	onNavigate?: () => void;
}) {
	return (
		<nav className="flex flex-col gap-6 px-3 py-4" aria-label="サイトナビ">
			{groups.map((group) => (
				<div key={group.label}>
					<p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{group.label}
					</p>
					<ul className="flex flex-col gap-0.5">
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
				</div>
			))}
		</nav>
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
			<header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-3">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="サイドメニュー"
					aria-expanded={open}
					onClick={toggle}
				>
					<PanelLeft className="size-4" />
				</Button>
				<a href="/" className="truncate text-sm font-medium no-underline">
					{SITE_TITLE}
				</a>
				<div className="ml-auto flex items-center gap-1">
					<a
						href={GITHUB_REPO}
						className="rounded-md px-2 py-1 text-sm text-muted-foreground no-underline hover:bg-muted hover:text-foreground"
						rel="noopener noreferrer"
					>
						GitHub
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
