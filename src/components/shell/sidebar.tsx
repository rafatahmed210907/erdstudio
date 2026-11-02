"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Database,
  Download,
  FileUp,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutTemplate,
  Plus,
  Settings,
  Share2,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useStudio } from "@/components/studio-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { engineBadge } from "@/lib/data/types";
import { useIsClient } from "@/lib/use-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/diagrams", label: "My Diagrams", icon: FolderKanban },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/import-export", label: "Import / Export", icon: FileUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarContentProps = {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

/** Shared nav panel — desktop sidebar and mobile drawer. */
export function SidebarContent({ className, onNavigate, showClose, onClose }: SidebarContentProps) {
  const pathname = usePathname();
  const isClient = useIsClient();
  const router = useRouter();
  const { snapshot, currentDiagram, setHelpOpen, autoLayout, updateSettings } = useStudio();
  const diagramId = currentDiagram?.id;

  async function switchProject(id: string) {
    await updateSettings({ currentDiagramId: id });
    onNavigate?.();
    router.push(`/diagrams/${id}`);
  }

  function go(href: string) {
    onNavigate?.();
    router.push(href);
  }

  return (
    <div className={cn("flex h-full flex-col overflow-y-auto bg-sidebar", className)}>
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5" onClick={onNavigate}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Database className="h-4 w-4" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">ERD Studio</span>
        </Link>
        {showClose && onClose && (
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="space-y-1 px-3">
        {NAV.map((item) => {
          const active = isClient && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 px-3">
        <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Current Project</p>
        <Popover>
          <PopoverTrigger asChild>
            <button className="mt-2 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left hover:border-primary/40">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                <Database className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{currentDiagram?.name ?? "No diagram"}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {currentDiagram
                    ? `${engineBadge(currentDiagram.engine)} · ${currentDiagram.tables.length} tables`
                    : "Create one to begin"}
                </span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[220px] p-1">
            {snapshot?.diagrams.map((diagram) => (
              <button
                key={diagram.id}
                className={cn(
                  "flex w-full rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-secondary",
                  diagram.id === diagramId && "text-primary",
                )}
                onClick={() => void switchProject(diagram.id)}
              >
                {diagram.name}
              </button>
            ))}
            {snapshot?.diagrams.length === 0 && (
              <p className="px-2 py-2 text-[12px] text-muted-foreground">No diagrams yet.</p>
            )}
          </PopoverContent>
        </Popover>
        {diagramId && (
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-2 text-[12px] font-medium text-primary hover:bg-primary/15"
            onClick={() => void switchProject(diagramId)}
          >
            Go to board
          </button>
        )}
      </div>

      <div className="mt-5 px-3">
        <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Quick Actions</p>
        <div className="mt-1">
          <Action
            label="Add Table"
            hint="T"
            icon={Plus}
            disabled={!diagramId}
            onClick={() => diagramId && go(`/diagrams/${diagramId}/tables/new`)}
          />
          <Action
            label="Add Relationship"
            hint="R"
            icon={Share2}
            disabled={!diagramId}
            onClick={() => diagramId && go(`/diagrams/${diagramId}/relationships/new`)}
          />
          <Action
            label="Auto Layout"
            hint="L"
            icon={Wand2}
            disabled={!diagramId}
            onClick={() => {
              if (!diagramId) return;
              void autoLayout(diagramId);
              onNavigate?.();
            }}
          />
          <Action
            label="Export Diagram"
            hint="E"
            icon={Download}
            disabled={!diagramId}
            onClick={() => diagramId && go(`/import-export?diagram=${diagramId}`)}
          />
        </div>
      </div>

      <div className="mt-auto space-y-3 p-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <p className="text-[13px] font-medium">Design better databases, faster.</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">Visualize. Plan. Build.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
            <HelpCircle className="h-4 w-4" />
          </div>
          <p className="text-[13px] font-medium">Need help?</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">Shortcuts, previews, and how local data is stored.</p>
          <button
            className="mt-3 text-[12px] font-medium text-primary"
            onClick={() => {
              setHelpOpen(true);
              onNavigate?.();
            }}
          >
            View docs →
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fixed sidebar on large screens. */
export function Sidebar() {
  return (
    <aside className="hidden h-full w-[248px] shrink-0 flex-col border-r border-border lg:flex">
      <SidebarContent />
    </aside>
  );
}

/** Slide-over navigation for phones and tablets. */
export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => onOpenChange(false)}
      />
      <aside
        id="mobile-sidebar"
        className={cn(
          "absolute left-0 top-0 flex h-full w-[min(288px,calc(100vw-2rem))] flex-col border-r border-border shadow-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <SidebarContent showClose onClose={() => onOpenChange(false)} onNavigate={() => onOpenChange(false)} />
      </aside>
    </div>
  );
}

function Action({
  label,
  hint,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  icon: typeof Plus;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-secondary disabled:opacity-40"
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <kbd className="hidden rounded border border-border px-1.5 text-[10px] text-muted-foreground sm:inline">{hint}</kbd>
    </button>
  );
}
