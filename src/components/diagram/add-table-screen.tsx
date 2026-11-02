"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldEditor } from "@/components/diagram/field-editor";
import { TablePreview } from "@/components/diagram/table-preview";
import { useStudio } from "@/components/studio-provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { COLOR_PRESETS, ENGINE_LABEL, type Engine, type Field, type Table } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function AddTableScreen({ diagramId }: { diagramId: string }) {
  const router = useRouter();
  const { snapshot, saveTable } = useStudio();
  const diagram = snapshot?.diagrams.find((item) => item.id === diagramId);
  const engineDefault = diagram?.engine ?? "postgresql";
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [engine, setEngine] = useState<Engine>(engineDefault === "hybrid" ? "postgresql" : engineDefault);
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState(COLOR_PRESETS[0]);
  const [fields, setFields] = useState<Field[]>([
    { id: crypto.randomUUID(), name: "id", type: engineDefault === "mongodb" ? "ObjectId" : "UUID", key: "pk", notNull: true, unique: true },
  ]);
  const [pending, setPending] = useState(false);

  const draft = useMemo<Table>(
    () => ({
      id: "draft",
      name,
      schema,
      engine,
      description,
      position: { x: 80, y: 80 },
      style,
      fields,
    }),
    [description, engine, fields, name, schema, style],
  );

  if (!diagram) return <p className="p-6 text-sm text-muted-foreground">Diagram not found.</p>;

  async function create() {
    setPending(true);
    const offset = diagram!.tables.length;
    try {
      await saveTable(diagramId, {
        ...draft,
        id: crypto.randomUUID(),
        position: { x: 80 + (offset % 3) * 300, y: 80 + Math.floor(offset / 3) * 220 },
      });
      router.push(`/diagrams/${diagramId}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="animate-fade-in px-6 py-5">
      <h1 className="text-2xl font-semibold tracking-tight">Add New Table</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Create a table in your database schema. Configure fields, constraints and styling options below.</p>
      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-xl border border-border bg-card p-4">
              <SectionTitle index="1" title="Table Information" />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input id="table-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="products" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="schema">Schema / Collection</Label>
                  <Input id="schema" value={schema} onChange={(event) => setSchema(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Database Engine</Label>
                  <Select value={engine} onValueChange={(value) => setEngine(value as Engine)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENGINE_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
                <p className="text-right text-[11px] text-muted-foreground">{description.length}/500</p>
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-[13px] font-semibold">Table Style</h2>
              <div className="mt-3 flex gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.header}
                    aria-label={`Use ${preset.header}`}
                    className={cn("h-5 w-5 rounded-full", style.header === preset.header && "ring-2 ring-primary ring-offset-2 ring-offset-card")}
                    style={{ background: preset.header }}
                    onClick={() => setStyle(preset)}
                  />
                ))}
              </div>
              <StyleField label="Table Color" value={style.header} onChange={(header) => setStyle({ ...style, header })} />
              <StyleField label="Title Color" value={style.title} onChange={(title) => setStyle({ ...style, title })} />
              <StyleField label="Text Color" value={style.text} onChange={(text) => setStyle({ ...style, text })} />
              <StyleField label="Border Color" value={style.border} onChange={(border) => setStyle({ ...style, border })} />
            </section>
          </div>
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle index="2" title="Fields" />
            </div>
            <FieldEditor fields={fields} engine={engine} onChange={setFields} />
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-[12px] text-muted-foreground">Default values and comments are stored with each field.</p>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid gap-2 md:grid-cols-[140px_1fr_1fr]">
                        <span className="self-center truncate text-[12px]">{field.name || "untitled"}</span>
                        <Input
                          placeholder="Default value"
                          value={field.defaultValue ?? ""}
                          onChange={(event) =>
                            setFields(fields.map((item, itemIndex) => (itemIndex === index ? { ...item, defaultValue: event.target.value } : item)))
                          }
                        />
                        <Input
                          placeholder="Comment"
                          value={field.comment ?? ""}
                          onChange={(event) =>
                            setFields(fields.map((item, itemIndex) => (itemIndex === index ? { ...item, comment: event.target.value } : item)))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push(`/diagrams/${diagramId}`)}>
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void create()}>
              <span className="text-base leading-none">+</span> Create Table
            </Button>
          </div>
        </div>
        <aside className="sticky top-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Live Preview</h2>
          </div>
          <Tabs defaultValue={snapshot?.settings.defaultView ?? "table"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="sql">SQL View</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <TablePreview table={draft} engine={engine} view="table" />
            </TabsContent>
            <TabsContent value="sql">
              <TablePreview table={draft} engine={engine} view="sql" />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[13px] font-semibold">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">{index}</span>
      {title}
    </h2>
  );
}

function StyleField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mt-2 flex items-center justify-between gap-2 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <Input className="h-8 w-28 font-mono text-[11px]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
