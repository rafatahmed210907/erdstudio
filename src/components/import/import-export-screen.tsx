"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DiagramView } from "@/components/diagram/diagram-view";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readExport } from "@/lib/api-client";
import type { Diagram } from "@/lib/data/types";
import { toast } from "sonner";

export function ImportExportScreen() {
  const params = useSearchParams();
  const { snapshot, importDiagram } = useStudio();
  const initial = params.get("diagram") ?? snapshot?.settings.currentDiagramId ?? snapshot?.diagrams[0]?.id ?? "";
  const [diagramId, setDiagramId] = useState(initial);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const diagram = snapshot?.diagrams.find((item) => item.id === diagramId) ?? null;

  const fileName = useMemo(() => diagram?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "diagram", [diagram?.name]);

  async function download(format: "json" | "sql") {
    if (!diagramId) return;
    setBusy(true);
    try {
      const file = await readExport(diagramId, format);
      setPreview(file.body);
      const blob = new Blob([file.body], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPng() {
    const node = document.querySelector("[data-export-canvas] .react-flow") as HTMLElement | null;
    if (!node) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
  }

  async function onImport(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as Diagram | { diagram: Diagram };
    const diagramPayload = "tables" in parsed ? parsed : parsed.diagram;
    const created = await importDiagram(diagramPayload);
    setDiagramId(created.id);
    toast.success(`${created.name} imported`);
  }

  if (!snapshot) return null;

  return (
    <div className="animate-fade-in grid gap-4 px-6 py-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Import / Export</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Bring in a JSON diagram or download the current one.</p>
        </div>
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-[13px] font-semibold">Import JSON</h2>
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Import diagram JSON"
            className="block w-full text-[12px]"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImport(file).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Import failed"));
            }}
          />
        </section>
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-[13px] font-semibold">Export</h2>
          <Select value={diagramId} onValueChange={setDiagramId}>
            <SelectTrigger aria-label="Diagram to export">
              <SelectValue placeholder="Choose a diagram" />
            </SelectTrigger>
            <SelectContent>
              {snapshot.diagrams.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !diagramId} onClick={() => void download("json")}>JSON</Button>
            <Button disabled={busy || !diagramId} variant="outline" onClick={() => void download("sql")}>SQL</Button>
            <Button disabled={!diagramId} variant="outline" onClick={() => void downloadPng()}>PNG</Button>
            <Button disabled={!diagramId} variant="outline" onClick={() => window.print()}>PDF</Button>
          </div>
          {preview && (
            <pre className="max-h-64 overflow-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-5">{preview}</pre>
          )}
        </section>
      </div>
      <div data-export-canvas className="h-[560px] overflow-hidden rounded-xl border border-border print:h-auto">
        {diagram ? <DiagramView diagramId={diagram.id} mode="readonly" /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Nothing to export.</div>}
      </div>
    </div>
  );
}
