"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MobileSidebar, Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { useStudio } from "@/components/studio-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isTypingTarget } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { snapshot, loading, loadError, helpOpen, setHelpOpen, setSearchOpen, autoLayout } = useStudio();
  const bare = pathname === "/signed-out";
  const lockedCanvas = /^\/diagrams\/[^/]+$/.test(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (loading || !snapshot) return;
    if (!snapshot.session.signedIn && pathname !== "/signed-out") router.replace("/signed-out");
    if (snapshot.session.signedIn && pathname === "/signed-out") router.replace("/");
  }, [loading, pathname, router, snapshot]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (!snapshot?.settings.keyboardShortcuts || !snapshot.session.signedIn || isTypingTarget(event.target)) return;
      const id = snapshot.settings.currentDiagramId;
      if (!id) return;
      const key = event.key.toLowerCase();
      if (key === "t") router.push(`/diagrams/${id}/tables/new`);
      if (key === "r") router.push(`/diagrams/${id}/relationships/new`);
      if (key === "l") void autoLayout(id);
      if (key === "e") router.push(`/import-export?diagram=${id}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoLayout, router, setSearchOpen, snapshot]);

  if (bare) return <div className="min-h-screen bg-background">{children}</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <MobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} mobileNavOpen={mobileNavOpen} />
        <main className={lockedCanvas ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-auto"}>
          {loading ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading studio…</div>
          ) : loadError ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-destructive">{loadError}</div>
          ) : (
            children
          )}
        </main>
      </div>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ERD Studio docs</DialogTitle>
            <DialogDescription>
              Diagrams, settings, and your profile are stored in <code>data/db.json</code> through the local API. A backend can replace that file later without changing these screens.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            <li><kbd className="text-foreground">T</kbd> add a table to the current diagram</li>
            <li><kbd className="text-foreground">R</kbd> add a relationship</li>
            <li><kbd className="text-foreground">L</kbd> auto-layout the canvas</li>
            <li><kbd className="text-foreground">E</kbd> open export</li>
            <li><kbd className="text-foreground">⌘K</kbd> search diagrams, tables, and templates</li>
          </ul>
          <p className="text-[13px] text-muted-foreground">
            Drag a table to move it. Drag from a field handle to another field to draw a relationship. Double-click a table to edit its fields.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
