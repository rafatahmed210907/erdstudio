"use client";

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type Edge, type EdgeProps } from "@xyflow/react";

export type RelationEdgeData = { cardinality: string };
export type RelationFlowEdge = Edge<RelationEdgeData, "relation">;

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  style,
  markerEnd,
}: EdgeProps<RelationFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="nodrag nopan pointer-events-none absolute rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm"
        >
          <span className="mr-1 font-medium text-foreground">{label}</span>
          {data?.cardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
