"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useStudio } from "@/components/studio-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { engineBadge, type Diagram } from "@/lib/data/types";
import { useIsClient } from "@/lib/use-client";
import { formatRelative } from "@/lib/utils";

export function DiagramCard({ diagram }: { diagram: Diagram }) {
  const router = useRouter();
  const { duplicateDiagram, deleteDiagram, updateDiagram, updateSettings } = useStudio();
  const isClient = useIsClient();
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(diagram.name);

  return (
    <article className="rounded-xl border border-border bg-card p-3 transition-colors duration-fast hover:border-primary/40">
      <button className="block w-full text-left" onClick={() => void updateSettings({ currentDiagramId: diagram.id }).then(() => router.push(`/diagrams/${diagram.id}`))}>
        <div className="mb-3 flex h-24 items-end gap-2 rounded-lg bg-canvas p-3">
          {diagram.tables.slice(0, 3).map((table) => (
            <div key={table.id} className="w-16 overflow-hidden rounded-md border bg-card" style={{ borderColor: table.style.border }}>
              <div className="h-2" style={{ background: table.style.header }} />
              <div className="space-y-1 p-1.5">
                {table.fields.slice(0, 3).map((field) => (
                  <div key={field.id} className="h-1 rounded-full bg-foreground/15" />
                ))}
              </div>
            </div>
          ))}
          {diagram.tables.length === 0 && <p className="text-[12px] text-muted-foreground">Empty canvas</p>}
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-semibold">{diagram.name}</h3>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{diagram.description || "No description yet."}</p>
          </div>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{isClient ? formatRelative(diagram.updatedAt) : "Saved locally"}</span>
        <div className="flex items-center gap-1">
          <Badge>{engineBadge(diagram.engine)}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger className="grid h-7 w-7 place-items-center rounded-md hover:bg-secondary" aria-label={`Actions for ${diagram.name}`}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/diagrams/${diagram.id}`)}>Open</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setName(diagram.name);
                  setRenameOpen(true);
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void duplicateDiagram(diagram.id).then((copy) => router.push(`/diagrams/${copy.id}`))}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => void deleteDiagram(diagram.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename diagram</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Diagram name" />
          <Button
            onClick={() =>
              void updateDiagram(diagram.id, { name }).then(() => setRenameOpen(false))
            }
          >
            Save name
          </Button>
        </DialogContent>
      </Dialog>
    </article>
  );
}
