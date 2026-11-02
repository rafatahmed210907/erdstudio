"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cardinality } from "@/lib/data/types";

export function AddRelationshipScreen({ diagramId }: { diagramId: string }) {
  const router = useRouter();
  const { snapshot, saveRelationship } = useStudio();
  const diagram = snapshot?.diagrams.find((item) => item.id === diagramId);
  const [fromTableId, setFromTableId] = useState(diagram?.tables[0]?.id ?? "");
  const [toTableId, setToTableId] = useState(diagram?.tables[1]?.id ?? diagram?.tables[0]?.id ?? "");
  const fromTable = diagram?.tables.find((table) => table.id === fromTableId);
  const toTable = diagram?.tables.find((table) => table.id === toTableId);
  const [fromFieldId, setFromFieldId] = useState(fromTable?.fields[0]?.id ?? "");
  const [toFieldId, setToFieldId] = useState(toTable?.fields[0]?.id ?? "");
  const [label, setLabel] = useState("references");
  const [cardinality, setCardinality] = useState<Cardinality>("1:N");
  const [pending, setPending] = useState(false);

  if (!diagram) return <p className="p-6 text-sm text-muted-foreground">Diagram not found.</p>;

  async function create() {
    setPending(true);
    try {
      await saveRelationship(diagramId, {
        id: crypto.randomUUID(),
        fromTableId,
        fromFieldId,
        toTableId,
        toFieldId,
        label,
        cardinality,
      });
      router.push(`/diagrams/${diagramId}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-6 py-5">
      <h1 className="text-2xl font-semibold tracking-tight">Add Relationship</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Connect two fields. You can also draw this directly on the canvas.</p>
      <section className="mt-5 space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FieldSelect label="From table" value={fromTableId} options={diagram.tables.map((table) => ({ value: table.id, label: table.name }))} onChange={setFromTableId} />
          <FieldSelect
            label="From field"
            value={fromFieldId}
            options={(fromTable?.fields ?? []).map((field) => ({ value: field.id, label: field.name }))}
            onChange={setFromFieldId}
          />
          <FieldSelect label="To table" value={toTableId} options={diagram.tables.map((table) => ({ value: table.id, label: table.name }))} onChange={setToTableId} />
          <FieldSelect
            label="To field"
            value={toFieldId}
            options={(toTable?.fields ?? []).map((field) => ({ value: field.id, label: field.name }))}
            onChange={setToFieldId}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <Input id="label" value={label} onChange={(event) => setLabel(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cardinality</Label>
            <Select value={cardinality} onValueChange={(value) => setCardinality(value as Cardinality)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="1:N">1:N</SelectItem>
                <SelectItem value="N:M">N:M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-canvas px-4 py-6 text-center text-[13px]">
          <span className="font-medium text-foreground">{fromTable?.name ?? "?"}</span>
          <span className="mx-2 text-muted-foreground">{label || "relationship"}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">{cardinality}</span>
          <span className="mx-2 text-muted-foreground">→</span>
          <span className="font-medium text-foreground">{toTable?.name ?? "?"}</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(`/diagrams/${diagramId}`)}>
            Cancel
          </Button>
          <Button disabled={pending || !fromFieldId || !toFieldId} onClick={() => void create()}>
            Create relationship
          </Button>
        </div>
      </section>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
