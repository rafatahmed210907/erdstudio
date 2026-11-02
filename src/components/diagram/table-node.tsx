"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { KeyRound } from "lucide-react";
import type { Table } from "@/lib/data/types";
import { engineBadge } from "@/lib/data/types";
import { TABLE_NODE_WIDTH } from "@/lib/diagram/constants";
import { cn } from "@/lib/utils";

export type TableNodeData = { table: Table; showHandles: boolean };
export type TableFlowNode = Node<TableNodeData, "table">;

export function TableNode({ data, selected }: NodeProps<TableFlowNode>) {
  const { table, showHandles } = data;
  return (
    <div
      className={cn("overflow-visible rounded-lg text-[12px] shadow-lg", selected && "ring-2 ring-primary")}
      style={{ width: TABLE_NODE_WIDTH }}
    >
      <div className="overflow-hidden rounded-lg border bg-[#0c1428]" style={{ borderColor: table.style.border }}>
        <div className="flex items-center justify-between gap-2 px-3.5 py-2" style={{ background: table.style.header, color: table.style.title }}>
          <span className="min-w-0 truncate font-semibold">{table.name}</span>
          <span className="shrink-0 rounded bg-black/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            {engineBadge(table.engine)}
          </span>
        </div>
        {table.description && (
          <p className="border-b border-white/5 px-3.5 py-1.5 text-[11px] leading-4 text-slate-300">{table.description}</p>
        )}
        <div>
          {table.fields.map((field) => (
            <div
              key={field.id}
              className="relative flex items-center gap-1.5 border-t border-white/5 py-1.5 pl-5 pr-5"
              style={{ color: table.style.text }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`${field.id}:in`}
                className={cn("!-left-1 !h-2.5 !w-2.5 !border-0 !bg-sky-300", !showHandles && "!opacity-0")}
              />
              {field.key === "pk" ? <KeyRound className="h-3 w-3 shrink-0 text-amber-300" /> : <span className="h-3 w-3 shrink-0" />}
              <span className="min-w-0 flex-1 truncate font-medium text-slate-100">{field.name}</span>
              <span className="shrink-0 text-[10px] uppercase text-slate-400">{field.type}</span>
              {field.key === "pk" && <span className="shrink-0 text-[10px] text-amber-200">PK</span>}
              {field.key === "fk" && <span className="shrink-0 text-[10px] text-sky-300">FK</span>}
              {field.notNull && <span className="shrink-0 text-[10px] text-slate-400">NN</span>}
              <Handle
                type="source"
                position={Position.Right}
                id={`${field.id}:out`}
                className={cn("!-right-1 !h-2.5 !w-2.5 !border-0 !bg-sky-300", !showHandles && "!opacity-0")}
              />
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 px-3.5 py-1.5 text-[10px] text-slate-400">
          {table.fields.length} fields · {engineBadge(table.engine)}
        </div>
      </div>
    </div>
  );
}
