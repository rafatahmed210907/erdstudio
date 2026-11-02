"use client";

import { useRef } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Engine, Field, FieldKey } from "@/lib/data/types";
import { typesForEngine } from "@/lib/data/types";

export function FieldEditor({
  fields,
  engine,
  onChange,
}: {
  fields: Field[];
  engine: Engine;
  onChange: (fields: Field[]) => void;
}) {
  const dragIndex = useRef<number | null>(null);
  const types = typesForEngine(engine);

  function update(index: number, patch: Partial<Field>) {
    onChange(fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)));
  }

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[20px_1.3fr_1fr_0.8fr_150px_32px] gap-2 px-1 text-[11px] uppercase tracking-wide text-muted-foreground md:grid">
        <span />
        <span>Field Name</span>
        <span>Data Type</span>
        <span>Key</span>
        <span>Constraints</span>
        <span />
      </div>
      {fields.map((field, index) => (
        <div
          key={field.id}
          draggable
          onDragStart={() => {
            dragIndex.current = index;
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragIndex.current === null) return;
            move(dragIndex.current, index);
            dragIndex.current = null;
          }}
          className="grid items-center gap-2 rounded-lg border border-transparent px-1 py-1 hover:border-border md:grid-cols-[20px_1.3fr_1fr_0.8fr_150px_32px]"
        >
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
          <Input value={field.name} aria-label="Field name" onChange={(event) => update(index, { name: event.target.value })} />
          <Select value={field.type} onValueChange={(type) => update(index, { type })}>
            <SelectTrigger aria-label="Data type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[field.type, ...types.filter((type) => type !== field.type)].map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={field.key} onValueChange={(key) => update(index, { key: key as FieldKey })}>
            <SelectTrigger aria-label="Key">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pk">Primary Key</SelectItem>
              <SelectItem value="fk">Foreign Key</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3 text-[12px]">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={field.notNull} onCheckedChange={(checked) => update(index, { notNull: checked === true })} />
              Not Null
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={field.unique} onCheckedChange={(checked) => update(index, { unique: checked === true })} />
              Unique
            </label>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
            aria-label={`Delete ${field.name || "field"}`}
            onClick={() => onChange(fields.filter((_, fieldIndex) => fieldIndex !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...fields,
            {
              id: crypto.randomUUID(),
              name: "",
              type: types[0] ?? "TEXT",
              key: "none",
              notNull: false,
              unique: false,
            },
          ])
        }
      >
        <Plus className="h-3.5 w-3.5" /> Add Field
      </Button>
    </div>
  );
}
