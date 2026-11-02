"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateDiagramDialog } from "@/components/diagrams/create-diagram-dialog";
import { DiagramCard } from "@/components/diagrams/diagram-card";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";

export function DiagramsScreen() {
  const { snapshot } = useStudio();
  const [open, setOpen] = useState(false);
  if (!snapshot) return null;

  return (
    <div className="animate-fade-in px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Diagrams</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{snapshot.diagrams.length} stored on this device.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create New Diagram
        </Button>
      </div>
      {snapshot.diagrams.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No diagrams yet. Create one or start from a template.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>Create New Diagram</Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.diagrams.map((diagram) => (
            <DiagramCard key={diagram.id} diagram={diagram} />
          ))}
        </div>
      )}
      <CreateDiagramDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
