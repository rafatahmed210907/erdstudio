"use client";

import { useRouter } from "next/navigation";
import { useStudio } from "@/components/studio-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { engineBadge } from "@/lib/data/types";

export function TemplatesScreen() {
  const router = useRouter();
  const { snapshot, createFromTemplate } = useStudio();
  if (!snapshot) return null;

  return (
    <div className="animate-fade-in px-6 py-6">
      <h1 className="text-2xl font-semibold">Templates</h1>
      <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">Start from a schema instead of a blank canvas. Using a template clones it into your diagrams.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {snapshot.templates.map((template) => (
          <article key={template.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">{template.name}</h2>
              <Badge>{engineBadge(template.engine)}</Badge>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{template.description}</p>
            <p className="mt-3 text-[12px] text-muted-foreground">{template.diagram.tables.length} tables</p>
            <Button className="mt-4" onClick={() => void createFromTemplate(template.id).then((diagram) => router.push(`/diagrams/${diagram.id}`))}>
              Use template
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
