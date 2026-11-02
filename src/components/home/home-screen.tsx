"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, Download, FileUp, Moon, Plus, Share2, Wand2 } from "lucide-react";
import { DiagramView } from "@/components/diagram/diagram-view";
import { CreateDiagramDialog } from "@/components/diagrams/create-diagram-dialog";
import { DiagramCard } from "@/components/diagrams/diagram-card";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";

const PILLS = [
  { icon: Share2, label: "SQL & NoSQL" },
  { icon: Cloud, label: "Auto Save" },
  { icon: Download, label: "Export (SQL, JSON, PDF)" },
  { icon: Moon, label: "Dark / Light Mode" },
];

const FEATURES = [
  { icon: Wand2, title: "Drag & Drop Editor", body: "Move tables, create relationships, customize your schema." },
  { icon: Share2, title: "Smart Relationships", body: "Add and edit relations with clickable connections." },
  { icon: Download, title: "Flexible Export", body: "Export as SQL, JSON, PDF, PNG, or JPEG." },
  { icon: FileUp, title: "Import Support", body: "Bring in existing schemas from SQL or JSON." },
  { icon: Cloud, title: "Autosave", body: "Never lose your progress. Saved automatically." },
];

export function HomeScreen() {
  const router = useRouter();
  const { snapshot, currentDiagram, createFromTemplate } = useStudio();
  const [createOpen, setCreateOpen] = useState(false);
  if (!snapshot) return null;

  return (
    <div className="animate-fade-in space-y-8 px-6 py-6">
      <section className="grid items-stretch gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(560px,1.18fr)]">
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">WELCOME TO ERD STUDIO</p>
          <h1 className="mt-3 max-w-md text-4xl font-semibold tracking-tight text-balance">
            Design your database <span className="text-primary">visually.</span>
          </h1>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-muted-foreground">
            Create, edit and manage your database schemas with an intuitive drag-and-drop interface. Support for SQL and NoSQL. Export, import and collaborate — all in one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create New Diagram
            </Button>
            <Button variant="outline" onClick={() => router.push("/import-export")}>
              <FileUp className="h-4 w-4" /> Import Diagram
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
            {PILLS.map((pill) => (
              <span key={pill.label} className="inline-flex items-center gap-1.5">
                <pill.icon className="h-3.5 w-3.5" />
                {pill.label}
              </span>
            ))}
          </div>
        </div>
        <div className="relative h-[460px] overflow-hidden rounded-xl border border-border bg-card">
          {currentDiagram ? (
            <DiagramView diagramId={currentDiagram.id} mode="embedded" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Create a diagram to see it here.</div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Recent Diagrams</h2>
            <Link href="/diagrams" className="text-[12px] text-primary">
              View all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.diagrams.slice(0, 4).map((diagram) => (
              <DiagramCard key={diagram.id} diagram={diagram} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Templates</h2>
            <Link href="/templates" className="text-[12px] text-primary">
              View all →
            </Link>
          </div>
          <div className="grid gap-3">
            {snapshot.templates.map((template) => (
              <article key={template.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                <div>
                  <h3 className="text-[13px] font-semibold">{template.name}</h3>
                  <p className="mt-1 text-[12px] text-muted-foreground">{template.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void createFromTemplate(template.id).then((diagram) => router.push(`/diagrams/${diagram.id}`))}
                >
                  Use template
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/60 p-4">
        <h2 className="text-[15px] font-semibold">Everything you need for database design</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <feature.icon className="h-4 w-4 text-primary" />
              <h3 className="mt-2 text-[13px] font-semibold">{feature.title}</h3>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
      <CreateDiagramDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
