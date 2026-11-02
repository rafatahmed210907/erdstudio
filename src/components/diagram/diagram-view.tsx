"use client";

import dynamic from "next/dynamic";

export const DiagramView = dynamic(
  () => import("@/components/diagram/diagram-canvas").then((mod) => mod.DiagramCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[280px] place-items-center text-sm text-muted-foreground">Loading canvas…</div>
    ),
  },
);
