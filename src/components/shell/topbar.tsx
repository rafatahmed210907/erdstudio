"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun, UserRound } from "lucide-react";
import { useStudio } from "@/components/studio-provider";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatRelative } from "@/lib/utils";
import { useIsClient } from "@/lib/use-client";

export function Topbar({
  onOpenMobileNav,
  mobileNavOpen,
}: {
  onOpenMobileNav?: () => void;
  mobileNavOpen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const { snapshot, currentDiagram, saveState, searchOpen, setSearchOpen, updateSettings, setSession, markNotificationsRead } =
    useStudio();
  const crumb = useMemo(() => breadcrumb(pathname, currentDiagram?.name ?? "Diagram", currentDiagram?.id), [pathname, currentDiagram]);

  async function toggleTheme() {
    const current = resolvedTheme ?? snapshot?.settings.theme ?? "dark";
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
    await updateSettings({ theme: next });
  }

  const themeToggleIcon =
    isClient && (resolvedTheme ?? snapshot?.settings.theme) === "light" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border bg-sidebar/80 px-3 sm:gap-4 sm:px-4">
      {onOpenMobileNav && (
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen ?? false}
          aria-controls="mobile-sidebar"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {crumb ? (
          <div className="flex items-center gap-2 text-[13px]">
            <Link href={crumb.back} className="text-muted-foreground hover:text-foreground">
              ← Back to Diagram
            </Link>
            <span className="text-border">|</span>
            <nav className="flex min-w-0 items-center gap-1 text-muted-foreground">
              {crumb.items.map((item, index) => (
                <span key={item.label} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                  {item.href ? (
                    <Link href={item.href} className="hover:text-foreground">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="truncate text-foreground">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        ) : (
          <SearchField open={searchOpen} onOpenChange={setSearchOpen} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <SavePill state={saveState} />
        {crumb && (
          <button
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        <button
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Toggle color theme"
          onClick={() => void toggleTheme()}
        >
          {themeToggleIcon}
        </button>
        <Notifications onOpen={() => void markNotificationsRead()} />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-secondary">
            <Avatar initials={snapshot?.user.initials ?? "JD"} />
            <span className="hidden text-[13px] font-medium sm:inline">{snapshot?.user.name ?? "Account"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <UserRound className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void setSession(false).then(() => router.push("/signed-out"));
              }}
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {crumb && searchOpen && <SearchField open={searchOpen} onOpenChange={setSearchOpen} floating />}
    </header>
  );
}

function SavePill({ state }: { state: "saved" | "saving" | "error" }) {
  const label = state === "saving" ? "Saving…" : state === "error" ? "Couldn't save" : "All changes saved";
  return (
    <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground transition-opacity duration-slow sm:inline-flex">
      <span className={cn("h-1.5 w-1.5 rounded-full", state === "error" ? "bg-destructive" : "bg-success")} />
      {label}
    </span>
  );
}

function Notifications({ onOpen }: { onOpen: () => void }) {
  const { snapshot } = useStudio();
  const unread = snapshot?.notifications.filter((item) => !item.read).length ?? 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
          onClick={onOpen}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-[13px] font-medium">Notifications</div>
        <div className="max-h-72 overflow-auto">
          {snapshot?.notifications.length ? (
            snapshot.notifications.map((item) => (
              <div key={item.id} className="border-b border-border px-3 py-2 last:border-0">
                <p className="text-[13px] font-medium">{item.title}</p>
                <p className="text-[12px] text-muted-foreground">{item.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(item.createdAt).replace("Updated ", "")}</p>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">No notifications yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SearchField({
  open,
  onOpenChange,
  floating = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floating?: boolean;
}) {
  const router = useRouter();
  const { snapshot } = useStudio();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const q = query.trim().toLowerCase();
  const diagrams = (snapshot?.diagrams ?? []).filter((diagram) => !q || `${diagram.name} ${diagram.description}`.toLowerCase().includes(q)).slice(0, 5);
  const tables = (snapshot?.diagrams ?? [])
    .flatMap((diagram) => diagram.tables.filter((table) => !q || table.name.toLowerCase().includes(q)).map((table) => ({ diagram, table })))
    .slice(0, 6);
  const templates = (snapshot?.templates ?? []).filter((template) => !q || template.name.toLowerCase().includes(q)).slice(0, 4);

  function visit(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className={cn("relative mx-auto w-full max-w-md", floating && "absolute left-1/2 top-16 z-40 w-[min(440px,calc(100%-2rem))] -translate-x-1/2")}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onOpenChange(true);
        }}
        onFocus={() => onOpenChange(true)}
        placeholder="Search diagrams..."
        className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-14 text-[13px] outline-none focus:ring-2 focus:ring-ring"
        aria-label="Search diagrams"
        onKeyDown={(event) => {
          if (event.key === "Escape") onOpenChange(false);
        }}
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 text-[10px] text-muted-foreground">
        ⌘K
      </kbd>
      {open && (
        <div className="absolute left-0 right-0 top-11 z-40 max-h-80 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
          <ResultGroup label="Diagrams">
            {diagrams.map((diagram) => (
              <ResultButton key={diagram.id} title={diagram.name} meta={`${diagram.tables.length} tables`} onClick={() => visit(`/diagrams/${diagram.id}`)} />
            ))}
          </ResultGroup>
          <ResultGroup label="Tables">
            {tables.map(({ diagram, table }) => (
              <ResultButton key={table.id} title={table.name} meta={diagram.name} onClick={() => visit(`/diagrams/${diagram.id}`)} />
            ))}
          </ResultGroup>
          <ResultGroup label="Templates">
            {templates.map((template) => (
              <ResultButton key={template.id} title={template.name} meta={template.kind} onClick={() => visit("/templates")} />
            ))}
          </ResultGroup>
          {diagrams.length + tables.length + templates.length === 0 && (
            <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">No matches.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ResultButton({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-secondary" onClick={onClick}>
      <span>{title}</span>
      <span className="text-[11px] text-muted-foreground">{meta}</span>
    </button>
  );
}

function breadcrumb(pathname: string, diagramName: string, diagramId?: string) {
  const tableMatch = pathname.match(/^\/diagrams\/([^/]+)\/tables\/new$/);
  const relationMatch = pathname.match(/^\/diagrams\/([^/]+)\/relationships\/new$/);
  if (!tableMatch && !relationMatch) return null;
  const id = tableMatch?.[1] ?? relationMatch?.[1] ?? diagramId;
  return {
    back: id ? `/diagrams/${id}` : "/diagrams",
    items: [
      { label: "My Diagrams", href: "/diagrams" },
      { label: diagramName, href: id ? `/diagrams/${id}` : undefined },
      { label: tableMatch ? "Add Table" : "Add Relationship" },
    ],
  };
}
