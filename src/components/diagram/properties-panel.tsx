"use client";

import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COLOR_PRESETS, type Table, type TableStyle } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function PropertiesPanel({
  table,
  onChange,
  open,
  onOpenChange,
}: {
  table: Table | null;
  onChange: (patch: Partial<Table>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          aria-label="Close table properties"
          onClick={() => onOpenChange(false)}
        />
      )}

      {!open && (
        <button
          type="button"
          className="absolute right-0 top-[calc(50%+2.5rem)] z-10 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-lg border border-r-0 border-border bg-card/95 px-1.5 py-2.5 text-[10px] font-medium text-muted-foreground shadow-md hover:bg-secondary hover:text-foreground"
          aria-label="Expand table properties"
          aria-expanded={false}
          onClick={() => onOpenChange(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="[writing-mode:vertical-rl] rotate-180">Properties</span>
        </button>
      )}

      <aside
        className={cn(
          "flex shrink-0 flex-col border-border bg-card/90 transition-[width,transform,opacity] duration-200 ease-out",
          open
            ? "w-[min(288px,100vw)] border-l opacity-100 max-lg:fixed max-lg:right-0 max-lg:top-14 max-lg:z-40 max-lg:h-[calc(100%-3.5rem)] max-lg:shadow-2xl"
            : "pointer-events-none w-0 overflow-hidden border-0 opacity-0 max-lg:fixed max-lg:right-0 max-lg:top-14 max-lg:z-40 max-lg:h-[calc(100%-3.5rem)] max-lg:translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex h-full min-w-[288px] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold">Table Properties</h2>
              {table && (
                <p className="truncate text-[11px] text-muted-foreground">{table.name}</p>
              )}
            </div>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Collapse table properties"
              aria-expanded={open}
              onClick={() => onOpenChange(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <PropertiesBody table={table} onChange={onChange} />
          </div>
        </div>
      </aside>
    </>
  );
}

function PropertiesBody({
  table,
  onChange,
}: {
  table: Table | null;
  onChange: (patch: Partial<Table>) => void;
}) {
  if (!table) {
    return (
      <p className="text-[12px] leading-5 text-muted-foreground">
        Select a table on the canvas to edit its name, engine, and colors.
      </p>
    );
  }

  const current = table;
  const sql = current.engine !== "mongodb";

  function setStyle(patch: Partial<TableStyle>) {
    onChange({ style: { ...current.style, ...patch } });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="table-name">Name</Label>
        <Input
          id="table-name"
          key={`${current.id}:${current.name}`}
          defaultValue={current.name}
          onBlur={(event) => {
            if (event.target.value !== current.name) onChange({ name: event.target.value });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Database</Label>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
          <button
            type="button"
            className={cn("rounded-md py-1 text-[12px]", sql && "bg-primary text-primary-foreground")}
            onClick={() => onChange({ engine: current.engine === "mongodb" ? "postgresql" : current.engine })}
          >
            SQL
          </button>
          <button
            type="button"
            className={cn("rounded-md py-1 text-[12px]", !sql && "bg-primary text-primary-foreground")}
            onClick={() => onChange({ engine: "mongodb", schema: current.name })}
          >
            NoSQL
          </button>
        </div>
      </div>
      <ColorRow label="Background" value={current.style.header} onChange={(header) => setStyle({ header })} />
      <ColorRow label="Text Color" value={current.style.title} onChange={(title) => setStyle({ title })} />
      <ColorRow label="Outline Color" value={current.style.border} onChange={(border) => setStyle({ border })} />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((preset, index) => {
          const swatch = label === "Text Color" ? preset.title : label === "Outline Color" ? preset.border : preset.header;
          return (
            <button
              key={`${label}-${index}`}
              type="button"
              aria-label={`${label} ${swatch}`}
              className={cn(
                "h-5 w-5 rounded-full border border-white/20",
                value.toLowerCase() === swatch.toLowerCase() && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
              style={{ background: swatch }}
              onClick={() => onChange(swatch)}
            />
          );
        })}
      </div>
      <Input value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label} hex`} />
    </div>
  );
}
