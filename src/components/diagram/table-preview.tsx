"use client";

import { KeyRound } from "lucide-react";
import type { Engine, Table } from "@/lib/data/types";
import { engineBadge } from "@/lib/data/types";
import { previewTable } from "@/lib/sql";

export function TablePreview({ table, engine, view }: { table: Table; engine: Engine; view: "table" | "sql" }) {
  if (view === "sql") {
    return (
      <pre className="max-h-[520px] overflow-auto rounded-lg bg-[#07101f] p-3 font-mono text-[11px] leading-5 text-slate-200">
        {previewTable(table, engine)}
      </pre>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-[#0c1428]" style={{ borderColor: table.style.border }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: table.style.header, color: table.style.title }}>
        <span className="font-semibold">{table.name || "untitled"}</span>
        <span className="text-[10px] uppercase">{engineBadge(table.engine)}</span>
      </div>
      {table.description && <p className="px-3 py-2 text-[12px] leading-5 text-slate-300">{table.description}</p>}
      <div>
        {table.fields.map((field) => (
          <div key={field.id} className="flex items-center gap-2 border-t border-white/5 px-3 py-1.5 text-[12px] text-slate-100">
            {field.key === "pk" ? <KeyRound className="h-3 w-3 text-amber-300" /> : <span className="inline-block h-3 w-3 rounded-full border border-slate-500" />}
            <span className="truncate">{field.name || "field"}</span>
            <span className="ml-auto text-[10px] text-slate-400">{field.type}</span>
            {field.key === "pk" && <span className="text-[10px] text-amber-200">PK</span>}
            {field.notNull && <span className="text-[10px] text-slate-400">NN</span>}
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 px-3 py-2 text-[11px] text-slate-400">
        {table.fields.length} fields · {engineBadge(engine)}
      </div>
    </div>
  );
}
